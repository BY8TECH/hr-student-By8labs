import React, { useState, useEffect } from 'react';
import {
    Box, Grid, Typography, Paper, CircularProgress, Alert, Card, CardContent
} from '@mui/material';
import {
    Dashboard, PeopleOutlined, MenuBook, EventAvailable,
    CheckCircle, Assignment, EventNote, Assessment, History, HowToReg
} from '@mui/icons-material';
import { dashboardAPI } from '../../../services/studentPortalAPI';

export default function DashboardPanel({ refreshTrigger, onTabChange }) {
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
                                            color: item.color
                                        }}>
                                            {React.cloneElement(item.icon, { sx: { fontSize: 26 } })}
                                        </Box>
                                        <Box>
                                            <Typography variant="h5" fontWeight={900} sx={{ lineHeight: 1.1, mb: 0.2 }}>
                                                {item.value ?? 0}
                                            </Typography>
                                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.5 }}>
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
