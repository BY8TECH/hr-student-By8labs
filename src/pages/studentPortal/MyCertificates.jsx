import React, { useState, useEffect } from 'react';
import {
    Container, Box, Typography, Card, CardContent, CircularProgress,
    Alert, Grid, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import { VerifiedUser, FileDownload, EmojiEvents, Visibility, Add } from '@mui/icons-material';
import { certificateAPI } from '../../services/studentPortalAPI';
import { useAuth } from '../../context/AuthContext';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Snackbar
} from '@mui/material';

const MyCertificates = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [certificates, setCertificates] = useState([]);
    const [downloading, setDownloading] = useState(null);

    // Request Dialog State
    const [requestOpen, setRequestOpen] = useState(false);
    const [requestLoading, setRequestLoading] = useState(false);
    const [requestForm, setRequestForm] = useState({ courseName: '' });
    const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

    const fetchCertificates = async () => {
        if (!user?._id) return;
        try {
            setLoading(true);
            const res = await certificateAPI.getCertificatesByUserId(user._id);
            if (res.data.success) {
                setCertificates(res.data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch certificates:', err);
            setError(err.response?.data?.message || 'Failed to load your certificates.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCertificates();
    }, [user?._id]);

    const handleRequestSubmit = async () => {
        if (!requestForm.courseName) {
            setSnack({ open: true, msg: 'Please enter the course name', severity: 'warning' });
            return;
        }

        try {
            setRequestLoading(true);
            const res = await certificateAPI.requestCertificate(requestForm);
            if (res.data.success) {
                setSnack({ open: true, msg: 'Certificate request submitted successfully!', severity: 'success' });
                setRequestOpen(false);
                setRequestForm({ courseName: '' });
            }
        } catch (err) {
            setSnack({ open: true, msg: err.response?.data?.message || 'Failed to submit request', severity: 'error' });
        } finally {
            setRequestLoading(false);
        }
    };

    const handleDownload = async (cert) => {
        const certId = cert._id;
        
        try {
            setDownloading(certId);
            const res = await certificateAPI.download(certId);

            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Certificate_${cert.certificateNumber || certId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download error:', err);
            let errorMessage = 'Failed to download certificate';
            if (err.response?.data instanceof Blob) {
                const text = await err.response.data.text();
                try {
                    const json = JSON.parse(text);
                    errorMessage = json.message || errorMessage;
                } catch { }
            } else {
                errorMessage = err.response?.data?.message || errorMessage;
            }
            alert(errorMessage);
        } finally {
            setDownloading(null);
        }
    };

    const handleView = async (cert) => {
        const certId = cert._id;
        
        try {
            setDownloading(certId);
            const res = await certificateAPI.view(certId);

            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (err) {
            console.error('Preview error:', err);
            let errorMessage = 'Failed to open preview';
            if (err.response?.data instanceof Blob) {
                const text = await err.response.data.text();
                try {
                    const json = JSON.parse(text);
                    errorMessage = json.message || errorMessage;
                } catch { }
            } else {
                errorMessage = err.response?.data?.message || errorMessage;
            }
            alert(errorMessage);
        } finally {
            setDownloading(null);
        }
    };

    if (loading) {
        return <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>;
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box mb={4} display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={2}>
                    <EmojiEvents color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                        <Typography variant="h4" fontWeight="bold">My Certificates</Typography>
                        <Typography variant="subtitle1" color="text.secondary">View and download your earned achievements</Typography>
                    </Box>
                </Box>
                <Button 
                    variant="contained" 
                    startIcon={<Add />} 
                    onClick={() => setRequestOpen(true)}
                    sx={{ borderRadius: 2, px: 3 }}
                >
                    Request Certificate
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {certificates.length === 0 ? (
                <Card sx={{ p: 6, textAlign: 'center', borderRadius: 4, bgcolor: 'rgba(99, 102, 241, 0.05)', border: '1px dashed' }}>
                    <VerifiedUser sx={{ fontSize: 60, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" color="text.secondary">No certificates issued yet.</Typography>
                    <Typography variant="body2" color="text.disabled">You can request a certificate once you complete your course.</Typography>
                    <Button 
                        variant="outlined" 
                        sx={{ mt: 3, borderRadius: 2 }}
                        onClick={() => setRequestOpen(true)}
                    >
                        Submit Request
                    </Button>
                </Card>
            ) : (
                <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'primary.main' }}>
                                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Certificate Number</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Course Name</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Date Issued</TableCell>
                                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }} align="center">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {certificates.map((cert) => (
                                <TableRow key={cert._id} hover>
                                    <TableCell fontWeight="medium">{cert.certificateNumber}</TableCell>
                                    <TableCell>{cert.courseName}</TableCell>
                                    <TableCell>{new Date(cert.issuedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={downloading === cert._id ? <CircularProgress size={16} color="inherit" /> : <Visibility />}
                                                onClick={() => handleView(cert)}
                                                disabled={downloading !== null}
                                                sx={{ borderRadius: 2 }}
                                            >
                                                {downloading === cert._id ? 'Opening...' : 'View'}
                                            </Button>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={downloading === cert._id ? <CircularProgress size={16} color="inherit" /> : <FileDownload />}
                                                onClick={() => handleDownload(cert)}
                                                disabled={downloading !== null}
                                                sx={{ borderRadius: 2 }}
                                            >
                                                {downloading === cert._id ? 'Downloading...' : 'Download'}
                                            </Button>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Box mt={4}>
                <Typography variant="caption" color="text.secondary">
                    <b>Note:</b> You can only download certificates that have been officially issued to you. If your certificate is missing, please contact HR or your Course Administrator.
                </Typography>
            </Box>

            {/* Request Dialog */}
            <Dialog open={requestOpen} onClose={() => setRequestOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Request Certificate</DialogTitle>
                <DialogContent dividers>
                    <TextField
                        fullWidth
                        label="Course Name"
                        placeholder="e.g. Full Stack Web Development"
                        sx={{ mb: 3, mt: 1 }}
                        value={requestForm.courseName}
                        onChange={e => setRequestForm({ ...requestForm, courseName: e.target.value })}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setRequestOpen(false)} disabled={requestLoading}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleRequestSubmit} 
                        disabled={requestLoading}
                        startIcon={requestLoading && <CircularProgress size={16} />}
                    >
                        {requestLoading ? 'Submitting...' : 'Submit Request'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar 
                open={snack.open} 
                autoHideDuration={4000} 
                onClose={() => setSnack({ ...snack, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snack.severity} variant="filled" sx={{ width: '100%' }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default MyCertificates;
