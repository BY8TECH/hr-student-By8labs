import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Grid, Typography, Paper, CircularProgress, Alert, Avatar,
    Chip, IconButton, Button, TextField, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Divider,
    List as MuiList, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Tooltip, Card, CardContent, InputAdornment, MenuItem,
    Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress,
    Autocomplete, FormControl, FormLabel, RadioGroup, Radio, FormControlLabel
} from '@mui/material';
import {
    Dashboard, PeopleOutlined, MenuBook, EventAvailable, EmojiEvents,
    CheckCircle, Cancel, ThumbUp, ThumbDown, Notifications,
    Search, Assessment, NotificationsActive, LinkOff, Lock, Refresh,
    FilterList, Visibility, HowToReg, PersonSearch, History, DataUsage, EventNote,
    Assignment, AccessTime, Payments, AddCard, ListAlt, FileDownload, AccountBalanceWallet,
    AttachMoney, Group, PendingActions, CloudUpload, VerifiedUser
} from '@mui/icons-material';
import StudentLeaveManagementPanel from './StudentLeaveManagementPanel';
import {
    dashboardAPI, adminStudentAPI, courseAPI, attendanceAPI,
    leaderboardAPI, notificationAPI, enrollmentAPI, taskAPI,
    portalAuthAPI, getStudentPortalToken, setStudentPortalToken, clearStudentPortalToken,
    STUDENT_API_URL, paymentAPI, documentAPI, certificateAPI
} from '../../services/studentPortalAPI';

// ─── Sub-module definitions ────────────────────────────────────────────────
const MODULES = [
    { id: 'dashboard', label: 'Dashboard', icon: <Dashboard /> },
    { id: 'students', label: 'Users', icon: <PeopleOutlined /> },
    { id: 'studentList', label: 'Student List', icon: <HowToReg /> },
    { id: 'admission', label: 'Admission Form', icon: <PersonSearch /> },
    { id: 'courses', label: 'Courses', icon: <MenuBook /> },
    { id: 'documents', label: 'Upload Course', icon: <CloudUpload /> },
    { id: 'attendance', label: 'Attendance', icon: <EventAvailable /> },
    // { id: 'leaderboard', label: 'Leaderboard', icon: <EmojiEvents /> },
    // { id: 'notifications', label: 'Notifications', icon: <NotificationsActive /> },
    // { id: 'enrollments', label: 'Enrollments', icon: <Assessment /> },
    { id: 'leave', label: 'Leave Management', icon: <EventNote /> },
    { id: 'tasks', label: 'Tasks', icon: <Assignment /> },
    { id: 'payment', label: 'Payments', icon: <Payments /> },
    { id: 'certificates', label: 'Certificates', icon: <VerifiedUser /> },
];

// ─── Stat card helper ──────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }) {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                <Box sx={{ color, fontSize: 40, mb: 1 }}>{icon}</Box>
                <Typography variant="h3" fontWeight="bold" color={color}>{value ?? '—'}</Typography>
                <Typography variant="subtitle2" color="text.secondary" textAlign="center">{label}</Typography>
            </CardContent>
        </Card>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Panel: Dashboard
