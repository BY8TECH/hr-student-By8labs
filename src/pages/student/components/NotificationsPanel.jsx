import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, CircularProgress, Alert,
    Button, List, ListItem, ListItemText, Divider
} from '@mui/material';
import { Refresh, Notifications } from '@mui/icons-material';
import { notificationAPI } from '../../../services/studentPortalAPI';

export default function NotificationsPanel() {
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

    const handleClearAll = async () => {
        if (!window.confirm('Are you sure you want to clear all notifications?')) return;
        setLoading(true);
        try {
            await notificationAPI.clearAllNotifications();
            setNotifs([]);
        } catch (err) {
            setError('Failed to clear notifications.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && notifs.length === 0) return <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>;

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={700}>🔔 Notifications</Typography>
                <Box>
                    <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={fetchNotifications} sx={{ mr: 1 }}>Refresh</Button>
                    <Button variant="text" size="small" color="error" onClick={handleClearAll} disabled={notifs.length === 0}>Clear All</Button>
                </Box>
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {notifs.length === 0
                ? <Typography color="text.secondary">No notifications.</Typography>
                : (
                    <Paper elevation={1}>
                        <List>
                            {notifs.map((n, i) => (
                                <React.Fragment key={n._id || i}>
                                    <ListItem alignItems="flex-start">
                                        <ListItemText
                                            primary={n.title}
                                            secondary={
                                                <>
                                                    <Typography component="span" variant="body2" color="text.primary">
                                                        {n.message}
                                                    </Typography>
                                                    {" — "}{new Date(n.createdAt).toLocaleString()}
                                                </>
                                            }
                                        />
                                    </ListItem>
                                    {i < notifs.length - 1 && <Divider component="li" />}
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>
                )
            }
        </Box>
    );
}
