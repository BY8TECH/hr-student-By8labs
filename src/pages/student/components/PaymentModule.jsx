import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Grid, Typography, Paper, CircularProgress, Alert,
    Divider, TextField, MenuItem, Button, Card, CardContent,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, Autocomplete, InputAdornment, IconButton, Tooltip
} from '@mui/material';
import {
    Dashboard, AddCard, ListAlt, Group, FileDownload,
    PeopleOutlined, CheckCircle, Cancel, AccountBalanceWallet,
    Payments, Search, Visibility
} from '@mui/icons-material';
import { paymentAPI, adminStudentAPI } from '../../../../services/studentPortalAPI';

// --- Sub-components ---

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
        userId: '', courseId: '', courseName: '', courseFees: '',
        paidAmount: '', remainingAmount: '', amount: '', method: 'cash', type: 'Installment 1'
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
        try {
            const res = await adminStudentAPI.getAllStudents();
            const list = res.data?.students || res.data?.data || (Array.isArray(res.data) ? res.data : []);
            if (Array.isArray(list)) setStudents(list.filter(s => s.isApproved !== false));
        } catch { setMsg({ type: 'error', text: 'Failed to fetch student list.' }); }
        finally { setLoadingStudents(false); }
    };

    const handleStudentChange = async (newValue) => {
        if (!newValue) {
            setForm(prev => ({ ...prev, userId: '', courseId: '', courseName: '', courseFees: '', paidAmount: '', remainingAmount: '' }));
            return;
        }
        setForm(prev => ({ ...prev, userId: newValue._id, courseId: '', courseName: '', courseFees: '', paidAmount: '', remainingAmount: '' }));
        setLoadingCourse(true);
        try {
            const res = await paymentAPI.getStudentCourse(newValue._id);
            const d = res.data?.data;
            setForm(prev => ({
                ...prev, courseId: d?.courseId || '', courseName: d?.courseTitle || 'N/A',
                courseFees: String(d?.fees || 0), paidAmount: String(d?.paidAmount || 0),
                remainingAmount: String(d?.remainingAmount || 0),
            }));
        } catch { setForm(prev => ({ ...prev, courseName: 'N/A', courseFees: '0', paidAmount: '0', remainingAmount: '0' })); }
        finally { setLoadingCourse(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.userId) return setMsg({ type: 'error', text: 'Please select a student' });
        setSubmitting(true);
        try {
            await paymentAPI.add({
                userId: form.userId, courseId: form.courseId || null,
                amount: form.amount, method: form.method, type: form.type
            });
            setMsg({ type: 'success', text: 'Payment recorded successfully!' });
            setTimeout(onAdded, 1500);
        } catch (err) { setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to add payment' }); }
        finally { setSubmitting(false); }
    };

    const roField = (val) => ({ fullWidth: true, size: 'small', variant: 'filled', disabled: true, value: loadingCourse ? 'Loading…' : val });
    const fmtCurrency = (v) => v !== '' ? `₹ ${Number(v).toLocaleString('en-IN')}` : '';

    return (
        <Paper sx={{ p: 4, borderRadius: 3, maxWidth: 560 }}>
            <Typography variant="h6" fontWeight={900} mb={4} display="flex" alignItems="center" gap={1}>
                <Payments color="primary" /> Manual Payment Entry
            </Typography>
            {msg.text && <Alert severity={msg.type} sx={{ mb: 3 }}>{msg.text}</Alert>}
            <form onSubmit={handleSubmit}>
                <Grid container spacing={2.5}>
                    <Grid item xs={12}>
                        <Autocomplete
                            open={open} onOpen={() => { setOpen(true); fetchStudents(); }} onClose={() => setOpen(false)}
                            options={students} getOptionLabel={(option) => `${option.name} (${option.studentId || 'No ID'})`}
                            loading={loadingStudents} onChange={(e, v) => handleStudentChange(v)}
                            renderInput={(params) => <TextField {...params} label="Select Student" size="small" />}
                        />
                    </Grid>
                    <Grid item xs={12}><TextField label="Course Name" {...roField(form.courseName)} /></Grid>
                    <Grid item xs={4}><TextField label="Total Fees" {...roField(fmtCurrency(form.courseFees))} /></Grid>
                    <Grid item xs={4}><TextField label="Paid" {...roField(fmtCurrency(form.paidAmount))} /></Grid>
                    <Grid item xs={4}><TextField label="Remaining" {...roField(fmtCurrency(form.remainingAmount))} /></Grid>
                    <Grid item xs={6}>
                        <TextField fullWidth type="number" size="small" label="Amount Paying" required
                            value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField select fullWidth size="small" label="Method" value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
                            <MenuItem value="cash">Cash</MenuItem><MenuItem value="upi">UPI</MenuItem><MenuItem value="card">Card</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12}>
                        <Button type="submit" variant="contained" fullWidth disabled={submitting || loadingCourse} sx={{ py: 1.5, fontWeight: 900 }}>
                            {submitting ? <CircularProgress size={24} /> : 'Submit Payment'}
                        </Button>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
}

function AllStudentsList() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await paymentAPI.getList({ status: 'all' });
            setStudents(res.data.data || []);
        } catch { }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const filtered = students.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={800} color="primary.main">📋 All Students Payment Data</Typography>
                <TextField placeholder="Search..." size="small" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} sx={{ width: 300 }} />
            </Box>
            <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                <Table size="small">
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                        <TableRow>
                            <TableCell><b>Name</b></TableCell><TableCell><b>Course</b></TableCell>
                            <TableCell><b>Total</b></TableCell><TableCell><b>Paid</b></TableCell>
                            <TableCell><b>Remaining</b></TableCell><TableCell><b>Status</b></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={20} /></TableCell></TableRow> :
                            filtered.map(row => (
                                <TableRow key={row._id}>
                                    <TableCell>{row.name}</TableCell><TableCell>{row.course}</TableCell>
                                    <TableCell>₹{row.totalFees?.toLocaleString()}</TableCell>
                                    <TableCell color="success.main">₹{row.paidAmount?.toLocaleString()}</TableCell>
                                    <TableCell color="error.main">₹{row.pendingAmount?.toLocaleString()}</TableCell>
                                    <TableCell>{row.status}</TableCell>
                                </TableRow>
                            ))
                        }
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

// Simplified placeholder for other sub-views
function PaymentList() { return <Box>Payment List View</Box>; }
function PaymentReports() { return <Box>Payment Reports View</Box>; }

export default function PaymentModule() {
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
            <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {menu.map(m => (
                    <Button key={m.id} size="small" variant={subActive === m.id ? 'contained' : 'outlined'}
                        startIcon={m.icon} onClick={() => setSubActive(m.id)} sx={{ borderRadius: 2, textTransform: 'none' }}>
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