// ═══════════════════════════════════════════════════════════════════════════
function DashboardPanel({ refreshTrigger, onTabChange }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        dashboardAPI.getOverallAdminStats()
            .then(res => setStats(res.data.data))
            .catch(err => {
                console.error(err);
                setError('Failed to load overall dashboard. Please ensure you are connected to the Student Portal.');
            })
            .finally(() => setLoading(false));
    }, [refreshTrigger]);

    if (loading) return <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>;

    const sections = [
        {
            title: 'USERS & STUDENTS',
            color: '#1976d2',
            items: [
                { label: 'Total Students', value: stats?.users?.totalStudents, icon: <PeopleOutlined />, color: '#1976d2', tab: 'studentList' },
                { label: 'Pending Approvals', value: stats?.users?.pendingApprovals, icon: <HowToReg />, color: '#ed6c02', tab: 'students' },
            ]
        },
        {
            title: 'ACADEMIC OVERVIEW',
            color: '#2e7d32',
            items: [
                { label: 'Total Courses', value: stats?.courses?.total, icon: <MenuBook />, color: '#2e7d32', tab: 'courses' },
                { label: 'Total Tasks', value: stats?.tasks?.total, icon: <Assignment />, color: '#2e7d32', tab: 'tasks' },
            ]
        },
        {
            title: 'ATTENDANCE SUMMARY',
            color: '#0288d1',
            items: [
                { label: 'Total Records', value: stats?.attendance?.totalRecords, icon: <EventAvailable />, color: '#0288d1', tab: 'attendance' },
                { label: 'Avg Attendance %', value: stats?.attendance?.averagePercentage ? `${stats.attendance.averagePercentage}%` : '0%', icon: <Assessment />, color: '#0288d1', tab: 'attendance' },
            ]
        },
        {
            title: 'LEAVE REQUESTS',
            color: '#7b1fa2',
            items: [
                { label: 'Total Leaves', value: stats?.leave?.total, icon: <EventNote />, color: '#7b1fa2', tab: 'leave' },
                { label: 'Pending', value: stats?.leave?.pending, icon: <History />, color: '#ed6c02', tab: 'leave' },
                { label: 'Approved', value: stats?.leave?.approved, icon: <CheckCircle />, color: '#2e7d32', tab: 'leave' },
            ]
        }
    ];

    return (
        <Box sx={{ p: 1 }}>
            <Typography variant="h5" fontWeight={800} mb={4} sx={{ color: '#00bfa5', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Dashboard sx={{ fontSize: 28 }} /> Overall Admin Dashboard
            </Typography>

            {sections.map((sec, idx) => (
                <Box key={idx} sx={{ mb: 5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                        <Box sx={{ width: 4, height: 24, bgcolor: sec.color, borderRadius: 2 }} />
                        <Typography variant="overline" fontWeight={700} color="text.secondary" sx={{ letterSpacing: 1.5, fontSize: '0.8rem' }}>
                            {sec.title}
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        {sec.items.map((item, i) => (
                            <Grid item xs={12} sm={6} md={idx === 3 ? 4 : 2.8} key={i}>
                                <Card
                                    onClick={() => item.tab && onTabChange(item.tab)}
                                    sx={{
                                        borderRadius: 4,
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                                        border: '1px solid',
                                        borderColor: 'rgba(0,0,0,0.05)',
                                        transition: 'all 0.2s',
                                        cursor: item.tab ? 'pointer' : 'default',
                                        '&:hover': item.tab ? { transform: 'translateY(-4px)', boxShadow: '0 8px 25px rgba(0,0,0,0.1)', borderColor: item.color } : {}
                                    }}
                                >
                                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5, p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                        <Box sx={{
                                            width: 54, height: 54, borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            bgcolor: `${item.color}08`,
                                            color: item.color,
                                            flexShrink: 0
                                        }}>
                                            {React.cloneElement(item.icon, { sx: { fontSize: 26 } })}
                                        </Box>
                                        <Box>
                                            <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1, mb: 0.5 }}>
                                                {item.value ?? 0}
                                            </Typography>
                                            <Typography variant="caption" fontWeight={600} color="text.secondary">
                                                {item.label}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            ))}
        </Box>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Panel: Student Management (Admin)
// ═══════════════════════════════════════════════════════════════════════════
function UsersPanel() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, approved, pending

    const fetch = useCallback(async () => {
        try {
            setLoading(true);
            const res = await adminStudentAPI.getAllStudents();
            setStudents(res.data.data || []);
        } catch { setError('Failed to load users.'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    const handleApprove = async (id) => {
        try { setSaving(true); await adminStudentAPI.approveStudent(id); setSuccess('User approved!'); fetch(); }
        catch { setError('Failed to approve user.'); }
        finally { setSaving(false); }
    };

    const handleReject = async (id) => {
        if (!window.confirm('Reject and delete this user account?')) return;
        try { setSaving(true); await adminStudentAPI.rejectStudent(id); setSuccess('User rejected.'); fetch(); }
        catch { setError('Failed to reject user.'); }
        finally { setSaving(false); }
    };

    const filtered = students.filter(s => {
        const matchesSearch = !search ||
            s.name?.toLowerCase().includes(search.toLowerCase()) ||
            s.email?.toLowerCase().includes(search.toLowerCase()) ||
            s.studentId?.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'approved' && s.isApproved) ||
            (filterStatus === 'pending' && !s.isApproved);

        return matchesSearch && matchesStatus;
    });

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={700}>User Management</Typography>
                <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={fetch} disabled={loading || saving}>Refresh</Button>
            </Box>
            {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}
            {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

            <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                <TextField
                    size="small" placeholder="Search by name / email / ID…"
                    value={search} onChange={e => setSearch(e.target.value)}
                    sx={{ flexGrow: 1, maxWidth: 400 }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
                />
                <TextField
                    select
                    size="small"
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    SelectProps={{ native: true }}
                    sx={{ minWidth: 150 }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><FilterList fontSize="small" /></InputAdornment> }}
                >
                    <option value="all">All Status</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                </TextField>
            </Box>

            {loading ? <CircularProgress /> : (
                <TableContainer component={Paper} elevation={1}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell><b>User</b></TableCell>
                                <TableCell><b>Student ID</b></TableCell>
                                <TableCell><b>Email</b></TableCell>
                                <TableCell><b>Registered</b></TableCell>
                                <TableCell><b>Status</b></TableCell>
                                <TableCell align="right"><b>Actions</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.length === 0
                                ? <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>No users found.</TableCell></TableRow>
                                : filtered.map(s => (
                                    <TableRow key={s._id} hover>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontSize: '0.8rem' }}>
                                                    {s.name?.[0] || 'U'}
                                                </Avatar>
                                                <Typography variant="body2" fontWeight={600}>{s.name || s.username}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell><Typography variant="body2" color="primary" fontWeight={700}>{s.studentId || '—'}</Typography></TableCell>
                                        <TableCell><Typography variant="body2">{s.email || '—'}</Typography></TableCell>
                                        <TableCell><Typography variant="body2">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}</Typography></TableCell>
                                        <TableCell>
                                            <Chip
                                                label={s.isApproved ? 'Approved' : 'Pending'}
                                                color={s.isApproved ? 'success' : 'warning'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            {!s.isApproved ? (
                                                <>
                                                    <Tooltip title="Approve">
                                                        <IconButton size="small" color="success" disabled={saving} onClick={() => handleApprove(s._id)}><ThumbUp fontSize="small" /></IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Reject">
                                                        <IconButton size="small" color="error" disabled={saving} onClick={() => handleReject(s._id)}><ThumbDown fontSize="small" /></IconButton>
                                                    </Tooltip>
                                                </>
                                            ) : (
                                                <Chip label="Verified" size="small" color="info" variant="outlined" icon={<CheckCircle fontSize="small" />} />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            }
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Panel: Attendance Control — Full 5-Feature Module
// ═══════════════════════════════════════════════════════════════════════════
const ATT_STATUS_COLORS = { Present: 'success', Absent: 'error', Holiday: 'warning', Late: 'info', Leave: 'default' };
const ATT_STATUSES = ['Present', 'Absent', 'Holiday'];
const todayStr = () => new Date().toISOString().slice(0, 10);

// ── Stat Card helper ──────────────────────────────────────────────────────
function AttStatCard({ label, value, icon, color }) {
    return (
        <Card sx={{ height: '100%', borderTop: `4px solid ${color}` }}>
            <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
                <Box sx={{ color, fontSize: 32, mb: 0.5 }}>{icon}</Box>
                <Typography variant="h4" fontWeight={800} sx={{ color }}>{value ?? '—'}</Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={600} mt={0.5}>{label}</Typography>
            </CardContent>
        </Card>
    );
}

function AttendanceControlPanel({ onRefresh }) {
    const [attTab, setAttTab] = useState(0);
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(true);

    // Tab 0 — Mark
    const [markUserId, setMarkUserId] = useState('');
    const [markStatus, setMarkStatus] = useState('Present');
    const [markCourseId, setMarkCourseId] = useState('');
    const [markRemarks, setMarkRemarks] = useState('');
    const [marking, setMarking] = useState(false);

    // Tab 1 — Edit (OTP)
    const [editUserId, setEditUserId] = useState('');
    const [editDate, setEditDate] = useState(todayStr());
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [newStatus, setNewStatus] = useState('Present');
    const [newRemarks, setNewRemarks] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);

    // Tab 2 — List
    const [listUserId, setListUserId] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [records, setRecords] = useState([]);
    const [listLoading, setListLoading] = useState(false);
    const [listSearched, setListSearched] = useState(false);

    // Tab 3 — Summary
    const [sumUserId, setSumUserId] = useState('');
    const [summary, setSummary] = useState(null);
    const [sumLoading, setSumLoading] = useState(false);

    // Tab 4 — Admin
    const [adminData, setAdminData] = useState([]);
    const [adminLoading, setAdminLoading] = useState(false);
    const [adminSearch, setAdminSearch] = useState('');

    // Shared feedback
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const showSuccess = (msg) => { setSuccess(msg); setError(''); };
    const showError = (msg) => { setError(msg); setSuccess(''); };

    // Dashboard Cards Data
    const [adminStats, setAdminStats] = useState(null);

    // Load students and courses on mount
    useEffect(() => {
        adminStudentAPI.getAllStudents()
            .then(res => setStudents((res.data?.data || []).filter(s => s.isApproved)))
            .catch(() => showError('Failed to load students.'))
            .finally(() => setLoadingStudents(false));

        courseAPI.getAllCourses()
            .then(res => {
                const data = res.data;
                const list = (data.data || data.courses || data || []).map(c => ({
                    _id: c.courseId || c._id,
                    name: c.name || c.courseName || c.title || c.course || c._id,
                })).filter(c => c.name);
                setCourses(list);
            })
            .catch(err => console.error('Failed to load courses for attendance dropdown.', err));

        dashboardAPI.getAdminAttendanceStats()
            .then(res => setAdminStats(res.data?.data || null))
            .catch(err => console.error(err));
    }, []);

    // Load admin summary when tab 4 activated
    useEffect(() => {
        if (attTab !== 4) return;
        setAdminLoading(true);
        attendanceAPI.getOverallSummary()
            .then(res => setAdminData(Array.isArray(res.data) ? res.data : (res.data?.data || [])))
            .catch(() => showError('Failed to load summary.'))
            .finally(() => setAdminLoading(false));
    }, [attTab]);

    // ── Tab 0: Mark ────────────────────────────────────────────────────────
    const handleMark = async () => {
        if (!markUserId) { showError('Please select a student.'); return; }
        setMarking(true); setError(''); setSuccess('');
        try {
            await attendanceAPI.markAttendanceById(markUserId, {
                date: todayStr(), status: markStatus,
                remarks: markRemarks, courseId: markCourseId || undefined,
            });
            showSuccess(`✅ Marked ${markStatus} for ${students.find(s => s._id === markUserId)?.name}.`);
            setMarkRemarks('');
            onRefresh?.();
        } catch (err) {
            showError(err.response?.data?.message || err.message);
        } finally { setMarking(false); }
    };

    // ── Tab 1: Request Edit ─────────────────────────────────────────────
    const handleRequestEdit = async () => {
        if (!editUserId || !editDate) { showError('Select student and date.'); return; }
        setOtpLoading(true); setError(''); setSuccess('');
        try {
            await attendanceAPI.requestEdit(editUserId, { date: editDate });
            setOtpSent(true);
            showSuccess('✅ OTP sent to HR email. Enter it below.');
        } catch (err) {
            showError(err.response?.data?.message || err.message);
        } finally { setOtpLoading(false); }
    };

    const handleVerifyEdit = async () => {
        if (!otp || !newStatus) { showError('Enter OTP and new status.'); return; }
        setOtpLoading(true); setError('');
        try {
            await attendanceAPI.verifyEdit(editUserId, { otp, date: editDate, status: newStatus, remarks: newRemarks });
            showSuccess('✅ Attendance updated successfully!');
            setOtpSent(false); setOtp('');
            onRefresh?.();
        } catch (err) {
            showError(err.response?.data?.message || err.message);
        } finally { setOtpLoading(false); }
    };

    // ── Tab 2: List ────────────────────────────────────────────────────
    const handleFilter = async () => {
        if (!listUserId) { showError('Select a student.'); return; }
        setListLoading(true); setError('');
        try {
            const params = {};
            if (filterDate) params.date = filterDate;
            else if (startDate && endDate) { params.startDate = startDate; params.endDate = endDate; }
            const res = await attendanceAPI.getAttendanceById(listUserId, params);
            setRecords(Array.isArray(res.data) ? res.data : (res.data?.data || []));
            setListSearched(true);
        } catch (err) {
            showError(err.response?.data?.message || err.message);
        } finally { setListLoading(false); }
    };

    // ── Tab 3: Summary ─────────────────────────────────────────────────
    const handleSummary = async () => {
        if (!sumUserId) { showError('Select a student.'); return; }
        setSumLoading(true); setError(''); setSummary(null);
        try {
            const res = await attendanceAPI.getAttendanceSummaryById(sumUserId);
            setSummary(res.data?.data ?? res.data);
        } catch (err) {
            showError(err.response?.data?.message || err.message);
        } finally { setSumLoading(false); }
    };

    const pct = summary?.attendancePercentage ?? 0;

    const adminFiltered = adminData.filter(r =>
        !adminSearch || JSON.stringify(r).toLowerCase().includes(adminSearch.toLowerCase())
    );
    const adminTotals = adminData.reduce((a, r) => ({
        total: a.total + (r.totalDays ?? 0), present: a.present + (r.presentCount ?? 0),
        absent: a.absent + (r.absentCount ?? 0), holiday: a.holiday + (r.holidayCount ?? 0),
    }), { total: 0, present: 0, absent: 0, holiday: 0 });

    if (loadingStudents) return <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>;

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={700}>Attendance Module</Typography>
            </Box>

            {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}
            {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

            {/* Attendance Overview Cards (5 Columns) */}
            {/* <Grid container spacing={2} mb={4}>
                <Grid item xs={12} sm={4} md>
                    <Card sx={{ height: '100%', borderTop: '4px solid #9e9e9e' }}>
                        <CardContent sx={{ textAlign: 'center', p: 2 }}>
                            <Box fontSize={32} mb={0.5}>📊</Box>
                            <Typography variant="h5" fontWeight={800}>{adminStats?.totalDays ?? 0}</Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={600} mt={0.5}>Total Days</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4} md>
                    <Card sx={{ height: '100%', borderTop: '4px solid #2e7d32' }}>
                        <CardContent sx={{ textAlign: 'center', p: 2 }}>
                            <Box fontSize={32} mb={0.5}>✅</Box>
                            <Typography variant="h5" fontWeight={800} color="#2e7d32">{adminStats?.presentCount ?? 0}</Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={600} mt={0.5}>Present</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4} md>
                    <Card sx={{ height: '100%', borderTop: '4px solid #d32f2f' }}>
                        <CardContent sx={{ textAlign: 'center', p: 2 }}>
                            <Box fontSize={32} mb={0.5}>❌</Box>
                            <Typography variant="h5" fontWeight={800} color="#d32f2f">{adminStats?.absentCount ?? 0}</Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={600} mt={0.5}>Absent</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md>
                    <Card sx={{ height: '100%', borderTop: '4px solid #ed6c02' }}>
                        <CardContent sx={{ textAlign: 'center', p: 2 }}>
                            <Box fontSize={32} mb={0.5}>🏖️</Box>
                            <Typography variant="h5" fontWeight={800} color="#ed6c02">{adminStats?.holidayCount ?? 0}</Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={600} mt={0.5}>Holidays</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md>
                    <Card sx={{ height: '100%', borderTop: '4px solid #1976d2', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ textAlign: 'center', p: 2, flexGrow: 1 }}>
                            <Box fontSize={32} mb={0.5}>📈</Box>
                            <Typography variant="h5" fontWeight={800} color="#1976d2">{adminStats?.attendancePercentage ?? 0}%</Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={600} mb={1.5} mt={0.5}>Attendance %</Typography>
                            <LinearProgress variant="determinate" value={adminStats?.attendancePercentage ?? 0} sx={{ height: 6, borderRadius: 3 }} />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid> */}

            {/* ── Tab Bar ── */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                {['📋 Mark', '✏️ Edit (OTP)', '📅 List', '📊 Summary'].map((label, i) => (
                    <Button key={i} size="small"
                        variant={attTab === i ? 'contained' : 'outlined'}
                        onClick={() => { setAttTab(i); setError(''); setSuccess(''); }}
                        sx={{ fontWeight: 600, textTransform: 'none' }}>
                        {label}
                    </Button>
                ))}
            </Box>

            {/* ════ Tab 0 — Mark Attendance ════ */}
            {attTab === 0 && (
                <Box>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField select fullWidth size="small" label="👤 Select Student"
                                value={markUserId} onChange={e => setMarkUserId(e.target.value)}>
                                {students.map(s => (
                                    <MenuItem key={s._id} value={s._id}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Avatar sx={{ width: 22, height: 22, fontSize: '0.65rem', bgcolor: 'primary.main' }}>{s.name?.[0]}</Avatar>
                                            {s.name} &nbsp;<Chip label={s.studentId} size="small" variant="outlined" />
                                        </Box>
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth size="small" label="📅 Date" type="date"
                                value={todayStr()} disabled InputLabelProps={{ shrink: true }}
                                helperText="Today only — auto-filled" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField select fullWidth size="small" label="📊 Status"
                                value={markStatus} onChange={e => setMarkStatus(e.target.value)}>
                                {ATT_STATUSES.map(s => (
                                    <MenuItem key={s} value={s}>
                                        <Chip label={s} size="small" color={ATT_STATUS_COLORS[s]} sx={{ pointerEvents: 'none' }} />
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField select fullWidth size="small" label="📚 Course (Optional)"
                                value={markCourseId} onChange={e => setMarkCourseId(e.target.value)}>
                                <MenuItem value=""><em>None</em></MenuItem>
                                {courses.map(c => (
                                    <MenuItem key={c._id} value={c._id}>{c.name || c.courseName}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth size="small" label="📝 Remarks (Optional)"
                                value={markRemarks} onChange={e => setMarkRemarks(e.target.value)} />
                        </Grid>
                        <Grid item xs={12}>
                          <Button 
    variant="contained" 
    fullWidth 
    size="large"
    disabled={marking || !markUserId}
    sx={{ 
        fontWeight: 700, 
        color: "#fff",
        // This overrides the default MUI disabled color
        "&.Mui-disabled": {
            color: "rgba(255, 255, 255, 0.7)", // Or any color you prefer
        }
    }}
    onClick={handleMark}
>
    {marking ? 'Saving...' : '✅ Submit Attendance'}
</Button>
                        </Grid>
                    </Grid>
                </Box>
            )}

            {/* ════ Tab 1 — Edit (OTP) ════ */}
            {attTab === 1 && (
                <Box>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight={700} mb={2}>Step A — Request Edit</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField select fullWidth size="small" label="👤 Student"
                                value={editUserId}
                                onChange={e => { setEditUserId(e.target.value); setOtpSent(false); setOtp(''); }}>
                                {students.map(s => <MenuItem key={s._id} value={s._id}>{s.name} — {s.studentId}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth size="small" label="📅 Date" type="date"
                                value={editDate}
                                onChange={e => { setEditDate(e.target.value); setOtpSent(false); }}
                                InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Button fullWidth variant="outlined" size="large"
                                startIcon={otpLoading && !otpSent ? <CircularProgress size={16} /> : <Notifications />}
                                onClick={handleRequestEdit} disabled={otpLoading || !editUserId}
                                sx={{ fontWeight: 700, height: '100%' }}>
                                🔘 Request Edit (Send OTP)
                            </Button>
                        </Grid>
                    </Grid>

                    {otpSent && (
                        <>
                            <Divider sx={{ my: 3 }} />
                            <Typography variant="subtitle2" color="text.secondary" fontWeight={700} mb={2}>Step B — Verify OTP &amp; Update</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField fullWidth size="small" label="🔐 Enter OTP"
                                        value={otp} onChange={e => setOtp(e.target.value)}
                                        inputProps={{ maxLength: 6, style: { letterSpacing: '8px', fontWeight: 700, fontSize: '1.2rem' } }}
                                        placeholder="______" />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField select fullWidth size="small" label="📊 New Status"
                                        value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                                        {ATT_STATUSES.map(s => (
                                            <MenuItem key={s} value={s}>
                                                <Chip label={s} size="small" color={ATT_STATUS_COLORS[s]} sx={{ pointerEvents: 'none' }} />
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth size="small" label="📝 Remarks"
                                        value={newRemarks} onChange={e => setNewRemarks(e.target.value)} />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button variant="contained" color="success" fullWidth size="large"
                                        startIcon={otpLoading ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
                                        onClick={handleVerifyEdit} disabled={otpLoading || !otp}
                                        sx={{ fontWeight: 700 }}>
                                        ✅ Update Attendance
                                    </Button>
                                </Grid>
                            </Grid>
                        </>
                    )}
                </Box>
            )}

            {/* ════ Tab 2 — Attendance List ════ */}
            {attTab === 2 && (
                <Box>
                    <Grid container spacing={2} alignItems="flex-end" mb={2}>
                        <Grid item xs={12} sm={3}>
                            <TextField select fullWidth size="small" label="👤 Student"
                                value={listUserId} onChange={e => setListUserId(e.target.value)}
                                sx={{ '& .MuiInputBase-input': { color: 'inherit' } }}>
                                {students.map(s => (
                                    <MenuItem key={s._id} value={s._id}>
                                        {s.name} ({s.studentId || 'No ID'})
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <TextField fullWidth size="small" label="📅 Date" type="date"
                                value={filterDate}
                                onChange={e => { setFilterDate(e.target.value); setStartDate(''); setEndDate(''); }}
                                InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <TextField fullWidth size="small" label="Start Date" type="date"
                                value={startDate}
                                onChange={e => { setStartDate(e.target.value); setFilterDate(''); }}
                                InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <TextField fullWidth size="small" label="End Date" type="date"
                                value={endDate}
                                onChange={e => { setEndDate(e.target.value); setFilterDate(''); }}
                                InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Button variant="contained" fullWidth startIcon={<Search />}
                                onClick={handleFilter} disabled={listLoading || !listUserId}
                                sx={{ 
                                    fontWeight: 700, 
                                    height: '40px',
                                    bgcolor: '#000', 
                                    color: '#fff',
                                    '&:hover': { bgcolor: '#333' },
                                    '&.Mui-disabled': { 
                                        bgcolor: 'rgba(0,0,0,0.12)', 
                                        color: 'rgba(255,255,255,0.3)' 
                                    }
                                }}>
                                Filter
                            </Button>
                        </Grid>
                    </Grid>
                    {listLoading ? <CircularProgress /> : listSearched && (
                        <TableContainer component={Paper} elevation={1}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'primary.main' }}>
                                        {['Date', 'Status', 'Remarks', 'Action'].map(h => (
                                            <TableCell key={h} sx={{ color: '#fff', fontWeight: 700 }}
                                                align={h === 'Action' ? 'center' : 'left'}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {records.length === 0 ? (
                                        <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>No records found.</TableCell></TableRow>
                                    ) : records.map((r, i) => (
                                        <TableRow key={r._id || i} hover>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </Typography>
                                            </TableCell>
                                            <TableCell><Chip label={r.status} size="small" color={ATT_STATUS_COLORS[r.status] || 'default'} /></TableCell>
                                            <TableCell><Typography variant="body2" color="text.secondary">{r.notes || r.remarks || '—'}</Typography></TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="Edit via OTP">
                                                    <IconButton size="small" color="primary"
                                                        onClick={() => { setEditUserId(listUserId); setEditDate(r.date?.slice(0, 10) || todayStr()); setOtpSent(false); setOtp(''); setAttTab(1); }}>
                                                        <Visibility fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>
            )}

            {/* ════ Tab 3 — Summary ════ */}
            {attTab === 3 && (
                <Box>
                    <Box display="flex" gap={2} mb={3} alignItems="flex-end" flexWrap="wrap">
                        <TextField select size="small" label="👤 Student" value={sumUserId}
                            onChange={e => setSumUserId(e.target.value)} sx={{ minWidth: 220 }}>
                            {students.map(s => <MenuItem key={s._id} value={s._id}>{s.name} ({s.studentId})</MenuItem>)}
                        </TextField>
                        <Button variant="contained" startIcon={sumLoading ? <CircularProgress size={16} color="inherit" /> : <Assessment />}
                            onClick={handleSummary} disabled={sumLoading || !sumUserId} sx={{ fontWeight: 700 }}>
                            View Summary
                        </Button>
                    </Box>
                    {sumLoading && <CircularProgress />}
                    {summary && (
                        <>
                            <Grid container spacing={2} mb={2}>
                                <Grid item xs={6} sm={4} md={2.4}>
                                    <AttStatCard label="Total Days" value={summary.totalDays} icon={<EventAvailable />} color="#1976d2" />
                                </Grid>
                                <Grid item xs={6} sm={4} md={2.4}>
                                    <AttStatCard label="Present" value={summary.presentCount} icon={<CheckCircle />} color="#2e7d32" />
                                </Grid>
                                <Grid item xs={6} sm={4} md={2.4}>
                                    <AttStatCard label="Absent" value={summary.absentCount} icon={<Cancel />} color="#d32f2f" />
                                </Grid>
                                <Grid item xs={6} sm={4} md={2.4}>
                                    <AttStatCard label="Holiday" value={summary.holidayCount} icon={<EmojiEvents />} color="#ed6c02" />
                                </Grid>
                                <Grid item xs={6} sm={4} md={2.4}>
                                    <AttStatCard label="Attendance %" value={`${pct.toFixed(1)}%`} icon={<Assessment />} color={pct >= 75 ? '#2e7d32' : '#d32f2f'} />
                                </Grid>
                            </Grid>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="body2" fontWeight={600} mb={1}>Attendance Progress</Typography>
                                <Box sx={{ bgcolor: 'grey.200', borderRadius: 6, overflow: 'hidden', height: 12 }}>
                                    <Box sx={{ width: `${Math.min(pct, 100)}%`, height: '100%', bgcolor: pct >= 75 ? 'success.main' : 'error.main', transition: 'width 0.5s' }} />
                                </Box>
                                <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                                    {pct.toFixed(1)}% — {summary.presentCount} present out of {summary.totalDays} days
                                </Typography>
                            </Paper>
                        </>
                    )}
                </Box>
            )}

            {/* ════ Tab 4 — Admin Dashboard ════ */}
            {attTab === 4 && (
                <Box>
                    {adminData.length > 0 && (
                        <Grid container spacing={2} mb={3}>
                            <Grid item xs={6} sm={3}><AttStatCard label="Total Records" value={adminTotals.total} icon={<EventAvailable />} color="#1976d2" /></Grid>
                            <Grid item xs={6} sm={3}><AttStatCard label="Total Present" value={adminTotals.present} icon={<CheckCircle />} color="#2e7d32" /></Grid>
                            <Grid item xs={6} sm={3}><AttStatCard label="Total Absent" value={adminTotals.absent} icon={<Cancel />} color="#d32f2f" /></Grid>
                            <Grid item xs={6} sm={3}><AttStatCard label="Total Holiday" value={adminTotals.holiday} icon={<EmojiEvents />} color="#ed6c02" /></Grid>
                        </Grid>
                    )}
                    <TextField size="small" placeholder="Search…" value={adminSearch}
                        onChange={e => setAdminSearch(e.target.value)} sx={{ mb: 2, maxWidth: 280 }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
                    {adminLoading ? <CircularProgress /> : (
                        <TableContainer component={Paper} elevation={1}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'primary.main' }}>
                                        {['Student', 'Total', 'Present', 'Absent', 'Holiday', 'Attendance %'].map(h => (
                                            <TableCell key={h} sx={{ color: '#fff', fontWeight: 700 }}
                                                align={h === 'Student' ? 'left' : 'center'}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {adminFiltered.length === 0 ? (
                                        <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                            {adminData.length === 0 ? 'No data yet. Mark attendance first.' : 'No results.'}
                                        </TableCell></TableRow>
                                    ) : adminFiltered.map((r, i) => {
                                        const p = r.attendancePercentage ?? 0;
                                        return (
                                            <TableRow key={r.userId || i} hover>
                                                <TableCell>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Avatar sx={{ width: 26, height: 26, bgcolor: 'primary.main', fontSize: '0.7rem' }}>
                                                            {(r.name || 'U')[0].toUpperCase()}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={600}>{r.name || '—'}</Typography>
                                                            <Typography variant="caption" color="text.secondary">{r.studentId || r.userId?.slice(0, 10)}</Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="center">{r.totalDays ?? 0}</TableCell>
                                                <TableCell align="center"><Chip label={r.presentCount ?? 0} size="small" color="success" variant="outlined" /></TableCell>
                                                <TableCell align="center"><Chip label={r.absentCount ?? 0} size="small" color="error" variant="outlined" /></TableCell>
                                                <TableCell align="center"><Chip label={r.holidayCount ?? 0} size="small" color="warning" variant="outlined" /></TableCell>
                                                <TableCell align="center">
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Box sx={{ flex: 1, bgcolor: 'grey.200', borderRadius: 4, overflow: 'hidden', height: 8 }}>
                                                            <Box sx={{ width: `${Math.min(p, 100)}%`, height: '100%', bgcolor: p >= 75 ? 'success.main' : 'error.main' }} />
                                                        </Box>
                                                        <Chip label={`${p.toFixed(1)}%`} size="small" color={p >= 75 ? 'success' : 'error'} />
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>
            )}

            {/* Success Dialog */}
            <Dialog open={!!success} onClose={() => setSuccess('')} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <Box sx={{ background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)', py: 3, textAlign: 'center' }}>
                    <CheckCircle sx={{ fontSize: 60, color: '#fff' }} />
                </Box>
                <DialogContent sx={{ textAlign: 'center', pt: 3 }}>
                    <Typography variant="h6" fontWeight={800} color="success.main" gutterBottom>Attendance Marked!</Typography>
                    <Typography variant="body2" color="text.secondary">{success}</Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
                    <Button variant="contained" color="success" onClick={() => setSuccess('')} fullWidth sx={{ borderRadius: 2, py: 1, fontWeight: 700 }}>Great!</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}


// ═══════════════════════════════════════════════════════════════════════════
// Panel: Student List (View Only Approved Students)
// ═══════════════════════════════════════════════════════════════════════════
function StudentListModule() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetch = useCallback(async () => {
        try {
            setLoading(true);
            const res = await adminStudentAPI.getAllStudents();
            setStudents((res.data.data || []).filter(s => s.isApproved));
        } catch { }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    const filtered = students.filter(s =>
        !search || s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.studentId?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={700}>Student List</Typography>
                <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={fetch} disabled={loading}>Refresh</Button>
            </Box>
            <TextField
                size="small" placeholder="Search..."
                value={search} onChange={e => setSearch(e.target.value)}
                sx={{ mb: 2, maxWidth: 320 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            />
            {loading ? <CircularProgress /> : (
                <TableContainer component={Paper} elevation={1}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell><b>Name</b></TableCell>
                                <TableCell><b>Email</b></TableCell>
                                <TableCell><b>Course</b></TableCell>
                                <TableCell><b>Status</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.length === 0
                                ? <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>No approved students found.</TableCell></TableRow>
                                : filtered.map(s => (
                                    <TableRow key={s._id} hover>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.75rem' }}>{s.name?.[0]}</Avatar>
                                                <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell><Typography variant="body2">{s.email}</Typography></TableCell>
                                        <TableCell><Typography variant="body2">{s.courseName || s.course?.name || '—'}</Typography></TableCell>
                                        <TableCell><Chip label="Approved" size="small" color="success" variant="outlined" /></TableCell>
                                    </TableRow>
                                ))
                            }
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Panel: Courses (catalog list for admin overview)
// ═══════════════════════════════════════════════════════════════════════════
function CoursesPanel() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [catOpen, setCatOpen] = useState(false);
    const [catData, setCatData] = useState({ name: '', categoryId: '', description: '', imageUrl: '', fees: '', duration: '' });
    const [catFile, setCatFile] = useState(null);
    const [catSaving, setCatSaving] = useState(false);
    const [catNames, setCatNames] = useState([]);

    const fetchCourses = () => {
        setLoading(true);
        courseAPI.getAllCourses()
            .then(r => setCourses(r.data.data || []))
            .catch(() => setError('Failed to load courses.'))
            .finally(() => setLoading(false));
    };

    const fetchCatNames = () => {
        courseAPI.getCategoryNames()
            .then(r => setCatNames(r.data.data || []))
            .catch(() => console.error('Failed to fetch category names'));
    };

    const getImageUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const cleanUrl = url.replace(/\\/g, '/').replace(/^\//, '');
        const baseUrl = STUDENT_API_URL.endsWith('/api') ? STUDENT_API_URL.slice(0, -4) : STUDENT_API_URL;
        return `${baseUrl}/${cleanUrl}`;
    };

    const categoryNameMap = {
        '1001': 'AI',
        '1002': 'Web Development'
    };

    useEffect(() => {
        fetchCourses();
        fetchCatNames();
    }, []);

    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            setCatSaving(true);
            setError('');

            let finalImageUrl = catData.imageUrl || '';

            // 1. Upload to Cloudinary if a file is selected
            if (catFile) {
                const cloudFormData = new FormData();
                cloudFormData.append('file', catFile);
                // The upload preset must be created in Cloudinary settings (Settings -> Upload -> Add Upload Preset)
                // Ensure it is set to "Unsigned" mode.
                cloudFormData.append('upload_preset', 'zdxqbgct'); // Common default, or 'student_portal_preset'
                cloudFormData.append('cloud_name', 'druuaiprp');

                const cloudRes = await fetch('https://api.cloudinary.com/v1_1/druuaiprp/image/upload', {
                    method: 'POST',
                    body: cloudFormData
                });

                const cloudData = await cloudRes.json();

                if (cloudData.error) {
                    throw new Error(`Cloudinary Error: ${cloudData.error.message}. Please ensure you have an unsigned upload preset named 'ml_default' in Cloudinary!`);
                }

                finalImageUrl = cloudData.secure_url;
            }

            // 2. Send JSON payload to Backend
            await courseAPI.addCategory({
                name: catData.name,
                description: catData.description,
                imageUrl: finalImageUrl,
                fees: catData.fees,
                duration: catData.duration,
                categoryId: catData.categoryId,
            });

            setSuccess('Course added successfully!');
            setCatOpen(false);
            setCatData({ name: '', categoryId: '', description: '', imageUrl: '', fees: '', duration: '' });
            setCatFile(null);
            fetchCourses();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to add course');
        } finally {
            setCatSaving(false);
        }
    };

    if (loading && courses.length === 0) return <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>;

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={700}>All Courses</Typography>
                <Box>
                    <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={fetchCourses} disabled={loading} sx={{ mr: 1 }}>Refresh</Button>
                    <Button variant="contained" size="small" onClick={() => setCatOpen(true)}>Add Course</Button>
                </Box>
            </Box>

            {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}
            {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

            {courses.length === 0
                ? <Typography color="text.secondary">No courses available.</Typography>
                : (
                    <Grid container spacing={2}>
                        {courses.map(c => (
                            <Grid item xs={12} sm={6} md={4} key={c._id}>
                                <Card>
                                    <Box sx={{ height: 140, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        {c.imageUrl ? (
                                            <Box
                                                component="img"
                                                src={getImageUrl(c.imageUrl)}
                                                alt={c.name}
                                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://via.placeholder.com/300x140.png?text=Image+Not+Found';
                                                }}
                                            />
                                        ) : (
                                            <MenuBook sx={{ fontSize: 40, color: 'text.disabled' }} />
                                        )}
                                    </Box>
                                    <CardContent>
                                        <Chip label={categoryNameMap[c.categoryId] || c.categoryId || c.category || 'Category'} size="small" color="primary" variant="outlined" sx={{ mb: 1 }} />
                                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>{c.name || c.title}</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {c.description || 'No description.'}
                                        </Typography>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <AccessTime sx={{ fontSize: 14 }} /> {c.duration || 'N/A'} Months
                                            </Typography>
                                            <Typography variant="caption" fontWeight={700} color="primary.main">
                                                {c.fees || c.price ? `₹${c.fees || c.price}` : 'Free'}
                                            </Typography>
                                        </Box>
                                        <Box display="flex" justifyContent="flex-start" mt={0.5}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Status: {c.status || 'Active'}</Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )
            }

            {/* Add Course Dialog */}
            <Dialog open={catOpen} onClose={() => setCatOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add New Course</DialogTitle>
                <form onSubmit={handleAddCategory}>
                    <DialogContent dividers>
                        <TextField
                            label="Course Name" fullWidth size="small" required sx={{ mb: 2 }}
                            value={catData.name} onChange={e => setCatData({ ...catData, name: e.target.value })}
                        />
                        <TextField
                            select
                            label="Category" fullWidth size="small" required sx={{ mb: 2 }}
                            value={catData.categoryId} onChange={e => setCatData({ ...catData, categoryId: e.target.value })}
                        >
                            {catNames.map((name) => (
                                <MenuItem key={name} value={name === 'AI' ? '1001' : (name === 'Web Development' ? '1002' : name)}>
                                    {name}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="Description" fullWidth size="small" multiline rows={3} sx={{ mb: 2 }}
                            value={catData.description} onChange={e => setCatData({ ...catData, description: e.target.value })}
                        />
                        <Box sx={{ mb: 2, p: 2, border: '1px dashed grey', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                Course Image (Choose File OR paste Image URL)
                            </Typography>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={e => setCatFile(e.target.files[0])}
                                style={{ width: '100%', marginBottom: '10px' }}
                            />
                            <Typography variant="caption" display="block" align="center" sx={{ my: 1 }}>OR</Typography>
                            <TextField
                                label="Image URL" fullWidth size="small"
                                placeholder="https://example.com/image.jpg"
                                value={catData.imageUrl} onChange={e => setCatData({ ...catData, imageUrl: e.target.value })}
                            />
                        </Box>
                        <TextField
                            label="Fees" type="number" fullWidth size="small"
                            value={catData.fees} onChange={e => setCatData({ ...catData, fees: e.target.value })}
                        />
                        <TextField
                            label="Duration (Months)" type="number" fullWidth size="small" sx={{ mt: 2 }}
                            value={catData.duration} onChange={e => setCatData({ ...catData, duration: e.target.value })}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCatOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={catSaving}>
                            {catSaving ? 'Saving...' : 'Add Course'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}



// ═══════════════════════════════════════════════════════════════════════════
// Panel: Leaderboard
// ═══════════════════════════════════════════════════════════════════════════
function LeaderboardPanel() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchLeaderboard = () => {
        setLoading(true);
        leaderboardAPI.getLeaderboard()
            .then(r => setData(r.data.data || []))
            .catch(() => setError('Failed to load leaderboard.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const medal = ['🥇', '🥈', '🥉'];

    if (loading) return <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={700}>🏆 Top Students Leaderboard</Typography>
                <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={fetchLeaderboard} disabled={loading}>Refresh</Button>
            </Box>
            {data.length === 0
                ? <Typography color="text.secondary">No data available yet.</Typography>
                : (
                    <TableContainer component={Paper} elevation={1}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell align="center"><b>Rank</b></TableCell>
                                    <TableCell><b>Student</b></TableCell>
                                    <TableCell align="right"><b>Score</b></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.map((s, i) => (
                                    <TableRow key={s._id || i} hover sx={{ bgcolor: i < 3 ? 'action.hover' : 'inherit' }}>
                                        <TableCell align="center">
                                            <Typography variant="h6">{medal[i] || i + 1}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Avatar sx={{ width: 30, height: 30, bgcolor: i < 3 ? 'primary.main' : 'grey.400', fontSize: '0.8rem' }}>
                                                    {s.name?.[0] || 'S'}
                                                </Avatar>
                                                <Typography variant="body2" fontWeight={600}>{s.name || 'Anonymous'}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body1" fontWeight={700} color={i < 3 ? 'primary.main' : 'text.primary'}>
                                                {s.totalScore ?? s.score ?? 0} pts
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )
            }
        </Box>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Panel: Notifications
// ═══════════════════════════════════════════════════════════════════════════
function NotificationsPanel() {
    const [notifs, setNotifs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchNotifications = () => {
        setLoading(true);
        notificationAPI.getNotifications()
            .then(r => setNotifs(r.data.data || []))
            .catch(() => setError('Failed to load notifications.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    if (loading) return <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={700}>Notifications</Typography>
                <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={fetchNotifications} disabled={loading}>Refresh</Button>
            </Box>
            {notifs.length === 0
                ? <Typography color="text.secondary">No notifications.</Typography>
                : notifs.map((n, i) => (
                    <Paper key={n._id || i} elevation={1} sx={{ p: 2, mb: 1.5, borderLeft: `4px solid`, borderColor: n.isRead ? 'grey.300' : 'primary.main' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                            <Typography variant="subtitle2" fontWeight={n.isRead ? 500 : 700}>{n.title || 'Notification'}</Typography>
                            {!n.isRead && <Chip label="New" size="small" color="error" />}
                        </Box>
                        <Typography variant="body2" color="text.secondary">{n.body || n.message}</Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
                            {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                        </Typography>
                    </Paper>
                ))
            }
        </Box>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Panel: Enrollments
// ═══════════════════════════════════════════════════════════════════════════
function EnrollmentsPanel() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchEnrollments = () => {
        setLoading(true);
        enrollmentAPI.getMyCourses()
            .then(r => setData(r.data.data || []))
            .catch(() => setError('Failed to load enrollments.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchEnrollments();
    }, []);

    if (loading) return <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={700}>Enrollments</Typography>
                <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={fetchEnrollments} disabled={loading}>Refresh</Button>
            </Box>
            {data.length === 0
                ? <Typography color="text.secondary">No enrolled courses found.</Typography>
                : (
                    <TableContainer component={Paper} elevation={1}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell><b>Course</b></TableCell>
                                    <TableCell><b>Category</b></TableCell>
                                    <TableCell><b>Enrolled On</b></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.map(e => (
                                    <TableRow key={e._id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>{e.course?.title || '—'}</Typography>
                                            <Typography variant="caption" color="text.secondary">{e.course?.description?.slice(0, 60) || ''}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={e.course?.category?.name || e.course?.category || 'General'} size="small" />
                                        </TableCell>
                                        <TableCell>{e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString() : '—'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )
            }
        </Box>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Panel: Tasks Dashboard
// ═══════════════════════════════════════════════════════════════════════════
function TasksPanel() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            const res = await taskAPI.getAdminDashboard();
            setStats(res.data?.data || null);
        } catch (err) {
            setError('Failed to load task statistics.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (loading) return <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>;

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={700}>Overall Task Dashboard</Typography>
                <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={fetchStats}>Refresh</Button>
            </Box>

            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{
                        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                        color: '#fff',
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-2px)' }
                    }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ fontSize: 32 }}>📝</Box>
                            <Box>
                                <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1 }}>
                                    {stats?.totalTasks ?? 0}
                                </Typography>
                                <Typography variant="caption" fontWeight={600} sx={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Total Tasks
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Portal Connect Gate — required before any sub-module is shown
// ═══════════════════════════════════════════════════════════════════════════
function PortalConnect({ onConnect }) {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!identifier || !password) { setError('Identifier and password are required.'); return; }
        try {
            setLoading(true); setError('');
            const res = await portalAuthAPI.login({ identifier, password });
            const token = res.data?.token || res.data?.data?.token;
            if (!token) throw new Error('No token returned');
            setStudentPortalToken(token);
            onConnect();
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Check credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
            <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%', borderRadius: 3 }}>
                <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                    <Box sx={{ bgcolor: 'primary.main', borderRadius: '50%', p: 1.5, mb: 1.5 }}>
                        <Lock sx={{ color: '#fff', fontSize: 32 }} />
                    </Box>
                    <Typography variant="h6" fontWeight={700}>Connect to Student Portal</Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center" mt={0.5}>
                        The Student Portal uses a separate authentication system.<br />
                        Enter your <strong>Student Portal admin credentials</strong> to continue.
                    </Typography>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box component="form" onSubmit={handleLogin}>
                    <TextField
                        fullWidth size="small" label="Email / Username (Identifier)" type="text"
                        value={identifier} onChange={e => setIdentifier(e.target.value)}
                        sx={{ mb: 2 }} autoComplete="username"
                        placeholder="Enter your email or username"
                    />
                    <TextField
                        fullWidth size="small" label="Password" type="password"
                        value={password} onChange={e => setPassword(e.target.value)}
                        sx={{ mb: 3 }} autoComplete="current-password"
                    />
                    <Button
                        type="submit" variant="contained" fullWidth
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
                    >
                        {loading ? 'Connecting…' : 'Connect'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Panel: Course Documents
// ═══════════════════════════════════════════════════════════════════════════
function DocumentsPanel() {
    const [courses, setCourses] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [loadingDocs, setLoadingDocs] = useState(true);

    // Upload form
    const [courseId, setCourseId] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    const fetchDocs = useCallback(async () => {
        setLoadingDocs(true);
        try {
            const res = await documentAPI.getAllAdminDocuments();
            setDocuments(res.data.data || []);
        } catch (err) {
            console.error('Failed to load documents:', err);
        } finally {
            setLoadingDocs(false);
        }
    }, []);

    useEffect(() => {
        courseAPI.getAllCourses()
            .then(res => setCourses(res.data?.data || res.data || []))
            .catch(console.error)
            .finally(() => setLoadingCourses(false));

        fetchDocs();
    }, [fetchDocs]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!courseId) return setMsg({ type: 'error', text: 'Please select a course.' });
        if (!file) return setMsg({ type: 'error', text: 'Please choose a file to upload.' });

        setUploading(true);
        setMsg({ type: '', text: '' });

        const selectedCourse = courses.find(c => (c.courseId || c._id) === courseId);
        const courseName = selectedCourse ? (selectedCourse.name || selectedCourse.courseName) : 'Unknown Course';

        const formData = new FormData();
        formData.append('file', file);
        formData.append('courseId', courseId);
        formData.append('courseName', courseName);

        const uStr = localStorage.getItem('user');
        let uploadUserId = 'admin';
        if (uStr) {
            try { const u = JSON.parse(uStr); uploadUserId = u._id || 'admin'; } catch (e) { }
        }

        // Add uploadUserId to formData in case backend expects it in the body instead
        formData.append('userId', uploadUserId);

        try {
            await documentAPI.uploadDocument(formData);
            setMsg({ type: 'success', text: 'Document uploaded successfully!' });
            setFile(null);
            setCourseId('');
            const fileInput = document.getElementById('upload-course-doc-input');
            if (fileInput) fileInput.value = '';
            fetchDocs();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to upload document' });
        } finally {
            setUploading(false);
        }
    };

    const getFileUrl = (url) => {
        if (!url) return '#';
        if (url.startsWith('http')) return url;
        const base = STUDENT_API_URL.replace('/api', '');
        return `${base}/${url.startsWith('/') ? url.slice(1) : url}`;
    };

    return (
        <Box>
            <Typography variant="h6" fontWeight={800} color="primary.main" mb={3} display="flex" alignItems="center" gap={1}>
                <CloudUpload /> Course Documents
            </Typography>

            <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Typography variant="subtitle1" fontWeight={700} mb={3}>Upload Section</Typography>

                        {msg.text && <Alert severity={msg.type} sx={{ mb: 3 }} onClose={() => setMsg({ type: '', text: '' })}>{msg.text}</Alert>}

                        <form onSubmit={handleUpload}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" mb={1} display="block">SELECT COURSE</Typography>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                sx={{ mb: 3 }}
                                value={courseId}
                                onChange={e => setCourseId(e.target.value)}
                                disabled={loadingCourses}
                            >
                                <MenuItem value=""><em>-- Select Course --</em></MenuItem>
                                {courses.map(c => <MenuItem key={c.courseId || c._id} value={c.courseId || c._id}>{c.name || c.courseName}</MenuItem>)}
                            </TextField>

                            <Typography variant="caption" fontWeight={700} color="text.secondary" mb={1} display="block">UPLOAD FILE</Typography>
                            <TextField
                                type="file"
                                fullWidth
                                size="small"
                                id="upload-course-doc-input"
                                sx={{ mb: 4 }}
                                onChange={handleFileChange}
                                InputLabelProps={{ shrink: true }}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                disabled={uploading || loadingCourses}
                                startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
                                sx={{ py: 1.5, fontWeight: 800 }}
                            >
                                {uploading ? 'Uploading...' : 'Submit'}
                            </Button>
                        </form>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={8}>
                    <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider', maxHeight: 600 }}>
                        <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="subtitle1" fontWeight={700}>📄 Document List Table</Typography>
                        </Box>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800, bgcolor: 'rgba(0,0,0,0.02)' }}>Course Name</TableCell>
                                    <TableCell sx={{ fontWeight: 800, bgcolor: 'rgba(0,0,0,0.02)' }}>File Name</TableCell>
                                    <TableCell sx={{ fontWeight: 800, bgcolor: 'rgba(0,0,0,0.02)' }}>Uploaded Date</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 800, bgcolor: 'rgba(0,0,0,0.02)' }}>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loadingDocs ? (
                                    <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
                                ) : documents.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}>No documents found.</TableCell></TableRow>
                                ) : documents.map((doc, i) => (
                                    <TableRow key={doc.documentId || doc._id || i} hover>
                                        <TableCell sx={{ fontWeight: 600 }}>{doc.courseName || doc.course}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ wordBreak: 'break-all', fontWeight: 500, color: 'primary.main' }}>
                                                {doc.fileName}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                                            {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString('en-IN', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            }) : 'N/A'}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<FileDownload fontSize="small" />}
                                                href={getFileUrl(doc.fileUrl)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                                            >
                                                Download
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>
        </Box>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Panel: Student Admission Form
// ═══════════════════════════════════════════════════════════════════════════
const ADMISSION_API = `${STUDENT_API_URL}/auth/register`;
const COURSES_API = `${STUDENT_API_URL}/courses/categories/list`;

function AdmissionFormPanel() {
    const [form, setForm] = useState({ name: '', classType: 'Online', course: '', phone: '', email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [snack, setSnack] = useState({ open: false, msg: '', severity: 'error' });
    const [courses, setCourses] = useState([]);
    const [coursesLoading, setCoursesLoading] = useState(true);

    // Fetch courses from student portal API on mount
    useEffect(() => {
        setCoursesLoading(true);
        courseAPI.getCategories()
            .then(res => {
                const data = res.data;
                const list = (data.data || data.courses || data || []).map(c => ({
                    _id: c.courseId || c._id,
                    name: c.name || c.courseName || c.title || c.course || c._id,
                })).filter(c => c.name);
                setCourses(list);
            })
            .catch(() => setCourses([]))
            .finally(() => setCoursesLoading(false));
    }, []);

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Full name is required';
        if (form.classType === 'Offline' && !form.course) e.course = 'Please select a course';
        if (!form.phone.trim()) e.phone = 'Phone number is required';
        else if (!/^\d+$/.test(form.phone.trim())) e.phone = 'Phone must be numeric';
        else if (form.phone.trim().length < 10) e.phone = 'Phone must be at least 10 digits';
        
        if (!form.email.trim()) e.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address';
        
        if (!form.password) e.password = 'Password is required';
        else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
        
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
        if (errors[name]) setErrors(er => ({ ...er, [name]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            const payload = {
                name: form.name.trim(),
                mobile: form.phone.trim(), // Changed 'phone' to 'mobile' to match backend
                email: form.email.trim(),
                password: form.password,
                studentType: form.classType.toLowerCase(),
            };

            if (form.classType === 'Offline') {
                payload.courseId = form.course;
                const selectedCourse = courses.find(c => c._id === form.course);
                payload.courseName = selectedCourse ? selectedCourse.name : '';
            }

            const res = await portalAuthAPI.register({
                ...payload,
                confirmPassword: form.password // Added for backend validation
            });
            const data = res.data;
            // Axios throws on 4xx/5xx by default, but we check status to be safe if not throwing
            if (res.status !== 200 && res.status !== 201) throw new Error(data.message || `Server error (${res.status})`);
            setSuccessData(data.data);
            setForm({ name: '', classType: 'Online', course: '', phone: '', email: '', password: '' });
            setSnack({ open: true, msg: data.message || 'Admission submitted successfully!', severity: 'success' });
        } catch (err) {
            setSnack({ open: true, msg: err.message || 'Submission failed. Please try again.', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Typography variant="h6" fontWeight={800} color="primary.main" mb={1} display="flex" alignItems="center" gap={1}>
                <PersonSearch /> Student Admission Form
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
                Register a new student by submitting their details. This directly creates an account in the Student Portal.
            </Typography>

            <Grid container spacing={3}>
                {/* ── Left: Form ── */}
                <Grid item xs={12} md={7}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
                        <Box component="form" onSubmit={handleSubmit} noValidate>
                            <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1.2}>
                                Personal Information
                            </Typography>
                            <Divider sx={{ mb: 2, mt: 0.5 }} />

                            <TextField
                                fullWidth name="name" label="Full Name *"
                                value={form.name} onChange={handleChange}
                                error={!!errors.name} helperText={errors.name}
                                size="small" margin="normal"
                                InputProps={{ startAdornment: <InputAdornment position="start"><PersonSearch sx={{ fontSize: 18, color: errors.name ? 'error.main' : 'primary.main' }} /></InputAdornment> }}
                            />
                            <TextField
                                fullWidth name="email" label="Email Address *" type="email"
                                value={form.email} onChange={handleChange}
                                error={!!errors.email} helperText={errors.email}
                                size="small" margin="normal"
                                InputProps={{ startAdornment: <InputAdornment position="start"><Lock sx={{ fontSize: 18, color: errors.email ? 'error.main' : 'primary.main' }} /></InputAdornment> }}
                            />
                            <TextField
                                fullWidth name="phone" label="Phone Number *" type="tel"
                                value={form.phone} onChange={handleChange}
                                error={!!errors.phone} helperText={errors.phone}
                                size="small" margin="normal"
                                InputProps={{ startAdornment: <InputAdornment position="start"><Lock sx={{ fontSize: 18, color: errors.phone ? 'error.main' : 'primary.main' }} /></InputAdornment> }}
                            />
                            <TextField
                                fullWidth name="password" label="Password *"
                                type={showPass ? 'text' : 'password'}
                                value={form.password} onChange={handleChange}
                                error={!!errors.password} helperText={errors.password || 'Minimum 6 characters'}
                                size="small" margin="normal"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Lock sx={{ fontSize: 18, color: errors.password ? 'error.main' : 'primary.main' }} /></InputAdornment>,
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => setShowPass(v => !v)} edge="end">
                                                {showPass ? <Visibility fontSize="small" /> : <Lock fontSize="small" />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />

                            <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1.2} sx={{ display: 'block', mt: 2 }}>
                                Class Type & Course Selection
                            </Typography>
                            <Divider sx={{ mb: 2, mt: 0.5 }} />

                            <FormControl component="fieldset" sx={{ mb: 2 }}>
                                <FormLabel component="legend" sx={{ fontSize: '0.8rem', fontWeight: 700 }}>CLASS TYPE</FormLabel>
                                <RadioGroup
                                    row
                                    name="classType"
                                    value={form.classType}
                                    onChange={handleChange}
                                >
                                    <FormControlLabel value="Online" control={<Radio size="small" />} label="Online" />
                                    <FormControlLabel value="Offline" control={<Radio size="small" />} label="Offline" />
                                </RadioGroup>
                            </FormControl>

                            {form.classType === 'Offline' && (
                                <TextField
                                    fullWidth select name="course" label="Select Course *"
                                    value={form.course} onChange={handleChange}
                                    error={!!errors.course} helperText={errors.course}
                                    size="small"
                                    disabled={coursesLoading}
                                >
                                    <MenuItem value="" disabled>
                                        <em>{coursesLoading ? 'Loading courses…' : courses.length === 0 ? 'No courses available' : 'Choose a course…'}</em>
                                    </MenuItem>
                                    {courses.map(c => (
                                        <MenuItem key={c._id} value={c._id}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <MenuBook sx={{ fontSize: 16, color: 'primary.main' }} />
                                                {c.name}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )}

                            <Button
                                fullWidth type="submit" variant="contained" size="large"
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
                                sx={{ mt: 3, py: 1.4, fontWeight: 700, borderRadius: 2 }}
                            >
                                {loading ? 'Submitting…' : 'Submit Admission'}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                {/* ── Right: Success / Guide ── */}
                <Grid item xs={12} md={5}>
                    {successData ? (
                        <Paper elevation={2} sx={{
                            p: 3, borderRadius: 3,
                            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                            border: '1px solid #bbf7d0'
                        }}>
                            <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                                <CheckCircle sx={{ color: '#16a34a', fontSize: 32 }} />
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={800} color="#16a34a">Admission Successful!</Typography>
                                    <Typography variant="body2" color="text.secondary">Student has been registered</Typography>
                                </Box>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            {[
                                ['Name', successData.name],
                                ['Email', successData.email],
                                ['Admission ID', successData.admissionId],
                                ['User ID', successData.userId],
                            ].filter(([, v]) => v).map(([label, value]) => (
                                <Box key={label} sx={{ display: 'flex', mb: 1, gap: 1 }}>
                                    <Typography variant="body2" fontWeight={700} color="text.secondary" sx={{ minWidth: 100 }}>{label}:</Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-all' }}>{value}</Typography>
                                </Box>
                            ))}
                            <Button
                                fullWidth variant="outlined" color="success" size="small"
                                sx={{ mt: 2, borderRadius: 2, fontWeight: 700 }}
                                onClick={() => setSuccessData(null)}
                            >
                                + Add Another Student
                            </Button>
                        </Paper>
                    ) : (
                        <Paper elevation={0} sx={{
                            p: 3, borderRadius: 3,
                            border: '1px dashed', borderColor: 'divider',
                            bgcolor: 'rgba(0,0,0,0.01)'
                        }}>
                            <Typography variant="subtitle2" fontWeight={700} mb={2} color="text.secondary">📋 Admission Guide</Typography>
                            {[
                                { icon: '👤', text: 'Enter the student\'s full legal name' },
                                { icon: '📧', text: 'Use a valid email — it will be their login' },
                                { icon: '📱', text: 'Phone must be numeric' },
                                { icon: '🔑', text: 'Set a strong password (min 6 chars)' },
                                { icon: '🌐', text: 'Select Class Type (Online or Offline)' },
                                { icon: '📚', text: 'Course is required only for Offline' },
                                { icon: '✅', text: 'Student account is created immediately' },
                            ].map((item, i) => (
                                <Box key={i} display="flex" gap={1.5} mb={1.5} alignItems="flex-start">
                                    <Typography sx={{ fontSize: 18, lineHeight: 1.4 }}>{item.icon}</Typography>
                                    <Typography variant="body2" color="text.secondary">{item.text}</Typography>
                                </Box>
                            ))}
                            <Divider sx={{ my: 2 }} />
                           
                        </Paper>
                    )}
                </Grid>
            </Grid>

            {/* Snackbar */}
            <Dialog open={snack.open && snack.severity === 'success'} onClose={() => setSnack(s => ({ ...s, open: false }))} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
                <Box sx={{ background: 'linear-gradient(135deg, #00b09b 0%, #096939 100%)', py: 3, textAlign: 'center' }}>
                    <CheckCircle sx={{ fontSize: 60, color: '#fff' }} />
                </Box>
                <DialogContent sx={{ textAlign: 'center', pt: 2 }}>
                    <Typography variant="h6" fontWeight={800} color="#096939">Admission Submitted!</Typography>
                    <Typography variant="body2" color="text.secondary" mt={1}>{snack.msg}</Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button fullWidth variant="contained" onClick={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #00b09b 0%, #096939 100%)' }}>OK</Button>
                </DialogActions>
            </Dialog>

            {snack.open && snack.severity === 'error' && (
                <Alert severity="error" onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ mt: 2 }}>
                    {snack.msg}
                </Alert>
            )}
        </Box>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Root component
// ═══════════════════════════════════════════════════════════════════════════
export default function StudentModule() {
    const [active, setActive] = useState('dashboard');
    const [connected, setConnected] = useState(!!getStudentPortalToken());
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

    const handleConnect = () => setConnected(true);
    const handleDisconnect = useCallback(() => { clearStudentPortalToken(); setConnected(false); }, []);

    useEffect(() => {
        const handleUnauthorized = () => {
            // Force disconnect when the API detects a 401
            handleDisconnect();
        };

        window.addEventListener('student_portal_unauthorized', handleUnauthorized);
        return () => window.removeEventListener('student_portal_unauthorized', handleUnauthorized);
    }, [handleDisconnect]);

    if (!connected) {
        return <PortalConnect onConnect={handleConnect} />;
    }

    return (
        <Box display="flex" gap={0} sx={{ minHeight: '80vh', border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            {/* ── Left Navigation ── */}
            <Paper
                elevation={0}
                sx={{
                    width: 240,
                    flexShrink: 0,
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                }}
            >
                <Box sx={{ px: 2, py: 2.5 }}>
                    <Typography variant="overline" fontWeight={700} color="text.secondary" letterSpacing={1.5}>
                        Student Module
                    </Typography>
                </Box>
                <Divider />
                <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1 }}>
                    <MuiList dense sx={{ pt: 1 }}>
                        {MODULES.map(m => (
                            <ListItem key={m.id} disablePadding>
                                <ListItemButton
                                    selected={active === m.id}
                                    onClick={() => setActive(m.id)}
                                    sx={{
                                        my: 0.3, borderRadius: 1.5,
                                        '&.Mui-selected': {
                                            bgcolor: 'primary.main',
                                            color: '#fff',
                                            '& .MuiListItemIcon-root': { color: '#fff' },
                                            '&:hover': { bgcolor: 'primary.dark' },
                                        },
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 36 }}>{m.icon}</ListItemIcon>
                                    <ListItemText
                                        primary={m.label}
                                        primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active === m.id ? 700 : 500 }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </MuiList>
                </Box>

                <Divider sx={{ mt: 'auto' }} />
                <Box sx={{ p: 1.5 }}>
                    <Tooltip title="Disconnect from Student Portal">
                        <Button
                            size="small" color="error" variant="outlined" fullWidth
                            startIcon={<LinkOff fontSize="small" />}
                            onClick={handleDisconnect}
                            sx={{ fontSize: '0.75rem' }}
                        >
                            Disconnect
                        </Button>
                    </Tooltip>
                </Box>
            </Paper>

            {/* ── Right Content ── */}
            <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto' }}>
                {active === 'dashboard' && <DashboardPanel refreshTrigger={refreshTrigger} onTabChange={setActive} />}
                {active === 'students' && <UsersPanel />}
                {active === 'studentList' && <StudentListModule />}
                {active === 'admission' && <AdmissionFormPanel />}
                {active === 'courses' && <CoursesPanel />}
                {active === 'documents' && <DocumentsPanel />}
                {active === 'attendance' && <AttendanceControlPanel onRefresh={triggerRefresh} />}
                {active === 'leaderboard' && <LeaderboardPanel />}
                {active === 'notifications' && <NotificationsPanel />}
                {active === 'enrollments' && <EnrollmentsPanel />}
                {active === 'leave' && <StudentLeaveManagementPanel />}
                {active === 'tasks' && <TasksPanel />}
                {active === 'payment' && <PaymentModule />}
                {active === 'certificates' && <CertificateManagementPanel />}
            </Box>
        </Box>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Module: Payment
// ═══════════════════════════════════════════════════════════════════════════
function PaymentModule() {
    const [subActive, setSubActive] = useState('dashboard');

    const menu = [
        { id: 'dashboard', label: 'Dashboard', icon: <Dashboard fontSize="small" /> },
        { id: 'add', label: 'Add Payment', icon: <AddCard fontSize="small" /> },
        { id: 'list', label: 'All Students', icon: <ListAlt fontSize="small" /> },
        { id: 'student-list', label: 'Student List', icon: <Group fontSize="small" /> },
        { id: 'reports', label: 'Reports', icon: <FileDownload fontSize="small" /> },
    ];

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
                {menu.map(m => (
                    <Button
                        key={m.id}
                        size="small"
                        variant={subActive === m.id ? 'contained' : 'outlined'}
                        startIcon={m.icon}
                        onClick={() => setSubActive(m.id)}
                        sx={{ borderRadius: 2, textTransform: 'none', px: 2 }}
                    >
                        {m.label}
                    </Button>
                ))}
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Box sx={{ flexGrow: 1 }}>
                {subActive === 'dashboard' && <PaymentDashboard onTabChange={setSubActive} />}
                {subActive === 'add' && <AddPaymentForm onAdded={() => setSubActive('list')} />}
                {subActive === 'list' && <AllStudentsList />}
                {subActive === 'student-list' && <PaymentList />}
                {subActive === 'reports' && <PaymentReports />}
            </Box>
        </Box>
    );
}

// --- Payment Sub-Views ---

function PaymentDashboard({ onTabChange }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();

    useEffect(() => {
        paymentAPI.getReport({ month, year })
            .then(res => setData(res.data.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [month, year]);

    if (loading) return <CircularProgress />;

    const stats = [
        { label: 'Total Students', value: data?.totalStudents, icon: <PeopleOutlined />, color: '#1976d2', tab: 'list' },
        { label: 'Paid Students', value: data?.paidStudents, icon: <CheckCircle />, color: '#2e7d32', tab: 'list' },
        { label: 'Unpaid Students', value: data?.unpaidStudents, icon: <Cancel />, color: '#d32f2f', tab: 'list' },
        { label: 'Total Collection', value: `₹${(data?.totalCollection || 0).toLocaleString()}`, icon: <AccountBalanceWallet />, color: '#00bfa5', tab: 'reports' },
    ];

    return (
        <Box>
            <Typography variant="h6" fontWeight={800} mb={3} color="primary.main">
                💰 Payment Dashboard ({new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date())} {year})
            </Typography>
            <Grid container spacing={3}>
                {stats.map((s, i) => (
                    <Grid item xs={12} sm={6} md={3} key={i}>
                        <Card
                            onClick={() => s.tab && onTabChange(s.tab)}
                            sx={{
                                borderRadius: 3,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                cursor: 'pointer',
                                transition: '0.3s',
                                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 25px rgba(0,0,0,0.1)', borderColor: s.color }
                            }}
                        >
                            <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                <Box sx={{ mb: 1.5, color: s.color, display: 'flex', justifyContent: 'center' }}>
                                    {React.cloneElement(s.icon, { sx: { fontSize: 32 } })}
                                </Box>
                                <Typography variant="h4" fontWeight={900} sx={{ mb: 0.5 }}>{s.value ?? 0}</Typography>
                                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                                    [ {s.label} ]
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}

function AddPaymentForm({ onAdded }) {
    const [form, setForm] = useState({
        userId: '',
        courseId: '',
        courseName: '',
        courseFees: '',
        paidAmount: '',
        remainingAmount: '',
        amount: '',
        method: 'cash',
        type: 'Installment 1'
    });
    const [students, setStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [loadingCourse, setLoadingCourse] = useState(false);
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    const fetchStudents = async () => {
        if (students.length > 0) return;
        setLoadingStudents(true);
        setMsg({ type: '', text: '' });
        try {
            const res = await adminStudentAPI.getAllStudents();
            const list = res.data?.students || res.data?.data || (Array.isArray(res.data) ? res.data : []);
            if (Array.isArray(list)) {
                const filtered = list.filter(s => s.isApproved !== false);
                setStudents(filtered);
                if (filtered.length === 0) setMsg({ type: 'warning', text: 'No approved students found.' });
            }
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to fetch student list.' });
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleStudentChange = async (newValue) => {
        if (!newValue) {
            setForm(prev => ({ ...prev, userId: '', courseId: '', courseName: '', courseFees: '', paidAmount: '', remainingAmount: '' }));
            return;
        }

        setForm(prev => ({ ...prev, userId: newValue._id, courseId: '', courseName: '', courseFees: '', paidAmount: '', remainingAmount: '' }));
        setLoadingCourse(true);
        setMsg({ type: '', text: '' });

        try {
            const res = await paymentAPI.getStudentCourse(newValue._id);
            const d = res.data?.data;
            setForm(prev => ({
                ...prev,
                courseId: d?.courseId || '',
                courseName: d?.courseTitle || 'N/A',
                courseFees: d?.fees != null ? String(d.fees) : '0',
                paidAmount: d?.paidAmount != null ? String(d.paidAmount) : '0',
                remainingAmount: d?.remainingAmount != null ? String(d.remainingAmount) : '0',
            }));
        } catch (err) {
            setMsg({ type: 'warning', text: 'Could not load course details for this student.' });
            setForm(prev => ({ ...prev, courseId: '', courseName: 'N/A', courseFees: '0', paidAmount: '0', remainingAmount: '0' }));
        } finally {
            setLoadingCourse(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.userId) return setMsg({ type: 'error', text: 'Please select a student' });
        setSubmitting(true);
        const payload = {
            userId: form.userId,
            courseId: form.courseId || null,
            amount: form.amount,
            method: form.method,
            type: form.type
        };

        try {
            await paymentAPI.add(payload);
            setMsg({ type: 'success', text: 'Payment recorded successfully!' });
            setTimeout(() => onAdded(), 1500);
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to add payment' });
        } finally {
            setSubmitting(false);
        }
    };

    const roField = (val) => ({
        fullWidth: true, size: 'small', variant: 'filled', disabled: true,
        value: loadingCourse ? 'Loading…' : val,
        placeholder: 'Auto-filled',
        InputProps: loadingCourse ? { endAdornment: <CircularProgress size={16} /> } : {},
    });

    const fmtCurrency = (v) => v !== '' ? `₹ ${Number(v).toLocaleString('en-IN')}` : '';

    return (
        <Paper sx={{ p: 4, borderRadius: 3, maxWidth: 560, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
            <Box sx={{ borderBottom: '2px solid', borderColor: 'primary.main', pb: 1, mb: 4 }}>
                <Typography variant="h6" fontWeight={900} display="flex" alignItems="center" gap={1}>
                    <Payments color="primary" /> Manual Payment Entry
                </Typography>
            </Box>

            {msg.text && <Alert severity={msg.type} sx={{ mb: 3 }} onClose={() => setMsg({ type: '', text: '' })}>{msg.text}</Alert>}

            <form onSubmit={handleSubmit}>
                <Grid container spacing={2.5}>

                    {/* Student Name */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" fontWeight={700} mb={0.5}>Student Name:</Typography>
                        <Autocomplete
                            open={open}
                            onOpen={() => { setOpen(true); fetchStudents(); }}
                            onClose={() => setOpen(false)}
                            options={students}
                            getOptionLabel={(option) => `${option.name} (${option.studentId || 'No ID'})`}
                            loading={loadingStudents}
                            onChange={(e, v) => handleStudentChange(v)}
                            renderInput={(params) => (
                                <TextField {...params} variant="outlined" size="small" placeholder="Select Student ▼"
                                    InputProps={{
                                        ...params.InputProps, endAdornment: (
                                            <React.Fragment>
                                                {loadingStudents ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </React.Fragment>
                                        )
                                    }}
                                />
                            )}
                        />
                    </Grid>

                    {/* Course Name — full width */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" fontWeight={700} mb={0.5}>Course Name:</Typography>
                        <TextField {...roField(form.courseName)} />
                    </Grid>

                    {/* Total Fees | Paid Amount | Remaining Amount */}
                    <Grid item xs={12} sm={4}>
                        <Typography variant="subtitle2" fontWeight={700} mb={0.5}>Total Fees:</Typography>
                        <TextField {...roField(fmtCurrency(form.courseFees))} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Typography variant="subtitle2" fontWeight={700} mb={0.5}>Paid Amount:</Typography>
                        <TextField {...roField(fmtCurrency(form.paidAmount))} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Typography variant="subtitle2" fontWeight={700} mb={0.5}>Remaining Amount:</Typography>
                        <TextField {...roField(fmtCurrency(form.remainingAmount))} />
                    </Grid>

                    <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                    </Grid>

                    {/* Amount Paying | Payment Method */}
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" fontWeight={700} mb={0.5}>Amount Paying:</Typography>
                        <TextField
                            fullWidth type="number" size="small" placeholder="Enter Amount" required
                            value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" fontWeight={700} mb={0.5}>Payment Method:</Typography>
                        <TextField
                            select fullWidth size="small"
                            value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}
                        >
                            <MenuItem value="cash">Cash</MenuItem>
                            <MenuItem value="upi">UPI</MenuItem>
                            <MenuItem value="card">Card</MenuItem>
                            <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                            <MenuItem value="cheque">Cheque</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" fontWeight={700} mb={0.5}>Payment Type:</Typography>
                        <TextField
                            select fullWidth size="small"
                            value={form.type || 'Installment 1'} onChange={e => setForm({ ...form, type: e.target.value })}
                        >
                            <MenuItem value="Installment 1">Installment 1</MenuItem>
                            <MenuItem value="Installment 2">Installment 2</MenuItem>
                            <MenuItem value="Installment 3">Installment 3</MenuItem>
                            <MenuItem value="Installment 4">Installment 4</MenuItem>
                            <MenuItem value="Down Payment">Down Payment</MenuItem>
                            <MenuItem value="Full Payment">Full Payment</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid item xs={12} sx={{ mt: 2 }}>
                        <Button
                            type="submit" variant="contained" fullWidth disabled={submitting || loadingCourse}
                            sx={{ py: 1.5, fontWeight: 900, borderRadius: 2, fontSize: '1rem', textTransform: 'uppercase' }}
                        >
                            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Payment'}
                        </Button>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
}


function PaymentList() {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ status: 'all', month: new Date().getMonth() + 1 });

    useEffect(() => {
        setLoading(true);
        paymentAPI.getList({ ...filter, year: new Date().getFullYear() })
            .then(res => setList(res.data.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [filter]);

    const getStatusChip = (status) => {
        const s = status?.toLowerCase();
        if (s === 'paid') return <Chip label="Paid" size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 700 }} />;
        if (s === 'partial') return <Chip label="Partial" size="small" sx={{ bgcolor: '#fffde7', color: '#fbc02d', fontWeight: 700 }} />;
        return <Chip label="Pending" size="small" sx={{ bgcolor: '#ffebee', color: '#c62828', fontWeight: 700 }} />;
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight={800} color="primary.main">
                    📋 Student Payments
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        select size="small" label="Status" sx={{ width: 120 }}
                        value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}
                    >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="Paid">Paid</MenuItem>
                        <MenuItem value="Partial">Partial</MenuItem>
                        <MenuItem value="Pending">Pending</MenuItem>
                    </TextField>
                    <TextField
                        select size="small" label="Month" sx={{ width: 120 }}
                        value={filter.month} onChange={e => setFilter({ ...filter, month: e.target.value })}
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <MenuItem key={i + 1} value={i + 1}>{new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(2000, i))}</MenuItem>
                        ))}
                    </TextField>
                </Box>
            </Box>

            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Course</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Duration</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Total</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Paid</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Remaining</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Method</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Date & Time</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={9} align="center" sx={{ py: 3 }}><CircularProgress size={24} /></TableCell></TableRow>
                        ) : list.length === 0 ? (
                            <TableRow><TableCell colSpan={9} align="center" sx={{ py: 3 }}>No payment records found.</TableCell></TableRow>
                        ) : list.map((row) => (
                            <TableRow key={row._id} hover>
                                <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                                <TableCell>{row.course}</TableCell>
                                <TableCell>{row.duration}</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>₹ {(row.totalFees || row.total)?.toLocaleString() || 0}</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>₹ {(row.paidAmount || row.paid)?.toLocaleString() || 0}</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'error.main' }}>₹ {(row.pendingAmount || row.remaining)?.toLocaleString() || 0}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{row.status}</TableCell>
                                <TableCell sx={{ textTransform: 'capitalize' }}>{row.method}</TableCell>
                                <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                                    {row.date && !row.date.includes('T') ? row.date : (row.date ? new Date(row.date).toLocaleString('en-IN', {
                                        day: '2-digit', month: 'short', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit', hour12: true
                                    }) : 'N/A')}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// All Students List (Refactored - Global, Search-able)
// ═══════════════════════════════════════════════════════════════════════════
function AllStudentsList() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // No month/year filters, just status=all
            const res = await paymentAPI.getList({ status: 'all' });
            setStudents(res.data.data || []);
        } catch (err) {
            console.error('Error fetching all students:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusChip = (status) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('paid')) return <Chip label="Paid" color="success" size="small" sx={{ fontWeight: 700 }} />;
        if (s.includes('partial')) return <Chip label="Partial" color="warning" size="small" sx={{ fontWeight: 700 }} />;
        return <Chip label="Pending" color="error" size="small" sx={{ fontWeight: 700 }} />;
    };

    return (
        <Box>
            {/* Header / Search */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    📋 All Students Payment Data
                </Typography>
                <TextField
                    placeholder="Search by Name..."
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
                    }}
                    sx={{ width: 300 }}
                />
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee', borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Course</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Duration</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Total Fees</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Paid Amount</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Pending Amount</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Payment Method</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Date & Time</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
                        ) : filteredStudents.length === 0 ? (
                            <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}>No student records found.</TableCell></TableRow>
                        ) : filteredStudents.map((row) => (
                            <TableRow key={row._id} hover>
                                <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                                <TableCell>{row.course}</TableCell>
                                <TableCell>{row.duration}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>₹ {(row.totalFees || row.total)?.toLocaleString()}</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>₹ {(row.paidAmount || row.paid)?.toLocaleString()}</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'error.main' }}>₹ {(row.pendingAmount || row.remaining)?.toLocaleString()}</TableCell>
                                <TableCell>{getStatusChip(row.status || (row.pendingAmount > 0 ? 'Partial' : 'Paid'))}</TableCell>
                                <TableCell sx={{ textTransform: 'capitalize' }}>{row.method}</TableCell>
                                <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                                    {row.date && !row.date.includes('T') ? row.date : (row.date ? new Date(row.date).toLocaleString('en-IN', {
                                        day: '2-digit', month: 'short', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit', hour12: true
                                    }) : 'N/A')}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

function PaymentReports() {
    const [filters, setFilters] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        startDate: '',
        endDate: '',
        userId: '',
        status: 'all'
    });
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        // Initial fetch for summary cards
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const [reportRes, listRes] = await Promise.all([
                paymentAPI.getReport(filters),
                paymentAPI.getList(filters)
            ]);

            // Combine summary from report and records from list
            setReport({
                ...reportRes.data.data,
                transactions: listRes.data.data
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const res = await paymentAPI.downloadReport(filters);
            const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Payment_Report_${new Date().toLocaleDateString()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert('Failed to download report');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <Box>
            <Typography variant="h6" fontWeight={800} color="primary.main" mb={3}>
                📊 Payment Reports & Analytics
            </Typography>

            {/* Filters Section */}
            <Paper sx={{ p: 3, mb: 4, borderRadius: 3, bgcolor: 'rgba(0,0,0,0.01)' }}>
                <Grid container spacing={2} alignItems="flex-end">
                    <Grid item xs={12} sm={6} md={2}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">MONTH</Typography>
                        <TextField
                            select fullWidth size="small"
                            value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value, startDate: '', endDate: '' })}
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <MenuItem key={i + 1} value={i + 1}>{new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(2000, i))}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={1.5}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">YEAR</Typography>
                        <TextField
                            select fullWidth size="small"
                            value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value, startDate: '', endDate: '' })}
                        >
                            {[2024, 2025, 2026].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">START DATE</Typography>
                        <TextField
                            type="date" fullWidth size="small" InputLabelProps={{ shrink: true }}
                            value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value, month: '', year: '' })}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">END DATE</Typography>
                        <TextField
                            type="date" fullWidth size="small" InputLabelProps={{ shrink: true }}
                            value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value, month: '', year: '' })}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={1.5}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">STATUS</Typography>
                        <TextField
                            select fullWidth size="small"
                            value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}
                        >
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="paid">Paid</MenuItem>
                            <MenuItem value="partial">Partial</MenuItem>
                            <MenuItem value="pending">Pending</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={1.5}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">USER ID (OPTIONAL)</Typography>
                        <TextField
                            fullWidth size="small" placeholder="65fb..."
                            value={filters.userId} onChange={e => setFilters({ ...filters, userId: e.target.value })}
                        />
                    </Grid>
                    <Grid item xs={12} md={1.5} sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="contained" fullWidth onClick={fetchReport}
                            disabled={loading} sx={{ height: 40, borderRadius: 2 }}
                        >
                            {loading ? <CircularProgress size={20} /> : 'View'}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Summary Cards */}
                {[
                    { label: 'Total Collection', value: `₹${report?.totalCollection?.toLocaleString() || 0}`, icon: <AttachMoney />, color: '#1a237e' },
                    { label: 'Total Students', value: report?.totalStudents || 0, icon: <Group />, color: '#004d40' },
                    { label: 'Paid Students', value: report?.paidStudents || 0, icon: <CheckCircle />, color: '#1b5e20' },
                    { label: 'Balance Target', value: report?.unpaidStudents || 0, icon: <PendingActions />, color: '#b71c1c' },
                ].map((stat, i) => (
                    <Grid item xs={12} sm={6} md={3} key={i}>
                        <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: 'rgba(0,0,0,0.01)' }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: stat.color, width: 44, height: 44 }}>{stat.icon}</Avatar>
                                <Box>
                                    <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">{stat.label}</Typography>
                                    <Typography variant="h5" fontWeight={900}>{loading ? <CircularProgress size={20} /> : stat.value}</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Actions & Table */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight={800}>
                    📄 Report Details {report?.transactions ? `(${report.transactions.length} records)` : '(0 records)'}
                </Typography>
                <Button
                    variant="outlined" size="small" onClick={handleDownload}
                    disabled={downloading} startIcon={<FileDownload />}
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                    {downloading ? 'Preparing...' : 'Download Excel'}
                </Button>
            </Box>

            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                <Table size="small">
                    <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Course</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Duration</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Total</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Paid</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Remaining</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Method</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Date & Time</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
                        ) : !report || !Array.isArray(report.transactions) || report.transactions.length === 0 ? (
                            <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}>No records found for the selected filters.</TableCell></TableRow>
                        ) : report.transactions.map((row) => (
                            <TableRow key={row._id} hover>
                                <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                                <TableCell>{row.course}</TableCell>
                                <TableCell>{row.duration}</TableCell>
                                <TableCell>₹ {(row.totalFees || row.total)?.toLocaleString() || 0}</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>₹ {(row.paidAmount || row.paid)?.toLocaleString() || 0}</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'error.main' }}>₹ {(row.pendingAmount || row.remaining)?.toLocaleString() || 0}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{row.status}</TableCell>
                                <TableCell sx={{ textTransform: 'capitalize' }}>{row.method}</TableCell>
                                <TableCell>
                                    {row.date && !row.date.includes('T') ? row.date : (row.date ? new Date(row.date).toLocaleString('en-IN', {
                                        day: '2-digit', month: 'short', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit', hour12: true
                                    }) : 'N/A')}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Module: Certificates
// ═══════════════════════════════════════════════════════════════════════════
function CertificateManagementPanel() {
    const [subActive, setSubActive] = useState('dashboard');
    const [stats, setStats] = useState({ totalRequests: 0, pendingRequests: 0, completedCertificates: 0 });
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [form, setForm] = useState({ courseName: '', content: '', duration: '' });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const menu = [
        { id: 'dashboard', label: 'Dashboard', icon: <Dashboard fontSize="small" /> },
        { id: 'pending', label: 'Pending Requests', icon: <PendingActions fontSize="small" /> },
        { id: 'completed', label: 'Completed Certificates', icon: <VerifiedUser fontSize="small" /> },
    ];

    useEffect(() => {
        setLoading(true);
        if (subActive === 'dashboard') {
            certificateAPI.getDashboard()
                .then(res => setStats(res.data.data || { totalRequests: 0, pendingRequests: 0, completedCertificates: 0 }))
                .catch(err => setMsg({ type: 'error', text: 'Failed to load dashboard' }))
                .finally(() => setLoading(false));
        } else if (subActive === 'pending') {
            certificateAPI.getRequests({ status: 'Pending' })
                .then(res => setRequests(res.data.data || []))
                .catch(err => setMsg({ type: 'error', text: 'Failed to load pending requests' }))
                .finally(() => setLoading(false));
        } else if (subActive === 'completed') {
            certificateAPI.getAllCertificates()
                .then(res => setRequests(res.data.data || []))
                .catch(err => setMsg({ type: 'error', text: 'Failed to load completed certificates' }))
                .finally(() => setLoading(false));
        }
    }, [subActive, refreshTrigger]);

    const getFileUrl = (url) => {
        if (!url) return '#';
        if (url.startsWith('http')) return url;
        const base = STUDENT_API_URL.replace('/api', '');
        return `${base}/${url.startsWith('/') ? url.slice(1) : url}`;
    };

    // Format date string safely
    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const handleOpenModal = (req) => {
        setSelectedRequest(req);
        // Auto-fill from userId object if available, otherwise fallback to top-level or empty
        setForm({
            courseName: req.userId?.courseName || req.courseName || '',
            content: '',
            duration: req.userId?.courseDuration || req.duration || ''
        });
        setModalOpen(true);
    };

    const handleGenerate = async () => {
        if (!form.courseName || !form.content || !form.duration) {
            setMsg({ type: 'error', text: 'Please fill all fields' });
            return;
        }
        if (!window.confirm('Are you sure you want to generate this certificate?')) return;

        setSaving(true);
        try {
            await certificateAPI.generate({
                requestId: selectedRequest._id,
                courseName: form.courseName,
                content: form.content,
                duration: form.duration
            });
            setMsg({ type: 'success', text: 'Certificate Generated Successfully!' });
            setModalOpen(false);
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to generate certificate' });
        } finally {
            setSaving(false);
        }
    };

    const handleDownload = async (row) => {
        console.log('handleDownload row:', JSON.stringify(row, null, 2));
        const certId = row._id;

        try {
            setMsg({ type: 'info', text: 'Starting download...' });

            const res = await certificateAPI.download(certId);

            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Certificate_${row.certificateNumber || certId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            setMsg({ type: 'success', text: 'Certificate downloaded successfully!' });
        } catch (err) {
            console.error('Download error:', err);
            let errorMessage = 'Failed to download certificate';

            // If error is a blob, try to read it as text to get the JSON error message
            if (err.response?.data instanceof Blob) {
                const text = await err.response.data.text();
                try {
                    const json = JSON.parse(text);
                    errorMessage = json.message || errorMessage;
                } catch { }
            } else {
                errorMessage = err.response?.data?.message || errorMessage;
            }

            setMsg({ type: 'error', text: errorMessage });
        }
    };

    const handleView = async (row) => {
        console.log('handleView row:', JSON.stringify(row, null, 2));
        const certId = row._id;

        try {
            setMsg({ type: 'info', text: 'Opening preview...' });

            const res = await certificateAPI.view(certId);

            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            setMsg({ type: 'success', text: 'Preview opened in new tab' });
        } catch (err) {
            console.error('Preview error:', err);
            let errorMessage = 'Failed to open preview';
            if (err.response?.data instanceof Blob) {
                const text = await err.response.data.text();
                try {
                    const json = JSON.parse(text);
                    errorMessage = json.message || errorMessage;
                } catch { }
            } else {
                errorMessage = err.response?.data?.message || errorMessage;
            }
            setMsg({ type: 'error', text: errorMessage });
        }
    };

    const filteredRequests = requests.filter(r => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        if (subActive === 'completed') {
            return (
                r.userId?.name?.toLowerCase().includes(search) ||
                r.userId?.email?.toLowerCase().includes(search) ||
                r.certificateNumber?.toLowerCase().includes(search) ||
                r.courseName?.toLowerCase().includes(search)
            );
        }
        return (
            r.studentName?.toLowerCase().includes(search) ||
            r.studentEmail?.toLowerCase().includes(search) ||
            r.courseName?.toLowerCase().includes(search)
        );
    });

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight={800} color="primary.main" mb={3} display="flex" alignItems="center" gap={1}>
                <VerifiedUser /> Certificate Management
            </Typography>

            <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
                {menu.map(m => (
                    <Button
                        key={m.id}
                        size="small"
                        variant={subActive === m.id ? 'contained' : 'outlined'}
                        startIcon={m.icon}
                        onClick={() => { setSubActive(m.id); setMsg({ type: '', text: '' }); setSearchTerm(''); }}
                        sx={{ borderRadius: 2, textTransform: 'none', px: 2 }}
                    >
                        {m.label}
                    </Button>
                ))}
            </Box>

            <Divider sx={{ mb: 3 }} />

            {msg.text && (
                <Alert severity={msg.type} sx={{ mb: 3 }} onClose={() => setMsg({ type: '', text: '' })}>
                    {msg.text}
                </Alert>
            )}

            {subActive === 'dashboard' && (
                <Grid container spacing={3}>
                    {[
                        { label: 'Total Requests', value: stats.totalRequests, icon: <Assignment />, color: '#1976d2', bg: 'linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)' },
                        { label: 'Pending Requests', value: stats.pendingRequests, icon: <PendingActions />, color: '#ed6c02', bg: 'linear-gradient(135deg, #ed6c02 0%, #ffb74d 100%)' },
                        { label: 'Completed Certificates', value: stats.completedCertificates, icon: <VerifiedUser />, color: '#2e7d32', bg: 'linear-gradient(135deg, #2e7d32 0%, #81c784 100%)' },
                    ].map((card, i) => (
                        <Grid item xs={12} sm={4} key={i}>
                            <Card sx={{
                                borderRadius: 4,
                                
                            
                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                transition: 'transform 0.3s ease',
                                '&:hover': { transform: 'translateY(-5px)' }
                            }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, py: 3 }}>
                                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                                        {card.icon}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="overline" sx={{ opacity: 0.8, fontWeight: 700, letterSpacing: 1.2 }}>{card.label}</Typography>
                                        <Typography variant="h3" fontWeight={900}>
                                            {loading ? <CircularProgress size={28} color="inherit" /> : card.value}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {(subActive === 'pending' || subActive === 'completed') && (
                <>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <TextField
                            size="small"
                            placeholder="Search by student name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            sx={{ width: 300 }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
                            }}
                        />
                        <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={() => setRefreshTrigger(prev => prev + 1)}>
                            Refresh
                        </Button>
                    </Box>

                    <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800 }}>Student Name</TableCell>
                                    {subActive === 'pending' && <TableCell sx={{ fontWeight: 800 }}>Course</TableCell>}
                                    {subActive === 'completed' && <TableCell sx={{ fontWeight: 800 }}>Course Name</TableCell>}
                                    {subActive === 'completed' && <TableCell sx={{ fontWeight: 800 }}>Certificate Number</TableCell>}
                                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>{subActive === 'pending' ? 'Requested Date' : 'Issued Date'}</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }} align="center">Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
                                ) : filteredRequests.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>No requests found.</TableCell></TableRow>
                                ) : filteredRequests.map((row) => (
                                    <TableRow key={row._id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                {subActive === 'completed' ? row.userId?.name : row.studentName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {subActive === 'completed' ? row.userId?.email : row.studentEmail}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{row.courseName}</TableCell>
                                        {subActive === 'completed' && <TableCell sx={{ fontWeight: 600 }}>{row.certificateNumber || '—'}</TableCell>}
                                        <TableCell>
                                            <Chip
                                                label={subActive === 'completed' ? 'Issued' : row.status}
                                                size="small"
                                                color={subActive === 'completed' || row.status === 'Completed' ? 'success' : 'warning'}
                                                sx={{ fontWeight: 700 }}
                                            />
                                        </TableCell>
                                        <TableCell>{formatDate(subActive === 'completed' ? row.issuedAt : (subActive === 'pending' ? row.createdAt : row.issuedDate))}</TableCell>
                                        <TableCell align="center">
                                            {subActive === 'pending' ? (
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="primary"
                                                    onClick={() => handleOpenModal(row)}
                                                >
                                                    Generate
                                                </Button>
                                            ) : (
                                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="primary"
                                                        startIcon={<Visibility />}
                                                        onClick={() => handleView(row)}
                                                    >
                                                        View
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<FileDownload />}
                                                        onClick={() => handleDownload(row)}
                                                    >
                                                        Download
                                                    </Button>
                                                </Box>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}

            {/* Generate Certificate Modal */}
            <Dialog open={modalOpen} onClose={() => !saving && setModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VerifiedUser /> Generate Certificate
                </DialogTitle>
                <DialogContent dividers>
                    {msg.text && msg.type === 'error' && (
                        <Alert severity="error" sx={{ mb: 2 }}>{msg.text}</Alert>
                    )}
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" fontWeight={700} mb={0.5}>Student Name:</Typography>
                            <TextField
                                fullWidth size="small"
                                value={selectedRequest?.studentName || ''}
                                InputProps={{ readOnly: true }}
                                sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" fontWeight={700} mb={0.5}>Course Name:</Typography>
                            <TextField
                                fullWidth size="small"
                                value={form.courseName}
                                onChange={(e) => setForm({ ...form, courseName: e.target.value })}
                                placeholder="E.g. Full Stack Web Development"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" fontWeight={700} mb={0.5}>Duration:</Typography>
                            <TextField
                                fullWidth size="small"
                                value={form.duration}
                                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                                placeholder="E.g. 6 Months"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" fontWeight={700} mb={0.5}>Content / Description:</Typography>
                            <TextField
                                fullWidth size="small"
                                multiline rows={3}
                                value={form.content}
                                onChange={(e) => setForm({ ...form, content: e.target.value })}
                                placeholder="Enter the certificate content or achievement description..."
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.01)' }}>
                    <Button onClick={() => setModalOpen(false)} disabled={saving} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        variant="contained"
                        disabled={saving}
                        startIcon={saving && <CircularProgress size={16} color="inherit" />}
                    >
                        {saving ? 'Generating...' : 'Generate Certificate'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

