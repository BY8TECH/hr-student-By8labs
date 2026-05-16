import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, CircularProgress, Alert,
    Chip, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { enrollmentAPI } from '../../../services/studentPortalAPI';

export default function EnrollmentsPanel() {
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
