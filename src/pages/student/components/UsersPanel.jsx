import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, CircularProgress, Alert, Avatar,
    Chip, IconButton, Button, TextField, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Tooltip, InputAdornment
} from '@mui/material';
import {
    Refresh, Search, FilterList, ThumbUp, ThumbDown, CheckCircle, Delete
} from '@mui/icons-material';
import { adminStudentAPI } from '../../../services/studentPortalAPI';

export default function UsersPanel() {
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

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to permanently delete this user?')) return;
        try {
            setSaving(true);
            await adminStudentAPI.deleteStudent(id);
            setSuccess('User deleted successfully.');
            fetch();
        } catch {
            setError('Failed to delete user.');
        } finally {
            setSaving(false);
        }
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
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Chip label="Verified" size="small" color="info" variant="outlined" icon={<CheckCircle fontSize="small" />} />
                                                    <Tooltip title="Delete Permanently">
                                                        <IconButton size="small" color="error" disabled={saving} onClick={() => handleDelete(s._id)}>
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
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
