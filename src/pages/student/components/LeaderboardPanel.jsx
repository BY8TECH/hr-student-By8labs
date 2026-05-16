import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, CircularProgress, Alert, Avatar,
    Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { leaderboardAPI } from '../../../services/studentPortalAPI';

export default function LeaderboardPanel() {
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
