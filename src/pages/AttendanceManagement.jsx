import React, { useState, useEffect } from 'react';
import { CheckCircle, Cancel, AccessTime, Edit, Search } from '@mui/icons-material';
import {
    Box, Paper, Typography, Button, Card, CardContent, Grid,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Alert, Chip, CircularProgress, TextField, MenuItem, Tabs, Tab,
    Dialog, DialogTitle, DialogContent, DialogActions, FormControl,
    InputLabel, Select, IconButton, TablePagination, InputAdornment
} from '@mui/material';
import { attendanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import EmployeeAttendanceList from '../components/attendance/EmployeeAttendanceList';
import MonthlyAttendanceView from '../components/attendance/MonthlyAttendanceView';
import AttendanceExport from '../components/attendance/AttendanceExport';
import AccessDenied from '../components/access/AccessDenied';

const AttendanceManagement = () => {
    const { user, isHR } = useAuth();
    const [loading, setLoading] = useState(true);
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [allAttendance, setAllAttendance] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [message, setMessage] = useState({ type: '', text: '' });
    const [stats, setStats] = useState({ present: 0, absent: 0, total: 0 });
    const [tabValue, setTabValue] = useState(0);

    // Filter states for HR
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        employeeId: ''
    });

    const [editDialog, setEditDialog] = useState({ open: false, record: null });
    const [editStatus, setEditStatus] = useState('');

    // Permission dialog state
    const [permissionDialog, setPermissionDialog] = useState(false);
    const [permissionFrom, setPermissionFrom] = useState('');
    const [permissionTo, setPermissionTo] = useState('');
    const [permissionError, setPermissionError] = useState('');

    // Employee table state
    const [empSearch, setEmpSearch] = useState('');
    const [empStatusFilter, setEmpStatusFilter] = useState('All');
    const [empPage, setEmpPage] = useState(0);
    const [empRowsPerPage, setEmpRowsPerPage] = useState(10);

    // HR table state
    const [hrSearch, setHrSearch] = useState('');
    const [hrStatusFilter, setHrStatusFilter] = useState('All');
    const [hrPage, setHrPage] = useState(0);
    const [hrRowsPerPage, setHrRowsPerPage] = useState(10);

    useEffect(() => {
        loadData();
        // Update time every second
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load personal data for marking attendance (for both Employee and HR)
            if (user?.employeeId) {
                // Extract employeeId as string (handle both object and string formats)
                const employeeId = typeof user.employeeId === 'object'
                    ? user.employeeId._id || user.employeeId.id
                    : user.employeeId;

                const [todayResponse, historyResponse] = await Promise.all([
                    attendanceAPI.getTodayStatus(),
                    attendanceAPI.getByEmployee(employeeId, {
                        month: new Date().getMonth() + 1,
                        year: new Date().getFullYear()
                    })
                ]);

                setTodayAttendance(todayResponse.data);

                // Only set history/stats from this if NOT HR (HR sees all in different view)
                // OR if HR, maybe we want to show their personal stats in a specific tab or section?
                // For now, let's keep the history section optional/shared or just for marking.
                if (!isHR) {
                    setAttendanceHistory(historyResponse.data);
                    calculateStats(historyResponse.data);
                }
            }

            if (isHR) {
                // Load all attendance for HR management view
                const response = await attendanceAPI.getAll();
                setAllAttendance(response.data);
                // stats for HR might be global stats, or we can keep personal stats separate.
                // existing code `calculateStats(response.data)` overwrote personal stats.
                // Let's separate them.
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to load attendance data'
            });
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const present = data.filter(a => a.status === 'Present').length;
        const absent = data.filter(a => a.status === 'Absent').length;
        setStats({ present, absent, total: data.length });
    };

    const markAttendance = async (status, extraData = {}) => {
        if (todayAttendance) {
            setMessage({
                type: 'warning',
                text: `Attendance already marked as "${todayAttendance.status}" today. You can only mark attendance once per day.`
            });
            return;
        }
        try {
            setMessage({ type: '', text: '' });
            const response = await attendanceAPI.markAttendance({ status, ...extraData });
            setTodayAttendance(response.data);
            setMessage({
                type: 'success',
                text: `Attendance marked as ${status} successfully!`
            });
            loadData(); // Reload to update history
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to mark attendance'
            });
        }
    };

    const handlePermissionClick = () => {
        if (todayAttendance) {
            setMessage({
                type: 'warning',
                text: `Attendance already marked as "${todayAttendance.status}" today. You can only mark attendance once per day.`
            });
            return;
        }
        setPermissionFrom('');
        setPermissionTo('');
        setPermissionError('');
        setPermissionDialog(true);
    };

    const handlePermissionSubmit = async () => {
        if (!permissionFrom || !permissionTo) {
            setPermissionError('Please select both From Time and To Time.');
            return;
        }
        if (permissionFrom >= permissionTo) {
            setPermissionError('"To Time" must be after "From Time".');
            return;
        }
        setPermissionDialog(false);
        await markAttendance('Permission', { permissionFrom, permissionTo });
    };

    const handleEditAttendance = (record) => {
        setEditDialog({ open: true, record });
        setEditStatus(record.status);
    };

    const handleSaveEdit = async () => {
        try {
            setMessage({ type: '', text: '' });
            await attendanceAPI.editAttendance(editDialog.record._id, { status: editStatus });
            setEditDialog({ open: false, record: null });
            setMessage({
                type: 'success',
                text: 'Attendance updated successfully!'
            });
            loadData(); // Reload data
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to update attendance'
            });
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Present': return 'success';
            case 'Absent': return 'error';
            case 'Permission': return 'warning';
            case 'Half Day': return 'warning';
            case 'Work From Home': return 'info';
            default: return 'default';
        }
    };

    // Check if employee has data access
    if (!isHR && user && !user.hasDataAccess) {
        return <AccessDenied />;
    }

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Attendance Management
            </Typography>

            {message.text && (
                <Alert severity={message.type} onClose={() => setMessage({ type: '', text: '' })} sx={{ mb: 2 }}>
                    {message.text}
                </Alert>
            )}

            {/* Current Date and Time */}
            <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #030303ff 0%, #32323bff 100%)', color: 'white' }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item>
                            <AccessTime sx={{ fontSize: 48 }} />
                        </Grid>
                        <Grid item xs>
                            <Typography variant="h5">
                                {formatDate(currentTime)}
                            </Typography>
                            <Typography variant="h3">
                                {formatTime(currentTime)}
                            </Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Attendance Marking Section - Visible for both Employee and HR */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Mark Today's Attendance
                </Typography>

                {/* Current Status Display */}
                {todayAttendance && (
                    <Card sx={{
                        mb: 3,
                        background: todayAttendance.status === 'Present'
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' // Purple/Blue gradient for Present
                            : todayAttendance.status === 'Absent'
                                ? 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' // Reddish for Absent
                                : 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', // Light Blue for Permission
                        color: todayAttendance.status === 'Permission' || todayAttendance.status === 'Absent' ? 'black' : 'white'
                    }}>
                        <CardContent>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item>
                                    {todayAttendance.status === 'Present' ? (
                                        <CheckCircle sx={{ fontSize: 48 }} />
                                    ) : todayAttendance.status === 'Absent' ? (
                                        <Cancel sx={{ fontSize: 48 }} />
                                    ) : (
                                        <AccessTime sx={{ fontSize: 48 }} />
                                    )}
                                </Grid>
                                <Grid item xs>
                                    <Typography variant="h5">
                                        Current Status: {todayAttendance.status}
                                    </Typography>
                                    <Typography variant="body2">
                                        Marked at {formatTime(todayAttendance.checkIn)}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                )}

                {/* Action Buttons - Always Visible */}
                <Typography variant="subtitle2" gutterBottom sx={{ mb: 2, color: 'text.secondary' }}>
                    {todayAttendance ? 'Change your status:' : 'Select your status:'}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                        variant={todayAttendance?.status === 'Present' ? "outlined" : "contained"}
                        sx={{
                            flex: 1,
                            py: 1.5,
                            backgroundColor: todayAttendance?.status === 'Present' ? 'transparent' : '#4caf50',
                            color: todayAttendance?.status === 'Present' ? '#4caf50' : 'white',
                            borderColor: '#4caf50',
                            '&:hover': { backgroundColor: todayAttendance?.status === 'Present' ? 'rgba(76, 175, 80, 0.1)' : '#388e3c' }
                        }}
                        startIcon={<CheckCircle />}
                        onClick={() => markAttendance('Present')}
                    >
                        Mark Present
                    </Button>
                    <Button
                        variant={todayAttendance?.status === 'Permission' ? "outlined" : "contained"}
                        sx={{
                            flex: 1,
                            py: 1.5,
                            backgroundColor: todayAttendance?.status === 'Permission' ? 'transparent' : '#2196f3',
                            color: todayAttendance?.status === 'Permission' ? '#2196f3' : 'white',
                            borderColor: '#2196f3',
                            '&:hover': { backgroundColor: todayAttendance?.status === 'Permission' ? 'rgba(33, 150, 243, 0.1)' : '#1976d2' }
                        }}
                        startIcon={<AccessTime />}
                        onClick={handlePermissionClick}
                    >
                        Mark Permission
                    </Button>
                    <Button
                        variant={todayAttendance?.status === 'Absent' ? "outlined" : "contained"}
                        sx={{
                            flex: 1,
                            py: 1.5,
                            backgroundColor: todayAttendance?.status === 'Absent' ? 'transparent' : '#f44336',
                            color: todayAttendance?.status === 'Absent' ? '#f44336' : 'white',
                            borderColor: '#f44336',
                            '&:hover': { backgroundColor: todayAttendance?.status === 'Absent' ? 'rgba(244, 67, 54, 0.1)' : '#d32f2f' }
                        }}
                        startIcon={<Cancel />}
                        onClick={() => markAttendance('Absent')}
                    >
                        Mark Absent
                    </Button>
                </Box>
            </Paper>

            {/* Employee View (Stats & History) - Only for Employees (HR has their own view) */}
            {!isHR && (
                <>

                    {/* Statistics */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Total Days
                                    </Typography>
                                    <Typography variant="h4">
                                        {stats.total}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Present Days
                                    </Typography>
                                    <Typography variant="h4" color="success.main">
                                        {stats.present}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Absent Days
                                    </Typography>
                                    <Typography variant="h4" color="error.main">
                                        {stats.absent}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Attendance History */}
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Attendance History (Current Month)
                        </Typography>

                        {/* Search & Filter */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth size="small"
                                    placeholder="Search by date..."
                                    value={empSearch}
                                    onChange={(e) => { setEmpSearch(e.target.value); setEmpPage(0); }}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={empStatusFilter}
                                        label="Status"
                                        onChange={(e) => { setEmpStatusFilter(e.target.value); setEmpPage(0); }}
                                    >
                                        <MenuItem value="All">All Status</MenuItem>
                                        <MenuItem value="Present">Present</MenuItem>
                                        <MenuItem value="Absent">Absent</MenuItem>
                                        <MenuItem value="Permission">Permission</MenuItem>
                                        <MenuItem value="Half Day">Half Day</MenuItem>
                                        <MenuItem value="Work From Home">Work From Home</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Check In</TableCell>
                                        <TableCell>Total Hours</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(() => {
                                        const filtered = attendanceHistory.filter(r => {
                                            const dateMatch = !empSearch || formatDate(r.date).toLowerCase().includes(empSearch.toLowerCase());
                                            const statusMatch = empStatusFilter === 'All' || r.status === empStatusFilter;
                                            return dateMatch && statusMatch;
                                        });
                                        const paginated = filtered.slice(empPage * empRowsPerPage, empPage * empRowsPerPage + empRowsPerPage);
                                        if (filtered.length === 0) return (
                                            <TableRow><TableCell colSpan={4} align="center">No records found</TableCell></TableRow>
                                        );
                                        return paginated.map((record) => (
                                            <TableRow key={record._id}>
                                                <TableCell>{formatDate(record.date)}</TableCell>
                                                <TableCell>
                                                    <Chip label={record.status} color={getStatusColor(record.status)} size="small" />
                                                </TableCell>
                                                <TableCell>{record.checkIn ? formatTime(record.checkIn) : '-'}</TableCell>
                                                <TableCell>{record.totalHours || 0} hrs</TableCell>
                                            </TableRow>
                                        ));
                                    })()}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[10, 25, 50]}
                            component="div"
                            count={attendanceHistory.filter(r => {
                                const dateMatch = !empSearch || formatDate(r.date).toLowerCase().includes(empSearch.toLowerCase());
                                const statusMatch = empStatusFilter === 'All' || r.status === empStatusFilter;
                                return dateMatch && statusMatch;
                            }).length}
                            rowsPerPage={empRowsPerPage}
                            page={empPage}
                            onPageChange={(e, newPage) => setEmpPage(newPage)}
                            onRowsPerPageChange={(e) => { setEmpRowsPerPage(parseInt(e.target.value, 10)); setEmpPage(0); }}
                        />
                    </Paper>
                </>
            )}


            {/* HR View - Tabbed Interface */}
            {isHR && (
                <Box>
                    <Tabs
                        value={tabValue}
                        onChange={(e, newValue) => setTabValue(newValue)}
                        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
                    >
                        <Tab label="Mark Attendance" />
                        <Tab label="Day View" />
                        <Tab label="Month View" />
                        <Tab label="Export Report" />
                    </Tabs>

                    {/* Tab 0: Employee List for Marking Attendance */}
                    {tabValue === 0 && (
                        <EmployeeAttendanceList />
                    )}

                    {/* Tab 1: Day View (Existing Table) */}
                    {tabValue === 1 && (
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Day-wise Attendance
                            </Typography>

                            {/* Filters */}
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        fullWidth size="small"
                                        placeholder="Search employee name / ID..."
                                        value={hrSearch}
                                        onChange={(e) => { setHrSearch(e.target.value); setHrPage(0); }}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            value={hrStatusFilter}
                                            label="Status"
                                            onChange={(e) => { setHrStatusFilter(e.target.value); setHrPage(0); }}
                                        >
                                            <MenuItem value="All">All Status</MenuItem>
                                            <MenuItem value="Present">Present</MenuItem>
                                            <MenuItem value="Absent">Absent</MenuItem>
                                            <MenuItem value="Permission">Permission</MenuItem>
                                            <MenuItem value="Half Day">Half Day</MenuItem>
                                            <MenuItem value="Work From Home">WFH</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        fullWidth size="small"
                                        label="Start Date" type="date"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        fullWidth size="small"
                                        label="End Date" type="date"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={1}>
                                    <Button variant="contained" onClick={loadData} fullWidth sx={{ height: '40px' }}>
                                        Apply
                                    </Button>
                                </Grid>
                            </Grid>

                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Employee ID</TableCell>
                                            <TableCell>Name</TableCell>
                                            <TableCell>Date</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Check In</TableCell>
                                            <TableCell>Total Hours</TableCell>
                                            <TableCell align="center">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(() => {
                                            const filtered = allAttendance.filter(r => {
                                                const name = `${r.employeeId?.firstName || ''} ${r.employeeId?.lastName || ''}`.toLowerCase();
                                                const id = r.employeeId?.employeeId?.toLowerCase() || '';
                                                const searchMatch = !hrSearch || name.includes(hrSearch.toLowerCase()) || id.includes(hrSearch.toLowerCase());
                                                const statusMatch = hrStatusFilter === 'All' || r.status === hrStatusFilter;
                                                return searchMatch && statusMatch;
                                            });
                                            const paginated = filtered.slice(hrPage * hrRowsPerPage, hrPage * hrRowsPerPage + hrRowsPerPage);
                                            if (filtered.length === 0) return (
                                                <TableRow><TableCell colSpan={7} align="center">No attendance records found</TableCell></TableRow>
                                            );
                                            return paginated.map((record) => (
                                                <TableRow key={record._id}>
                                                    <TableCell>{record.employeeId?.employeeId || '-'}</TableCell>
                                                    <TableCell>{record.employeeId?.firstName} {record.employeeId?.lastName}</TableCell>
                                                    <TableCell>{formatDate(record.date)}</TableCell>
                                                    <TableCell>
                                                        <Chip label={record.status} color={getStatusColor(record.status)} size="small" />
                                                    </TableCell>
                                                    <TableCell>{record.checkIn ? formatTime(record.checkIn) : '-'}</TableCell>
                                                    <TableCell>{record.totalHours || 0} hrs</TableCell>
                                                    <TableCell align="center">
                                                        <IconButton size="small" color="primary" onClick={() => handleEditAttendance(record)} title="Edit Attendance">
                                                            <Edit fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ));
                                        })()}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                rowsPerPageOptions={[10, 25, 50]}
                                component="div"
                                count={allAttendance.filter(r => {
                                    const name = `${r.employeeId?.firstName || ''} ${r.employeeId?.lastName || ''}`.toLowerCase();
                                    const id = r.employeeId?.employeeId?.toLowerCase() || '';
                                    const searchMatch = !hrSearch || name.includes(hrSearch.toLowerCase()) || id.includes(hrSearch.toLowerCase());
                                    const statusMatch = hrStatusFilter === 'All' || r.status === hrStatusFilter;
                                    return searchMatch && statusMatch;
                                }).length}
                                rowsPerPage={hrRowsPerPage}
                                page={hrPage}
                                onPageChange={(e, newPage) => setHrPage(newPage)}
                                onRowsPerPageChange={(e) => { setHrRowsPerPage(parseInt(e.target.value, 10)); setHrPage(0); }}
                            />
                        </Paper>
                    )}


                    {/* Tab 2: Month View */}
                    {tabValue === 2 && (
                        <MonthlyAttendanceView />
                    )}

                    {/* Tab 3: Export Report */}
                    {tabValue === 3 && (
                        <AttendanceExport />
                    )}
                </Box>
            )}

            {/* Permission Time Dialog */}
            <Dialog
                open={permissionDialog}
                onClose={() => setPermissionDialog(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTime color="info" />
                    Permission Time
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Please specify the time range for your permission leave today.
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="From Time"
                            type="time"
                            value={permissionFrom}
                            onChange={(e) => { setPermissionFrom(e.target.value); setPermissionError(''); }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ step: 300 }}
                            fullWidth
                            required
                        />
                        <TextField
                            label="To Time"
                            type="time"
                            value={permissionTo}
                            onChange={(e) => { setPermissionTo(e.target.value); setPermissionError(''); }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ step: 300 }}
                            fullWidth
                            required
                        />
                        {permissionError && (
                            <Alert severity="error" sx={{ py: 0.5 }}>{permissionError}</Alert>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setPermissionDialog(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="info"
                        onClick={handlePermissionSubmit}
                        disabled={!permissionFrom || !permissionTo}
                        startIcon={<AccessTime />}
                    >
                        Submit Permission
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Attendance Dialog (HR Only) */}
            {isHR && (
                <Dialog
                    open={editDialog.open}
                    onClose={() => setEditDialog({ open: false, record: null })}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>Edit Attendance</DialogTitle>
                    <DialogContent>
                        {editDialog.record && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" gutterBottom>
                                    <strong>Employee:</strong> {editDialog.record.employeeId?.firstName} {editDialog.record.employeeId?.lastName}
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                    <strong>Date:</strong> {formatDate(editDialog.record.date)}
                                </Typography>
                                <Typography variant="body2" gutterBottom sx={{ mb: 3 }}>
                                    <strong>Current Status:</strong> {editDialog.record.status}
                                </Typography>

                                <FormControl fullWidth>
                                    <InputLabel>New Status</InputLabel>
                                    <Select
                                        value={editStatus}
                                        label="New Status"
                                        onChange={(e) => setEditStatus(e.target.value)}
                                    >
                                        <MenuItem value="Present">Present</MenuItem>
                                        <MenuItem value="Absent">Absent</MenuItem>
                                        <MenuItem value="Permission">Permission</MenuItem>
                                        <MenuItem value="Half Day">Half Day</MenuItem>
                                        <MenuItem value="Work From Home">Work From Home</MenuItem>
                                        <MenuItem value="On Leave">On Leave</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditDialog({ open: false, record: null })}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSaveEdit}
                            disabled={!editStatus || editStatus === editDialog.record?.status}
                        >
                            Save Changes
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </Box>
    );
};

export default AttendanceManagement;
