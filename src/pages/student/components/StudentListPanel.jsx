import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, CircularProgress, Avatar,
    Chip, IconButton, Button, TextField, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Tooltip, InputAdornment
} from '@mui/material';
import { Refresh, Search, Delete } from '@mui/icons-material';
import { adminStudentAPI } from '../../../services/studentPortalAPI';

export default function StudentListPanel() {
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

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this student?')) return;
        try {
            setLoading(true);
            await adminStudentAPI.deleteStudent(id);
            fetch();
        } catch { }
        finally { setLoading(false); }
    };

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
                                <TableCell align="right"><b>Actions</b></TableCell>
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
                                        <TableCell align="right">
                                            <Tooltip title="Delete Student">
                                                <IconButton size="small" color="error" onClick={() => handleDelete(s._id)} disabled={loading}>
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
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
