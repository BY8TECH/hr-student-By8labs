import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { attendanceAPI } from '../services/api';
import axios from 'axios';
import {
    Box,
    Container,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    Avatar,
    CircularProgress,
    Button,
    Alert,
    Snackbar,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    TextField,
    Chip,
    Divider
} from '@mui/material';
import {
    People,
    EventNote,
    AttachMoney,
    TrendingUp,
    LockOpen,
    Send,
    CheckCircle,
    Cancel,
    AccessTime,
    VerifiedUser
} from '@mui/icons-material';
import AttendanceCalendar from '../components/dashboard/AttendanceCalendar';
import StudentDashboard from './studentPortal/StudentDashboard';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, isHR } = useAuth();
    const [stats, setStats] = useState(null);
    const [employeeStats, setEmployeeStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [requestLoading, setRequestLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Attendance specific state
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [markingAttendance, setMarkingAttendance] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [snackMessage, setSnackMessage] = useState({ open: false, text: '', severity: 'success' });

    // Permission dialog state
    const [permissionDialog, setPermissionDialog] = useState(false);
    const [permissionFrom, setPermissionFrom] = useState('');
    const [permissionTo, setPermissionTo] = useState('');
    const [permissionError, setPermissionError] = useState('');

    useEffect(() => {
        fetchStats();
        if (user?.employeeId) {
            fetchTodayStatus();
            // Fetch personal stats for both Employee and HR if they have a profile
            fetchEmployeeStats();
        }
    }, [refreshTrigger]);

    const fetchTodayStatus = async () => {
        try {
            const response = await attendanceAPI.getTodayStatus();
            setTodayAttendance(response.data);
        } catch (error) {
            console.error('Error fetching today status:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/dashboard/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAttendance = async (status, extraData = {}) => {
        // Front-end guard — Only block if already marked AND it's not a valid transition (e.g. Present -> Permission)
        if (todayAttendance && !((todayAttendance.status === 'Present' || todayAttendance.status === 'Permission') && status === 'Permission')) {
            setSnackMessage({
                open: true,
                text: `⚠️ Attendance is already marked as "${todayAttendance.status}". Status cannot be changed further today.`,
                severity: 'warning'
            });
            return;
        }
        try {
            setMarkingAttendance(true);
            await attendanceAPI.markAttendance({ status, ...extraData });
            setSnackMessage({ open: true, text: `✅ Attendance marked as ${status} successfully!`, severity: 'success' });
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            setSnackMessage({
                open: true,
                text: error.response?.data?.message || 'Failed to mark attendance',
                severity: error.response?.data?.alreadyMarked ? 'warning' : 'error'
            });
        } finally {
            setMarkingAttendance(false);
        }
    };

    const [fromHour, setFromHour] = useState(9);
    const [fromMin, setFromMin] = useState('00');
    const [fromAmpm, setFromAmpm] = useState('AM');
    const [toHour, setToHour] = useState(10);
    const [toMin, setToMin] = useState('00');
    const [toAmpm, setToAmpm] = useState('AM');

    const handlePermissionClick = () => {
        // Only block permission if another status that IS NOT 'Present' was already marked
        if (todayAttendance && todayAttendance.status !== 'Present') {
            setSnackMessage({
                open: true,
                text: `⚠️ Permission can only be applied if you are marked as "Present". Current status: "${todayAttendance.status}".`,
                severity: 'warning'
            });
            return;
        }
        setSnackMessage({ ...snackMessage, open: false }); // Clear any existing alerts
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
        await handleMarkAttendance('Permission', { permissionFrom: fromTime, permissionTo: toTime });
    };


    const handleCloseSnack = () => {
        setSnackMessage({ ...snackMessage, open: false });
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

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

    const handleRequestAccess = async () => {
        try {
            setRequestLoading(true);
            await api.post(
                '/access-requests',
                { message: 'Requesting access to view my data (attendance, leaves, payroll)' }
            );
            setMessage({
                type: 'success',
                text: '✅ Access request sent successfully! HR will review your request soon.'
            });
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to send request'
            });
        } finally {
            setRequestLoading(false);
        }
    };

    const fetchEmployeeStats = async () => {
        try {
            const response = await api.get('/attendance/my-stats');
            setEmployeeStats(response.data);
        } catch (error) {
            console.error('Error fetching employee stats:', error);
        }
    };

    const statsData = [
        {
            title: 'Total Employees',
            value: stats?.totalEmployees || 0,
            icon: <People />,
            color: '#111827', // Black/Deep Gray
            visible: isHR,
            path: '/employees'
        },
        {
            title: 'Pending Leaves',
            value: stats?.pendingLeaves || 0,
            icon: <EventNote />,
            color: '#374151', // Slate-700
            visible: isHR,
            path: '/leaves'
        },
        {
            title: 'Monthly Payroll',
            value: stats?.monthlyPayroll ? `₹${stats.monthlyPayroll}` : '₹0',
            icon: <AttachMoney />,
            color: '#4b5563', // Gray-600
            visible: isHR,
            path: '/payroll'
        },
        {
            title: 'Attendance Rate',
            value: stats?.attendanceRate ? `${stats.attendanceRate}%` : '0%',
            icon: <TrendingUp />,
            color: '#000000', // Black
            visible: true,
            path: '/attendance'
        }
    ];

    const [accessRequests, setAccessRequests] = useState([]);
    const [requestActionLoading, setRequestActionLoading] = useState(null);

    useEffect(() => {
        fetchStats();
        if (user?.employeeId) {
            fetchTodayStatus();
            fetchEmployeeStats();
        }
        // Fetch requests for HR OR for restricted users (to check pending status)
        if (isHR || !user?.hasDataAccess) {
            fetchAccessRequests();
        }
    }, [refreshTrigger, isHR, user?.hasDataAccess]);

    const fetchAccessRequests = async () => {
        try {
            const response = await api.get('/access-requests');
            setAccessRequests(response.data || []);
        } catch (error) {
            console.error('Error fetching access requests:', error);
        }
    };

    const handleApproveRequest = async (requestId) => {
        try {
            setRequestActionLoading(requestId);
            await api.put(`/access-requests/${requestId}/approve`);
            setMessage({ type: 'success', text: 'Access request approved successfully' });
            fetchAccessRequests(); // Refresh list
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to approve request' });
        } finally {
            setRequestActionLoading(null);
        }
    };

    const handleRejectRequest = async (requestId) => {
        if (!window.confirm('Are you sure you want to reject this request?')) return;
        try {
            setRequestActionLoading(requestId);
            await api.put(`/access-requests/${requestId}/reject`, { reason: 'HR rejected request' });
            setMessage({ type: 'info', text: 'Access request rejected' });
            fetchAccessRequests(); // Refresh list
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to reject request' });
        } finally {
            setRequestActionLoading(null);
        }
    };

    const hasPendingRequest = !isHR && !user?.hasDataAccess && accessRequests.some(req => req.status === 'Pending' && req.employeeId?._id === (user?._id || user?.id));

    const visibleStats = statsData.filter(stat => stat.visible);

    if (user?.role === 'Student') {
        return <StudentDashboard />;
    }

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Restricted Access View */}
            {!isHR && !user?.hasDataAccess ? (
                <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Paper
                        elevation={3}
                        sx={{
                            p: 5,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            maxWidth: 600,
                            textAlign: 'center'
                        }}
                    >
                        <LockOpen sx={{ fontSize: 60, color: '#000000', mb: 2 }} />

                        <Typography variant="h4" gutterBottom fontWeight="bold">
                            Access Required
                        </Typography>

                        <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
                            Welcome to BY8labs. To access your dashboard, employee details, and other features, you need to request approval from HR.
                        </Typography>

                        {hasPendingRequest ? (
                            <Alert
                                severity="info"
                                icon={<AccessTime fontSize="inherit" />}
                                sx={{ mb: 2, width: '100%' }}
                            >
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Request Pending
                                </Typography>
                                Your access request has been sent and is awaiting HR review. Please check back later.
                            </Alert>
                        ) : (
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<Send />}
                                onClick={handleRequestAccess}
                                disabled={requestLoading}
                                sx={{ px: 4, py: 1.5 }}
                            >
                                {requestLoading ? 'Sending Request...' : 'Request Access'}
                            </Button>
                        )}
                    </Paper>
                </Box>
            ) : (
                /* Full Dashboard for HR or Approved Employees */
                <>
                    {/* ── Mark Attendance (Employees only) ── */}
                    {!isHR && user?.employeeId ? (
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                                <Typography variant="h6">
                                    Mark Today's Attendance
                                </Typography>
                                {todayAttendance && (
                                    <Chip
                                        label={`✓ ${todayAttendance.status}${
                                            todayAttendance.status === 'Permission' && todayAttendance.permissionFrom
                                                ? ` (${formatTime12h(todayAttendance.permissionFrom)} – ${formatTime12h(todayAttendance.permissionTo)})`
                                                : ''
                                        }`}
                                        color={todayAttendance.status === 'Present' ? 'success' : todayAttendance.status === 'Absent' ? 'error' : 'info'}
                                        size="small"
                                        sx={{ fontWeight: 600 }}
                                    />
                                )}
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <Tooltip title={todayAttendance ? "Attendance already marked" : "Mark as Present"} placement="top" arrow>
                                    <span>
                                        <Button
                                            variant={todayAttendance?.status === 'Present' ? "outlined" : "contained"}
                                            color="success"
                                            startIcon={<CheckCircle />}
                                            onClick={() => handleMarkAttendance('Present')}
                                            disabled={markingAttendance || !!todayAttendance}
                                            sx={{ 
                                                fontWeight: 'bold', 
                                                backgroundColor: todayAttendance?.status === 'Present' ? 'transparent' : '#2e7d32', 
                                                color: todayAttendance?.status === 'Present' ? '#2e7d32' : '#fff',
                                                borderColor: '#2e7d32',
                                                '&:hover': { backgroundColor: todayAttendance?.status === 'Present' ? 'rgba(46, 125, 50, 0.1)' : '#1b5e20' } 
                                            }}
                                        >
                                            Present
                                        </Button>
                                    </span>
                                </Tooltip>

                                {todayAttendance && (todayAttendance.status === 'Present' || todayAttendance.status === 'Permission') && (
                                    <Tooltip title={todayAttendance.status === 'Permission' ? "Already marked as Permission" : "Specify from/to time for permission"} placement="top" arrow>
                                        <span>
                                            <Button
                                                variant={todayAttendance.status === 'Permission' ? "outlined" : "contained"}
                                                color="info"
                                                startIcon={<AccessTime />}
                                                onClick={handlePermissionClick}
                                                disabled={markingAttendance || todayAttendance.status === 'Permission'}
                                                sx={{ 
                                                    fontWeight: 'bold', 
                                                    backgroundColor: todayAttendance.status === 'Permission' ? 'transparent' : '#0288d1', 
                                                    color: todayAttendance.status === 'Permission' ? '#0288d1' : '#fff',
                                                    borderColor: '#0288d1',
                                                    '&:hover': { backgroundColor: todayAttendance.status === 'Permission' ? 'rgba(2, 136, 209, 0.1)' : '#01579b' } 
                                                }}
                                            >
                                                Permission
                                            </Button>
                                        </span>
                                    </Tooltip>
                                )}

                                <Tooltip title={todayAttendance ? "Attendance already marked" : "Mark as Absent"} placement="top" arrow>
                                    <span>
                                        <Button
                                            variant={todayAttendance?.status === 'Absent' ? "outlined" : "contained"}
                                            color="inherit"
                                            startIcon={<Cancel />}
                                            onClick={() => handleMarkAttendance('Absent')}
                                            disabled={markingAttendance || !!todayAttendance}
                                            sx={{ 
                                                fontWeight: 'bold', 
                                                backgroundColor: todayAttendance?.status === 'Absent' ? 'transparent' : '#374151', 
                                                color: todayAttendance?.status === 'Absent' ? '#374151' : '#fff',
                                                borderColor: '#374151',
                                                '&:hover': { backgroundColor: todayAttendance?.status === 'Absent' ? 'rgba(55, 65, 81, 0.1)' : '#111827' } 
                                            }}
                                        >
                                            Absent
                                        </Button>
                                    </span>
                                </Tooltip>
                            </Box>

                            {todayAttendance && todayAttendance.status === 'Absent' ? (
                                <Alert severity="error" sx={{ mt: 1.5, py: 0.5 }}>
                                    ⚠️ Attendance marked as "Absent". Status cannot be changed to "Present".
                                </Alert>
                            ) : todayAttendance && todayAttendance.status === 'Present' ? (
                                <Alert severity="success" sx={{ mt: 1.5, py: 0.5 }}>
                                    ✓ You are marked as "Present". You can apply for permission if needed.
                                </Alert>
                            ) : todayAttendance && todayAttendance.status === 'Permission' ? (
                                <Alert severity="info" sx={{ mt: 1.5, py: 0.5 }}>
                                    ℹ️ Attendance marked as "Permission".
                                </Alert>
                            ) : (
                                <Alert severity="info" sx={{ mt: 1.5, py: 0.5 }} icon={<AccessTime fontSize="inherit" />}>
                                    <strong>Permission</strong> — click to enter your start &amp; end time
                                </Alert>
                            )}
                        </Box>
                    ) : isHR ? (
                        <Box sx={{ mb: 3 }}>
                            <Alert severity="info" sx={{ py: 0.5 }}>
                                To mark attendance for employees, go to the <strong>Attendance</strong> module.
                            </Alert>
                        </Box>
                    ) : null}


                    {/* ── Permission Time Dialog ── */}
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
                            <Button onClick={() => setPermissionDialog(false)} disabled={markingAttendance}>
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                color="info"
                                onClick={handlePermissionSubmit}
                                disabled={markingAttendance || !permissionFrom || !permissionTo}
                                startIcon={<AccessTime />}
                            >
                                {markingAttendance ? 'Submitting...' : 'Submit Permission'}
                            </Button>
                        </DialogActions>
                    </Dialog>


                    {/* HR: Pending Access Requests */}
                    {isHR && accessRequests.length > 0 && (
                        <Paper elevation={3} sx={{ p: 3, mb: 4, borderLeft: '6px solid #000000' }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                <LockOpen sx={{ mr: 1, color: '#000000' }} />
                                Pending Access Requests ({accessRequests.length})
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                {accessRequests.map((req) => (
                                    <Box key={req._id} sx={{
                                        p: 2,
                                        mb: 1,
                                        bgcolor: 'background.default',
                                        borderRadius: 1,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: 2
                                    }}>
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {req.employeeId?.username} ({req.employeeId?.email})
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {req.employeeId?.role} • {new Date(req.createdAt).toLocaleDateString()}
                                            </Typography>
                                            <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                                                "{req.requestMessage}"
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="success"
                                                onClick={() => handleApproveRequest(req._id)}
                                                disabled={requestActionLoading === req._id}
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="error"
                                                onClick={() => handleRejectRequest(req._id)}
                                                disabled={requestActionLoading === req._id}
                                            >
                                                Reject
                                            </Button>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    )}

                    {/* Main Dashboard Layout with Calendar on Left */}
                    <Grid container spacing={3}>
                        {/* LEFT SIDE - Attendance Calendar */}
                        <Grid item xs={12} md={3}>
                            <AttendanceCalendar refreshTrigger={refreshTrigger} />
                        </Grid>

                        {/* RIGHT SIDE - Dashboard Content */}
                        <Grid item xs={12} md={9}>
                            <Grid container spacing={3}>
                                {visibleStats.map((stat, index) => (
                                    <Grid item xs={12} sm={6} md={4} key={index}>
                                        <Card 
                                            elevation={3} 
                                            onClick={() => navigate(stat.path)}
                                            sx={{ cursor: 'pointer', transition: '0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}
                                        >
                                            <CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                    <Avatar sx={{ bgcolor: stat.color, mr: 2 }}>
                                                        {stat.icon}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="h5" component="div">
                                                            {stat.value}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {stat.title}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>

                            {/* Employee Stats - For both Employees and HR with employee profile */}
                            {user?.employeeId && employeeStats && (
                                <Box sx={{ mt: 4 }}>
                                    <Typography variant="h5" gutterBottom>
                                        My Attendance & Leave Summary (This Month)
                                    </Typography>
                                    <Grid container spacing={3} sx={{ mb: 3 }}>
                                        {/* Present Days */}
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Card 
                                                elevation={3} 
                                                onClick={() => navigate('/attendance')}
                                                sx={{ cursor: 'pointer', transition: '0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}
                                            >
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                        <Avatar sx={{ bgcolor: '#000000', mr: 2 }}>
                                                            <CheckCircle />
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="h5">
                                                                {employeeStats?.attendance?.present || 0}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Present Days
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>

                                        {/* Absent Days */}
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Card 
                                                elevation={3} 
                                                onClick={() => navigate('/attendance')}
                                                sx={{ cursor: 'pointer', transition: '0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}
                                            >
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                        <Avatar sx={{ bgcolor: '#374151', mr: 2 }}>
                                                            <Cancel />
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="h5">
                                                                {employeeStats?.attendance?.absent || 0}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Absent Days
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>

                                        {/* Permission Days */}
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Card 
                                                elevation={3} 
                                                onClick={() => navigate('/attendance')}
                                                sx={{ cursor: 'pointer', transition: '0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}
                                            >
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                        <Avatar sx={{ bgcolor: '#4b5563', mr: 2 }}>
                                                            <AccessTime />
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="h5">
                                                                {employeeStats?.attendance?.permission || 0}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Permission Days
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>

                                        {/* Total Annual Leave */}
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Card 
                                                elevation={3} 
                                                onClick={() => navigate('/leaves')}
                                                sx={{ cursor: 'pointer', transition: '0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}
                                            >
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                        <Avatar sx={{ bgcolor: '#111827', mr: 2 }}>
                                                            <EventNote />
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="h5">
                                                                {employeeStats?.leave?.totalLeave || 12} days
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Total Leave (Per Year)
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>

                                        {/* Leave Taken */}
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Card 
                                                elevation={3} 
                                                onClick={() => navigate('/leaves')}
                                                sx={{ cursor: 'pointer', transition: '0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}
                                            >
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                        <Avatar sx={{ bgcolor: '#4b5563', mr: 2 }}>
                                                            <EventNote />
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="h5">
                                                                {employeeStats?.leave?.usedLeave || 0}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Leave Taken
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>

                                        {/* Remaining Leave */}
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Card 
                                                elevation={3} 
                                                onClick={() => navigate('/leaves')}
                                                sx={{ cursor: 'pointer', transition: '0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}
                                            >
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                        <Avatar sx={{ bgcolor: '#000000', mr: 2 }}>
                                                            <TrendingUp />
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="h5">
                                                                {employeeStats?.leave?.remainingLeave || 0}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Remaining Leave
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}
                        </Grid>
                    </Grid>

                    {/* Additional Info Section */}
                    <Grid container spacing={3} sx={{ mt: 2 }}>
                        <Grid item xs={12} md={8}>
                            <Paper elevation={3} sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Quick Actions
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {isHR
                                        ? 'Manage employees, approve leaves, generate payroll, and view reports.'
                                        : 'View your attendance, apply for leaves, check payslips, and submit expense claims.'}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper elevation={3} sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Recent Activity
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    No recent activity
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </>
            )}
            {/* Snackbar for Notifications */}
            <Snackbar
                open={snackMessage.open}
                autoHideDuration={6000}
                onClose={handleCloseSnack}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnack} severity={snackMessage.severity} sx={{ width: '100%' }}>
                    {snackMessage.text}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default Dashboard;
