import React, { useState, useEffect } from 'react';
import {
    Box, Grid, Typography, Paper, CircularProgress, Alert,
    Divider, TextField, MenuItem, Button, Card, CardContent,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, Avatar, IconButton, Tooltip, Dialog, DialogTitle,
    DialogContent, DialogActions, FormControl, InputLabel, Select
} from '@mui/material';
import {
    Dashboard, PendingActions, VerifiedUser, AddCircleOutline,
    Search, FileDownload, Visibility, CheckCircle, Verified
} from '@mui/icons-material';
import { certificateAPI, adminStudentAPI, STUDENT_API_URL } from '../../../services/studentPortalAPI';

export default function CertificateManagementPanel() {
    const [subActive, setSubActive] = useState('dashboard');
    const [stats, setStats] = useState({ totalRequests: 0, pendingRequests: 0, completedCertificates: 0 });
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [form, setForm] = useState({ courseName: '', content: '' });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [allStudents, setAllStudents] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');

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
                .catch(() => setMsg({ type: 'error', text: 'Failed to load dashboard' }))
                .finally(() => setLoading(false));
        } else if (subActive === 'pending') {
            certificateAPI.getRequests({ status: 'Pending' })
                .then(res => setRequests(res.data.data || []))
                .catch(() => setMsg({ type: 'error', text: 'Failed to load pending requests' }))
                .finally(() => setLoading(false));
        } else if (subActive === 'completed') {
            certificateAPI.getAllCertificates()
                .then(res => setRequests(res.data.data || []))
                .catch(() => setMsg({ type: 'error', text: 'Failed to load completed certificates' }))
                .finally(() => setLoading(false));
        }
        
        adminStudentAPI.getAllStudents()
            .then(res => setAllStudents((res.data?.data || []).filter(s => s.isApproved)))
            .catch(err => console.error("Failed to load students", err));
    }, [subActive, refreshTrigger]);

    useEffect(() => {
        if (!selectedRequest && selectedUserId) {
            const localStudent = allStudents.find(s => s._id === selectedUserId);
            if (localStudent && localStudent.courseName) {
                setForm(prev => ({ ...prev, courseName: localStudent.courseName }));
            }
            certificateAPI.getStudentDetails(selectedUserId)
                .then(res => {
                    const data = res.data.data;
                    if (data.courseName) setForm(prev => ({ ...prev, courseName: data.courseName }));
                })
                .catch(err => console.error('Failed to fetch student details', err));
        }
    }, [selectedUserId, allStudents, selectedRequest]);

    const handleOpenModal = (req = null) => {
        setSelectedRequest(req);
        if (req) {
            let uid = req.userId?._id || req.userId || '';
            if (!uid && req.studentName) {
                const found = allStudents.find(s => s.name?.toLowerCase() === req.studentName.toLowerCase());
                if (found) uid = found._id;
            }
            setSelectedUserId(uid);
            const localStudent = uid ? allStudents.find(s => s._id === uid) : null;
            const course = req.courseName || req.userId?.courseName || localStudent?.courseName || '';
            setForm({ courseName: course, content: '' });
        } else {
            setSelectedUserId('');
            setForm({ courseName: '', content: '' });
        }
        setModalOpen(true);
    };

    const handleGenerate = async () => {
        if (!form.courseName || !form.content) {
            setMsg({ type: 'error', text: 'Please fill all fields' });
            return;
        }
        if (!window.confirm('Are you sure you want to generate this certificate?')) return;

        setSaving(true);
        try {
            await certificateAPI.generate({
                requestId: selectedRequest?._id,
                userId: selectedUserId,
                ...form
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
        try {
            setMsg({ type: 'info', text: 'Starting download...' });
            const res = await certificateAPI.download(row._id);
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Certificate_${row.certificateNumber || row._id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            setMsg({ type: 'success', text: 'Certificate downloaded successfully!' });
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to download certificate' });
        }
    };

    const handleView = async (row) => {
        try {
            setMsg({ type: 'info', text: 'Opening preview...' });
            const res = await certificateAPI.view(row._id);
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
            setMsg({ type: 'success', text: 'Preview opened in new tab' });
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to open preview' });
        }
    };

    const filteredRequests = requests.filter(r => 
        (r.studentName || r.userId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.certificateNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={800} color="primary.main">🎓 Certificates Management</Typography>
                <Button variant="contained" startIcon={<AddCircleOutline />} onClick={() => handleOpenModal()} sx={{ borderRadius: 2 }}>Issue Certificate</Button>
            </Box>

            <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
                {menu.map(m => (
                    <Button key={m.id} size="small" variant={subActive === m.id ? 'contained' : 'outlined'}
                        startIcon={m.icon} onClick={() => setSubActive(m.id)} sx={{ borderRadius: 2 }}>
                        {m.label}
                    </Button>
                ))}
            </Box>

            {msg.text && <Alert severity={msg.type} sx={{ mb: 3 }} onClose={() => setMsg({ type: '', text: '' })}>{msg.text}</Alert>}

            {subActive === 'dashboard' ? (
                <Grid container spacing={3}>
                    {[
                        { label: 'Total Requests', value: stats.totalRequests, icon: <Dashboard />, color: '#1976d2' },
                        { label: 'Pending', value: stats.pendingRequests, icon: <PendingActions />, color: '#ed6c02' },
                        { label: 'Completed', value: stats.completedCertificates, icon: <VerifiedUser />, color: '#2e7d32' }
                    ].map((s, i) => (
                        <Grid item xs={12} sm={4} key={i}>
                            <Card sx={{ borderRadius: 3 }}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Avatar sx={{ bgcolor: s.color, mx: 'auto', mb: 2 }}>{s.icon}</Avatar>
                                    <Typography variant="h4" fontWeight={900}>{s.value}</Typography>
                                    <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>{s.label}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Box>
                    <TextField placeholder="Search by student or cert number..." fullWidth size="small" sx={{ mb: 3 }}
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        InputProps={{ startAdornment: <Search fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }} />
                    
                    <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: 'grey.50' }}>
                                <TableRow>
                                    <TableCell><b>Student</b></TableCell>
                                    <TableCell><b>Course</b></TableCell>
                                    <TableCell><b>{subActive === 'pending' ? 'Request Date' : 'Issue Date'}</b></TableCell>
                                    <TableCell><b>Status</b></TableCell>
                                    <TableCell align="right"><b>Actions</b></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow> :
                                    filteredRequests.length === 0 ? <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>No records found.</TableCell></TableRow> :
                                    filteredRequests.map(row => (
                                        <TableRow key={row._id} hover>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem' }}>{(row.studentName || row.userId?.name || 'U')[0]}</Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600}>{row.studentName || row.userId?.name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{row.certificateNumber || row.userId?.studentId}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>{row.courseName}</TableCell>
                                            <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Chip label={row.status} size="small" color={row.status === 'Completed' ? 'success' : 'warning'} />
                                            </TableCell>
                                            <TableCell align="right">
                                                {row.status === 'Pending' ? (
                                                    <Button size="small" startIcon={<Verified />} onClick={() => handleOpenModal(row)}>Issue</Button>
                                                ) : (
                                                    <Box>
                                                        <IconButton size="small" color="primary" onClick={() => handleView(row)}><Visibility fontSize="small" /></IconButton>
                                                        <IconButton size="small" color="success" onClick={() => handleDownload(row)}><FileDownload fontSize="small" /></IconButton>
                                                    </Box>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                }
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{selectedRequest ? 'Generate Certificate' : 'Issue Manual Certificate'}</DialogTitle>
                <DialogContent dividers>
                    {!selectedRequest && (
                        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                            <InputLabel>Select Student</InputLabel>
                            <Select value={selectedUserId} label="Select Student" onChange={e => setSelectedUserId(e.target.value)}>
                                {allStudents.map(s => <MenuItem key={s._id} value={s._id}>{s.name} ({s.studentId})</MenuItem>)}
                            </Select>
                        </FormControl>
                    )}
                    <TextField label="Course Name" fullWidth size="small" sx={{ mb: 2 }} value={form.courseName} onChange={e => setForm({ ...form, courseName: e.target.value })} />
                    <TextField label="Certificate Content / Accomplishment" multiline rows={4} fullWidth size="small" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="e.g. Has successfully completed the 6-months advanced web development course..." />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setModalOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleGenerate} disabled={saving}>{saving ? 'Generating...' : 'Generate Certificate'}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
