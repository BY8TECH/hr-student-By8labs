import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Alert,
    CircularProgress,
    Paper,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Chip,
    Divider,
    IconButton,
    Tooltip,
    TextField,
    InputAdornment
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { emailsAPI } from '../../services/api';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { Visibility, VisibilityOff, LockPerson, Close } from '@mui/icons-material';

const ExternalInboxView = () => {
    const { user } = useAuth();
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loadingContent, setLoadingContent] = useState(false);
    const [lastRefreshTime, setLastRefreshTime] = useState(null);

    // Authentication State
    const [authOpen, setAuthOpen] = useState(false);
    const [emailPassword, setEmailPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const savedPassword = sessionStorage.getItem(`email_pwd_${user?.email}`);
        if (savedPassword) {
            setEmailPassword(savedPassword);
            setIsAuthenticated(true);
            loadInbox(false, savedPassword);
        } else {
            setAuthOpen(true);
        }
    }, [user?.email]);

    const handleAuthSubmit = (e) => {
        if (e) e.preventDefault();
        if (!emailPassword) {
            setMessage({ type: 'error', text: 'Please enter your email password' });
            return;
        }
        
        // Clear previous messages
        setMessage({ type: '', text: '' });
        
        // Attempt first load to verify password
        loadInbox(false, emailPassword);
    };

    const loadInbox = async (isRefresh = false, passwordToUse = emailPassword) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response = await emailsAPI.getExternalInbox(passwordToUse);
            setEmails(response.data || []);
            setLastRefreshTime(new Date());
            
            // If successful, mark as authenticated and save in session
            setIsAuthenticated(true);
            setAuthOpen(false);
            sessionStorage.setItem(`email_pwd_${user?.email}`, passwordToUse);

            // Clear any previous errors if successful
            setMessage({ type: '', text: '' });

            // Show success message only on manual refresh
            if (isRefresh) {
                setMessage({
                    type: 'success',
                    text: `Inbox refreshed successfully. ${response.data?.length || 0} emails found.`
                });
                // Auto-hide success message after 3 seconds
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            }
        } catch (error) {
            console.error('Error loading external inbox:', error);
            const errorMessage = error.response?.data?.message || 'Failed to connect to email server. Please check your credentials.';
            
            setMessage({
                type: 'error',
                text: errorMessage
            });
            
            // If authentication fails, stay on or reopen the auth dialog
            if (error.response?.status === 400 || error.response?.status === 500) {
                setIsAuthenticated(false);
                setAuthOpen(true);
                sessionStorage.removeItem(`email_pwd_${user?.email}`);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        loadInbox(true);
    };

    const handleEmailClick = async (emailId) => {
        try {
            setLoadingContent(true);
            setDetailOpen(true);
            const response = await emailsAPI.getExternalEmailById(emailId, emailPassword);
            setSelectedEmail(response.data);
        } catch (error) {
            setMessage({
                type: 'error',
                text: 'Failed to load email content'
            });
            setDetailOpen(false); // Close dialong on error
        } finally {
            setLoadingContent(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return '';
        const emailDate = new Date(date);
        const now = new Date();
        const diffInHours = (now - emailDate) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return format(emailDate, 'h:mm a');
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return format(emailDate, 'MMM d');
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {message.text && (
                <Alert severity={message.type} onClose={() => setMessage({ type: '', text: '' })} sx={{ mb: 3 }}>
                    {message.text}
                </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                    <Typography variant="h6" component="span">
                        Hostinger Inbox
                        <Chip
                            label="External"
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ ml: 1, verticalAlign: 'middle' }}
                        />
                    </Typography>
                    {lastRefreshTime && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Last updated: {format(lastRefreshTime, 'PPpp')}
                        </Typography>
                    )}
                </Box>
                <Tooltip title="Refresh inbox">
                    <IconButton
                        onClick={handleRefresh}
                        disabled={refreshing}
                        color="primary"
                        size="large"
                    >
                        <RefreshIcon sx={{
                            animation: refreshing ? 'spin 1s linear infinite' : 'none',
                            '@keyframes spin': {
                                '0%': { transform: 'rotate(0deg)' },
                                '100%': { transform: 'rotate(360deg)' }
                            }
                        }} />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Email List */}
            {emails.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="text.secondary">
                        {loading ? 'Loading...' : 'No emails found in Hostinger Inbox'}
                    </Typography>
                </Box>
            ) : (
                <Paper>
                    <List>
                        {emails.map((email, index) => (
                            <React.Fragment key={email.id}>
                                <ListItem disablePadding>
                                    <ListItemButton onClick={() => handleEmailClick(email.id)}>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography sx={{ fontWeight: !email.seen ? 700 : 400, flex: 1 }}>
                                                        {email.from}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {formatDate(email.date)}
                                                    </Typography>
                                                </Box>
                                            }
                                            secondary={
                                                <Box>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: !email.seen ? 600 : 400,
                                                            color: 'text.primary'
                                                        }}
                                                    >
                                                        {email.subject || '(No Subject)'}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        {email.preview}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItemButton>
                                </ListItem>
                                {index < emails.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            )}

            {/* Session Authentication Dialog */}
            <Dialog 
                open={authOpen} 
                maxWidth="xs" 
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 2, p: 1 }
                }}
            >
                <DialogTitle sx={{ textAlign: 'center', pb: 1, position: 'relative' }}>
                    <IconButton
                        aria-label="close"
                        onClick={() => setAuthOpen(false)}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <Close />
                    </IconButton>
                    <LockPerson color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h5" fontWeight="bold">Unlock Inbox</Typography>
                </DialogTitle>
                <form onSubmit={handleAuthSubmit}>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                            Please enter your Hostinger email password to access your messages for this session.
                        </Typography>
                        
                        {message.text && (
                            <Alert severity={message.type} sx={{ mb: 2 }}>
                                {message.text}
                            </Alert>
                        )}

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <TextField
                                label="Email Address"
                                fullWidth
                                value={user?.email || ''}
                                disabled
                                variant="outlined"
                                size="medium"
                            />
                            <TextField
                                label="Email Password"
                                type={showPassword ? 'text' : 'password'}
                                fullWidth
                                autoFocus
                                value={emailPassword}
                                onChange={(e) => setEmailPassword(e.target.value)}
                                variant="outlined"
                                size="medium"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, pt: 1 }}>
                        <Button 
                            type="submit" 
                            fullWidth 
                            variant="contained" 
                            size="large"
                            disabled={loading || !emailPassword}
                            sx={{ fontWeight: 'bold',color: '#ffffff !important' }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Connect to Inbox'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Email Detail Dialog */}
            <Dialog
                open={detailOpen}
                onClose={() => setDetailOpen(false)}
                maxWidth="md"
                fullWidth
            >
                {loadingContent ? (
                    <Box p={4} display="flex" justifyContent="center">
                        <CircularProgress />
                    </Box>
                ) : selectedEmail && (
                    <>
                        <DialogTitle>
                            <Typography variant="h6">{selectedEmail.subject}</Typography>
                        </DialogTitle>
                        <DialogContent dividers>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>From:</strong> {selectedEmail.from}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Date:</strong> {format(new Date(selectedEmail.date), 'PPpp')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>To:</strong> {selectedEmail.to}
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Render HTML content safely */}
                            <Box
                                sx={{
                                    '& img': { maxWidth: '100%' },
                                    fontFamily: 'sans-serif'
                                }}
                                dangerouslySetInnerHTML={{ __html: selectedEmail.html || selectedEmail.text }}
                            />

                            {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                                <Box mt={2}>
                                    <Typography variant="subtitle2">Attachments:</Typography>
                                    <List dense>
                                        {selectedEmail.attachments.map((att, i) => (
                                            <ListItem key={i}>
                                                <ListItemText primary={att.filename} secondary={`${(att.size / 1024).toFixed(1)} KB`} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setDetailOpen(false)}>Close</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
};

export default ExternalInboxView;
