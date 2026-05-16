import React, { useState, useEffect } from 'react';
import {
    Box, Grid, Typography, Paper, CircularProgress, Alert, Avatar,
    Chip, IconButton, Button, TextField, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Divider,
    Tooltip, Card, CardContent, InputAdornment, Dialog, DialogTitle,
    DialogContent, DialogActions, LinearProgress
} from '@mui/material';
import {
    EventAvailable, CheckCircle, Cancel, EmojiEvents, Assessment,
    Search, Refresh, Notifications, Visibility
} from '@mui/icons-material';
import { dashboardAPI, adminStudentAPI, courseAPI, attendanceAPI } from '../../../services/studentPortalAPI';

const ATT_STATUS_COLORS = { Present: 'success', Absent: 'error', Holiday: 'warning', Late: 'info', Leave: 'default' };
const ATT_STATUSES = ['Present', 'Absent', 'Holiday'];
const todayStr = () => new Date().toISOString().slice(0, 10);

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

export default function AttendanceControlPanel({ onRefresh }) {
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
                                    "&.Mui-disabled": {
                                        color: "rgba(255, 255, 255, 0.7)",
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
                                value={listUserId} onChange={e => setListUserId(e.target.value)}>
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
                                    '&:hover': { bgcolor: '#333' }
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
