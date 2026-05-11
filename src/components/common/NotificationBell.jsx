import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconButton,
    Badge,
    Popover,
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    Divider,
    Chip,
    Tooltip
} from '@mui/material';
import { Notifications, NotificationsNone, Campaign, Feedback, Close, BadgeOutlined, Article, EventBusy } from '@mui/icons-material';
import axios from 'axios';

const API = '/api';
const STORAGE_KEY = 'notif_last_seen';
const DISMISSED_KEY = 'notif_dismissed';

const NotificationBell = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [dismissed, setDismissed] = useState(() => {
        try {
            return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]'));
        } catch {
            return new Set();
        }
    });
    const navigate = useNavigate();

    const fetchAll = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch announcements, feedback, and HR notifications in parallel
            const [annoRes, feedRes, hrNotifRes] = await Promise.allSettled([
                axios.get(`${API}/announcements?limit=15`, { headers }),
                axios.get(`${API}/feedback?limit=15`, { headers }),
                axios.get(`${API}/hr/notifications?limit=15`, { headers }),
            ]);

            const announcements = (
                annoRes.status === 'fulfilled'
                    ? (annoRes.value.data?.announcements || annoRes.value.data || [])
                    : []
            ).map(a => ({
                _id: a._id,
                type: 'announcement',
                title: a.title || 'Announcement',
                body: a.content || a.description || '',
                author: a.postedBy?.username || a.postedBy?.email || 'HR',
                createdAt: a.createdAt,
                navPath: '/announcements',
            }));

            const feedbacks = (
                feedRes.status === 'fulfilled'
                    ? (feedRes.value.data || [])
                    : []
            ).map(f => ({
                _id: f._id,
                type: 'feedback',
                title: f.subject || 'New Feedback',
                body: f.message || '',
                author: f.submittedBy?.username || f.submittedBy?.email || 'Employee',
                createdAt: f.createdAt,
                navPath: '/feedback',
            }));

            const hrNotifications = (
                hrNotifRes.status === 'fulfilled'
                    ? (hrNotifRes.value.data || [])
                    : []
            ).map(n => ({
                _id: n._id,
                type: (n.type || 'general').toLowerCase(),
                title: n.title || 'System Alert',
                body: n.message || '',
                author: 'System',
                createdAt: n.createdAt || new Date().toISOString(),
                navPath: n.actionUrl || null,
                priority: n.priority || 'Medium'
            }));

            // Merge and sort newest first
            const merged = [...announcements, ...feedbacks, ...hrNotifications].sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );

            // Check for new notifications to play sound
            const lastFetchedCount = notifications.length;
            if (lastFetchedCount > 0 && merged.length > lastFetchedCount) {
                // Check if the newest notification is actually new (not just a re-fetch)
                const isNew = !notifications.some(existing => existing._id === merged[0]._id);
                if (isNew) {
                    playNotificationSound();
                }
            }

            setNotifications(merged);

            const lastSeen = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
            const dismissedSet = new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]'));
            const unread = merged.filter(
                n => new Date(n.createdAt).getTime() > lastSeen && !dismissedSet.has(n._id)
            ).length;
            setUnreadCount(unread);
        } catch (err) {
            // Non-critical — silent fail
        }
    };

    const playNotificationSound = () => {
        try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
            audio.play().catch(e => console.log('Audio play blocked by browser'));
        } catch (e) {
            console.error('Failed to play sound:', e);
        }
    };

    useEffect(() => {
        fetchAll();
        const interval = setInterval(fetchAll, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, [notifications.length]); // Re-run if length changes to help sound logic

    const handleOpen = (e) => {
        setAnchorEl(e.currentTarget);
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
        setUnreadCount(0);
    };

    const handleClose = () => setAnchorEl(null);

    const handleNotificationClick = (notif) => {
        handleClose();
        if (notif.navPath) {
            // Append the item id as a hash so the target page can auto-scroll to it
            const rawId = notif._id?.toString().replace(/^email-/, '');
            navigate(`${notif.navPath}${notif.navPath.includes('#') ? '' : '#' + rawId}`);
        }
    };

    const handleDismiss = (e, notifId) => {
        e.stopPropagation();
        const next = new Set(dismissed);
        next.add(notifId);
        setDismissed(next);
        localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next]));
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const diff = Date.now() - d.getTime();
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    };

    const visibleNotifications = notifications.filter(n => !dismissed.has(n._id));
    const annoCount = visibleNotifications.filter(n => n.type === 'announcement').length;
    const feedCount = visibleNotifications.filter(n => n.type === 'feedback').length;
    const hrCount = visibleNotifications.length - annoCount - feedCount;

    const getTypeIcon = (type) => {
        if (type === 'announcement') return <Campaign sx={{ fontSize: 14, color: 'primary.main' }} />;
        if (type === 'feedback') return <Feedback sx={{ fontSize: 14, color: 'warning.main' }} />;
        if (type === 'studentregistration') return <BadgeOutlined sx={{ fontSize: 14, color: 'success.main' }} />;
        if (type === 'certificaterequest') return <Article sx={{ fontSize: 14, color: 'info.main' }} />;
        if (type === 'leaverequest') return <EventBusy sx={{ fontSize: 14, color: 'error.main' }} />;
        return <Notifications sx={{ fontSize: 14, color: 'primary.main' }} />;
    };

    const getTypeColor = (type) => {
        if (type === 'announcement') return 'primary';
        if (type === 'feedback') return 'warning';
        if (type === 'studentregistration') return 'success';
        if (type === 'certificaterequest') return 'info';
        if (type === 'leaverequest') return 'error';
        return 'primary';
    };

    const getBorderColor = (type) => {
        if (type === 'announcement') return 'primary.main';
        if (type === 'feedback') return 'warning.main';
        if (type === 'studentregistration') return 'success.main';
        if (type === 'certificaterequest') return 'info.main';
        if (type === 'leaverequest') return 'error.main';
        return 'primary.main';
    };

    return (
        <>
            <IconButton
                onClick={handleOpen}
                sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                title="Notifications"
            >
                <Badge badgeContent={unreadCount} color="error" max={99}>
                    {unreadCount > 0 ? <Notifications /> : <NotificationsNone />}
                </Badge>
            </IconButton>

            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                    sx: {
                        width: 400,
                        maxHeight: 520,
                        borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                    }
                }}
            >
                {/* Header */}
                <Box sx={{
                    p: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        🔔 Notifications
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Chip
                            icon={<Campaign sx={{ color: 'white !important', fontSize: 14 }} />}
                            label={annoCount}
                            size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '& .MuiChip-label': { px: 0.5 } }}
                            title="Announcements"
                        />
                        <Chip
                            icon={<Feedback sx={{ color: 'white !important', fontSize: 14 }} />}
                            label={feedCount}
                            size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '& .MuiChip-label': { px: 0.5 } }}
                            title="Feedback"
                        />
                        <Chip
                            icon={<Notifications sx={{ color: 'white !important', fontSize: 14 }} />}
                            label={hrCount}
                            size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '& .MuiChip-label': { px: 0.5 } }}
                            title="System Alerts"
                        />
                    </Box>
                    <IconButton size="small" onClick={fetchAll} sx={{ color: 'white', ml: 1 }}>
                        <NotificationsNone sx={{ fontSize: 18 }} />
                    </IconButton>
                </Box>

                {/* Notification List */}
                <Box sx={{ overflowY: 'auto', flex: 1 }}>
                    {visibleNotifications.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 5 }}>
                            <NotificationsNone sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                                No notifications yet
                            </Typography>
                        </Box>
                    ) : (
                        <List dense disablePadding>
                            {visibleNotifications.map((n, i) => (
                                <React.Fragment key={`${n.type}-${n._id || i}`}>
                                    <ListItem
                                        alignItems="flex-start"
                                        onClick={() => handleNotificationClick(n)}
                                        sx={{
                                            py: 1.5, px: 2,
                                            cursor: 'pointer',
                                            borderLeft: '3px solid',
                                            borderLeftColor: getBorderColor(n.type),
                                            '&:hover': { bgcolor: 'action.hover' },
                                            pr: 5, // make room for close button
                                            position: 'relative',
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                                                    {getTypeIcon(n.type)}
                                                    <Chip
                                                        label={n.type === 'announcement' ? 'Announcement' : n.type === 'feedback' ? 'Feedback' : 'Email'}
                                                        size="small"
                                                        color={getTypeColor(n.type)}
                                                        sx={{ height: 18, fontSize: '0.65rem' }}
                                                    />
                                                    <Typography
                                                        component="span"
                                                        variant="subtitle2"
                                                        fontWeight={600}
                                                        noWrap
                                                        sx={{ flex: 1 }}
                                                    >
                                                        {n.title}
                                                    </Typography>
                                                </Box>
                                            }
                                            secondaryTypographyProps={{ component: 'span' }}
                                            secondary={
                                                <>
                                                    <Typography
                                                        component="span"
                                                        display="block"
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                            mb: 0.25,
                                                        }}
                                                    >
                                                        {n.body}
                                                    </Typography>
                                                    <Typography component="span" display="block" variant="caption" color="text.disabled">
                                                        {n.author} · {formatTime(n.createdAt)}
                                                    </Typography>
                                                </>
                                            }
                                        />
                                        {/* Close/dismiss button */}
                                        <Tooltip title="Dismiss">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => handleDismiss(e, n._id)}
                                                sx={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    right: 4,
                                                    opacity: 0.5,
                                                    '&:hover': { opacity: 1, bgcolor: 'error.light', color: 'white' },
                                                    p: 0.25,
                                                }}
                                            >
                                                <Close sx={{ fontSize: 14 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </ListItem>
                                    {i < visibleNotifications.length - 1 && <Divider component="li" />}
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </Box>
            </Popover>
        </>
    );
};

export default NotificationBell;
