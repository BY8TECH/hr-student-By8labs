import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Chip,
    Typography,
    TextField,
    Grid,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem
} from '@mui/material';
import { CheckCircle, Cancel, AccessTime } from '@mui/icons-material';
import { employeeAPI, attendanceAPI } from '../../services/api';

const EmployeeAttendanceList = () => {
    const [employees, setEmployees] = useState([]);
    const [attendanceStatus, setAttendanceStatus] = useState({});
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Permission dialog state
    const [permissionDialog, setPermissionDialog] = useState(false);
    const [permissionFrom, setPermissionFrom] = useState('');
    const [permissionTo, setPermissionTo] = useState('');
    const [permissionError, setPermissionError] = useState('');
    const [selectedEmployeeForPermission, setSelectedEmployeeForPermission] = useState(null);

    const formatTime12h = (timeStr) => {
        if (!timeStr) return '';
        try {
            const [hours, minutes] = timeStr.split(':');
            let h = parseInt(hours);
            const m = minutes;
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12;
            h = h ? h : 12;
            return `${h}:${m} ${ampm}`;
        } catch (e) {
            return timeStr;
        }
    };

    useEffect(() => {
        loadEmployees();
        loadAttendanceForDate();
    }, [selectedDate]);

    const loadEmployees = async () => {
        try {
            setLoading(true);
            const response = await employeeAPI.getAll();
            setEmployees(response.data);
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to load employees'
            });
        } finally {
            setLoading(false);
        }
    };

    const loadAttendanceForDate = async () => {
        try {
            const startDate = selectedDate;
            const endDate = selectedDate;
            const response = await attendanceAPI.getAll({ startDate, endDate });

            // Create a map of employeeId -> attendance record
            const statusMap = {};
            response.data.forEach(record => {
                if (record.employeeId?._id) {
                    statusMap[record.employeeId._id] = record;
                }
            });
            setAttendanceStatus(statusMap);
        } catch (error) {
            console.error('Failed to load attendance:', error);
        }
    };

    const markAttendance = async (employeeId, status, extraData = {}) => {
        try {
            setMarking(true);
            await attendanceAPI.bulkMark({
                attendanceRecords: [{
                    employeeId,
                    status,
                    date: selectedDate,
                    ...extraData
                }]
            });

            // Update local state
            setAttendanceStatus(prev => ({
                ...prev,
                [employeeId]: { status, ...extraData }
            }));

            setMessage({
                type: 'success',
                text: `Attendance marked as ${status}`
            });
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to mark attendance'
            });
        } finally {
            setMarking(false);
        }
    };

    const handlePermissionClick = (employeeId) => {
        setSelectedEmployeeForPermission(employeeId);
        setPermissionFrom('09:00');
        setPermissionTo('10:00');
        setFromHour(9); setFromMin('00'); setFromAmpm('AM');
        setToHour(10); setToMin('00'); setToAmpm('AM');
        setPermissionError('');
        setPermissionDialog(true);
    };

    const handlePermissionSubmit = async () => {
        const to24 = (h, m, ampm) => {
            let hr = parseInt(h);
            if (ampm === 'PM' && hr < 12) hr += 12;
            if (ampm === 'AM' && hr === 12) hr = 0;
            return `${hr.toString().padStart(2, '0')}:${m}`;
        };

        const fromTime = to24(fromHour, fromMin, fromAmpm);
        const toTime = to24(toHour, toMin, toAmpm);

        if (fromTime >= toTime) {
            setPermissionError('"To Time" must be after "From Time".');
            return;
        }
        
        setPermissionDialog(false);
        await markAttendance(selectedEmployeeForPermission, 'Permission', { 
            permissionFrom: fromTime, 
            permissionTo: toTime 
        });
    };

    const markAllPresent = async () => {
        try {
            setMarking(true);

            // Get employees without attendance for selected date
            const unmarkedEmployees = employees.filter(
                emp => !attendanceStatus[emp._id]
            );

            if (unmarkedEmployees.length === 0) {
                setMessage({
                    type: 'info',
                    text: 'All employees already have attendance marked'
                });
                return;
            }

            const attendanceRecords = unmarkedEmployees.map(emp => ({
                employeeId: emp._id,
                status: 'Present',
                date: selectedDate
            }));

            await attendanceAPI.bulkMark({ attendanceRecords });

            // Reload attendance
            await loadAttendanceForDate();

            setMessage({
                type: 'success',
                text: `Marked ${unmarkedEmployees.length} employees as Present`
            });
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to mark attendance'
            });
        } finally {
            setMarking(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Present': return 'success';
            case 'Absent': return 'error';
            case 'Permission': return 'info'; // Blue
            case 'Half Day': return 'warning';
            case 'Work From Home': return 'info';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {message.text && (
                <Alert
                    severity={message.type}
                    onClose={() => setMessage({ type: '', text: '' })}
                    sx={{ mb: 2 }}
                >
                    {message.text}
                </Alert>
            )}

            <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        type="date"
                        label="Select Date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        disabled={marking}
                        onClick={markAllPresent}
                    >
                        {marking ? 'Marking...' : 'Mark All Present'}
                    </Button>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="textSecondary">
                        {Object.keys(attendanceStatus).length} / {employees.length} marked
                    </Typography>
                </Grid>
            </Grid>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Employee ID</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Department</TableCell>
                            <TableCell>Attendance Status</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {employees.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    No employees found
                                </TableCell>
                            </TableRow>
                        ) : (
                            employees.map((employee) => {
                                const status = attendanceStatus[employee._id];
                                return (
                                    <TableRow key={employee._id}>
                                        <TableCell>{employee.employeeId}</TableCell>
                                        <TableCell>
                                            {employee.firstName} {employee.lastName}
                                        </TableCell>
                                        <TableCell>{employee.department}</TableCell>
                                        <TableCell>
                                            {status ? (
                                                <Chip
                                                    label={status.status + (status.status === 'Permission' && status.permissionFrom ? ` (${formatTime12h(status.permissionFrom)} - ${formatTime12h(status.permissionTo)})` : '')}
                                                    color={getStatusColor(status.status)}
                                                    size="small"
                                                />
                                            ) : (
                                                <Chip label="Not Marked" size="small" color="default" />
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                {(status?.status !== 'Absent') && (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="success"
                                                        startIcon={<CheckCircle />}
                                                        onClick={() => markAttendance(employee._id, 'Present')}
                                                        disabled={marking || status?.status === 'Present'}
                                                    >
                                                        Present
                                                    </Button>
                                                )}
                                                {(status?.status === 'Present' || status?.status === 'Permission') && (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        sx={{
                                                            backgroundColor: '#2196f3',
                                                            '&:hover': { backgroundColor: '#1976d2' }
                                                        }}
                                                        onClick={() => handlePermissionClick(employee._id)}
                                                        disabled={marking || status?.status === 'Permission'}
                                                    >
                                                        Permission
                                                    </Button>
                                                )}
                                                {(status !== 'Absent' || !status) && (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="error"
                                                        startIcon={<Cancel />}
                                                        onClick={() => markAttendance(employee._id, 'Absent')}
                                                        disabled={marking || status === 'Absent'}
                                                    >
                                                        Absent
                                                    </Button>
                                                )}
                                                {status === 'Absent' && (
                                                    <Chip label="Absent" color="error" size="small" />
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

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
                        Please specify the time range for this permission leave.
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Box>
                            <Typography variant="subtitle2" gutterBottom>From Time</Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Select size="small" value={fromHour} onChange={(e) => setFromHour(e.target.value)} sx={{ flex: 1 }}>
                                    {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                                </Select>
                                <Select size="small" value={fromMin} onChange={(e) => setFromMin(e.target.value)} sx={{ flex: 1 }}>
                                    {['00', '15', '30', '45'].map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                                </Select>
                                <Select size="small" value={fromAmpm} onChange={(e) => setFromAmpm(e.target.value)} sx={{ flex: 1 }}>
                                    {['AM', 'PM'].map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                                </Select>
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" gutterBottom>To Time</Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Select size="small" value={toHour} onChange={(e) => setToHour(e.target.value)} sx={{ flex: 1 }}>
                                    {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                                </Select>
                                <Select size="small" value={toMin} onChange={(e) => setToMin(e.target.value)} sx={{ flex: 1 }}>
                                    {['00', '15', '30', '45'].map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                                </Select>
                                <Select size="small" value={toAmpm} onChange={(e) => setToAmpm(e.target.value)} sx={{ flex: 1 }}>
                                    {['AM', 'PM'].map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                                </Select>
                            </Box>
                        </Box>
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
                        disabled={marking}
                        startIcon={<AccessTime />}
                    >
                        {marking ? 'Submitting...' : 'Submit Permission'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EmployeeAttendanceList;
