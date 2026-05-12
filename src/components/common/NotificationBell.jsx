import React, { useState, useEffect, useRef } from 'react';
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
import { 
    Notifications, 
    NotificationsNone, 
    Campaign, 
    Feedback, 
    Close, 
    BadgeOutlined, 
    Article, 
    EventBusy,
    EmailOutlined,
    LockOpen
} from '@mui/icons-material';
import axios from 'axios';
import { io } from 'socket.io-client';

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
    const socketRef = useRef(null);

    const playNotificationSound = () => {
        try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
            audio.play().catch(e => console.log('Audio play blocked by browser. Please interact with the page first.'));
        } catch (e) {
            console.error('Failed to play sound:', e);
        }
    };

    const fetchAll = async () => {
        try {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            if (!token) return;
            const headers = { Authorization: `Bearer ${token}` };
            const user = userStr ? JSON.parse(userStr) : null;

            // Fetch announcements, feedback, and HR notifications in parallel
            const [annoRes, feedRes, hrNotifRes] = await Promise.allSettled([
                axios.get(`${API}/hr/announcements?limit=15`, { headers }),
                axios.get(`${API}/hr/feedback?limit=15`, { headers }),
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

    useEffect(() => {
        fetchAll();
        
        // Initialize Socket.io
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (token && userStr) {
            const user = JSON.parse(userStr);
            const socket = io(window.location.origin, {
                auth: { token }
            });

            socketRef.current = socket;

            socket.on('connect', () => {
                console.log('🔗 Connected to notification socket');
                socket.emit('join', user._id);
                if (user.role === 'HR') {
                    socket.emit('joinHR');
                }
            });

            socket.on('newNotification', (notif) => {
                console.log('🔔 New real-time notification:', notif);
                playNotificationSound();
                fetchAll(); // Refresh list
                
                // If the popover is closed, increment unread count manually for instant feedback
                if (!anchorEl) {
                    setUnreadCount(prev => prev + 1);
                }
            });

            return () => {
                socket.disconnect();
            };
        }

        const interval = setInterval(fetchAll, 60000); // Keep polling as fallback
        return () => clearInterval(interval);
    }, []);

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
    const sysCount = visibleNotifications.length - annoCount - feedCount;

    const getNotificationInfo = (type) => {
        const t = type?.toUpperCase();
        
        // Default values
        let info = {
            icon: <Notifications sx={{ fontSize: 14, color: 'primary.main' }} />,
            color: 'primary',
            label: 'System',
            // source: 'Portal',
            borderColor: 'primary.main'
        };

        if (t?.startsWith('SP_')) {
            info.source = 'Student Portal';
            const subType = t.replace('SP_', '');
            if (subType === 'LEAVEREQUEST') {
                info.icon = <EventBusy sx={{ fontSize: 14, color: 'error.main' }} />;
                info.color = 'error';
                info.label = 'Leave Request';
                info.borderColor = 'error.main';
            } else if (subType === 'CERTIFICATEREQUEST') {
                info.icon = <Article sx={{ fontSize: 14, color: 'info.main' }} />;
                info.color = 'info';
                info.label = 'Certificate Request';
                info.borderColor = 'info.main';
            } else if (subType === 'REGISTRATION') {
                info.icon = <BadgeOutlined sx={{ fontSize: 14, color: 'success.main' }} />;
                info.color = 'success';
                info.label = 'Registration';
                info.borderColor = 'success.main';
            }
        } else if (t?.startsWith('HR_')) {
            info.source = 'HR Management';
            const subType = t.replace('HR_', '');
            if (subType === 'LEAVEREQUEST') {
                info.icon = <EventBusy sx={{ fontSize: 14, color: 'error.main' }} />;
                info.color = 'error';
                info.label = 'Leave Request';
                info.borderColor = 'error.main';
            } else if (subType === 'REGISTRATION') {
                info.icon = <BadgeOutlined sx={{ fontSize: 14, color: 'success.main' }} />;
                info.color = 'success';
                info.label = 'User Registration';
                info.borderColor = 'success.main';
            } else if (subType === 'FEEDBACK') {
                info.icon = <Feedback sx={{ fontSize: 14, color: 'warning.main' }} />;
                info.color = 'warning';
                info.label = 'Feedback';
                info.borderColor = 'warning.main';
            } else if (subType === 'ACCESSREQUEST') {
                info.icon = <LockOpen sx={{ fontSize: 14, color: 'warning.main' }} />;
                info.color = 'warning';
                info.label = 'Access Request';
                info.borderColor = 'warning.main';
            } else if (subType === 'EMAIL') {
                info.icon = <EmailOutlined sx={{ fontSize: 14, color: 'secondary.main' }} />;
                info.color = 'secondary';
                info.label = 'Email';
                info.borderColor = 'secondary.main';
            }
        } else {
            // Legacy/General mapping
            const low = t?.toLowerCase() || '';
            if (low === 'announcement') {
                info.icon = <Campaign sx={{ fontSize: 14, color: 'primary.main' }} />;
                info.label = 'Announcement';
            } else if (low === 'feedback') {
                info.icon = <Feedback sx={{ fontSize: 14, color: 'warning.main' }} />;
                info.color = 'warning';
                info.label = 'Feedback';
                info.borderColor = 'warning.main';
            } else if (low.includes('email')) {
                info.icon = <EmailOutlined sx={{ fontSize: 14, color: 'secondary.main' }} />;
                info.color = 'secondary';
                info.label = 'Email';
                info.borderColor = 'secondary.main';
            }
        }

        return info;
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
                        width: 420,
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
                            label={sysCount}
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
                            {visibleNotifications.map((n, i) => {
                                const info = getNotificationInfo(n.type);
                                return (
                                    <React.Fragment key={`${n.type}-${n._id || i}`}>
                                        <ListItem
                                            alignItems="flex-start"
                                            onClick={() => handleNotificationClick(n)}
                                            sx={{
                                                py: 1.5, px: 2,
                                                cursor: 'pointer',
                                                borderLeft: '4px solid',
                                                borderLeftColor: info.borderColor,
                                                '&:hover': { bgcolor: 'action.hover' },
                                                pr: 5, // make room for close button
                                                position: 'relative',
                                            }}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 0.5 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            {info.icon}
                                                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                                                {info.source}
                                                            </Typography>
                                                            <Box sx={{ flex: 1 }} />
                                                            <Typography component="span" variant="caption" color="text.disabled">
                                                                {formatTime(n.createdAt)}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Chip
                                                                label={info.label}
                                                                size="small"
                                                                color={info.color}
                                                                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                                                            />
                                                            <Typography
                                                                component="span"
                                                                variant="subtitle2"
                                                                fontWeight={700}
                                                                noWrap
                                                                sx={{ flex: 1 }}
                                                            >
                                                                {n.title}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                }
                                                secondaryTypographyProps={{ component: 'span' }}
                                                secondary={
                                                    <>
                                                        <Typography
                                                            component="span"
                                                            display="block"
                                                            variant="body2"
                                                            color="text.primary"
                                                            sx={{
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 3,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden',
                                                                lineHeight: 1.4,
                                                                mb: 0.5,
                                                            }}
                                                        >
                                                            {n.body}
                                                        </Typography>
                                                        <Typography component="span" display="block" variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                                            By: {n.author === 'System' ? info.source : n.author}
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
                                );
                            })}
                        </List>
                    )}
                </Box>
            </Popover>
        </>
    );
};

export default NotificationBell;
