import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Grid, CircularProgress, Alert,
    Button, Card, CardContent
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { taskAPI } from '../../../services/studentPortalAPI';

export default function TasksPanel() {
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
