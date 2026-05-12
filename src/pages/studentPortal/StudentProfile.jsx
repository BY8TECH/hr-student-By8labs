import React, { useState } from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    Avatar,
    Button,
    TextField,
    Grid,
    Divider,
    IconButton,
    Alert,
    CircularProgress,
    Snackbar
} from '@mui/material';
import {
    PhotoCamera,
    Person as PersonIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    School as SchoolIcon,
    Save as SaveIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/studentPortalAPI';
import { useNavigate } from 'react-router-dom';

const StudentProfile = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [uploading, setUploading] = useState(false);
    const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await userAPI.updateProfilePhoto(user._id, formData);
            if (res.data.success) {
                const newPhotoUrl = res.data.profileImage;
                updateUser({ profileImage: newPhotoUrl });
                setSnack({ open: true, msg: 'Profile photo updated successfully!', severity: 'success' });
            } else {
                throw new Error(res.data.message || 'Failed to update photo');
            }
        } catch (err) {
            console.error('Photo upload error:', err);
            setSnack({ open: true, msg: err.response?.data?.message || err.message || 'Failed to upload photo', severity: 'error' });
        } finally {
            setUploading(false);
        }
    };

    if (!user) return null;

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={() => navigate(-1)} color="primary">
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" fontWeight={700}>My Profile</Typography>
            </Box>

            <Grid container spacing={4}>
                {/* Left: Avatar and Upload */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
                        <Box sx={{ position: 'relative', display: 'inline-block' }}>
                            <Avatar
                                src={user.profileImage}
                                sx={{ width: 150, height: 150, mx: 'auto', mb: 2, border: '4px solid #f3f4f6', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            >
                                {!user.profileImage && user.name?.charAt(0).toUpperCase()}
                            </Avatar>
                            <input
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="profile-photo-upload"
                                type="file"
                                onChange={handlePhotoChange}
                                disabled={uploading}
                            />
                            <label htmlFor="profile-photo-upload">
                                <IconButton
                                    color="primary"
                                    component="span"
                                    sx={{
                                        position: 'absolute',
                                        bottom: 15,
                                        right: 0,
                                        bgcolor: 'white',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                        '&:hover': { bgcolor: '#f3f4f6' }
                                    }}
                                    disabled={uploading}
                                >
                                    {uploading ? <CircularProgress size={24} /> : <PhotoCamera />}
                                </IconButton>
                            </label>
                        </Box>
                        <Typography variant="h6" fontWeight={700}>{user.name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                            Student • {user.studentType}
                        </Typography>
                    </Paper>
                </Grid>

                {/* Right: Details */}
                <Grid item xs={12} md={8}>
                    <Paper elevation={3} sx={{ p: 4, borderRadius: 4 }}>
                        <Typography variant="h6" fontWeight={700} mb={3} display="flex" alignItems="center" gap={1}>
                            <PersonIcon color="primary" /> Basic Information
                        </Typography>
                        <Divider sx={{ mb: 3 }} />

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Box display="flex" alignItems="center" gap={2}>
                                <EmailIcon sx={{ color: 'text.secondary' }} />
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">EMAIL ADDRESS</Typography>
                                    <Typography variant="body1" fontWeight={500}>{user.email}</Typography>
                                </Box>
                            </Box>

                            <Box display="flex" alignItems="center" gap={2}>
                                <PhoneIcon sx={{ color: 'text.secondary' }} />
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">MOBILE NUMBER</Typography>
                                    <Typography variant="body1" fontWeight={500}>{user.mobile}</Typography>
                                </Box>
                            </Box>

                            <Box display="flex" alignItems="center" gap={2}>
                                <SchoolIcon sx={{ color: 'text.secondary' }} />
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">COURSE ENROLLED</Typography>
                                    <Typography variant="body1" fontWeight={500}>{user.courseName || 'Not specified'}</Typography>
                                </Box>
                            </Box>

                            <Box display="flex" alignItems="center" gap={2}>
                                <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: user.isApproved ? 'success.main' : 'warning.main' }} />
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">ACCOUNT STATUS</Typography>
                                    <Typography variant="body1" fontWeight={600} color={user.isApproved ? 'success.main' : 'warning.main'}>
                                        {user.isApproved ? 'Active / Approved' : 'Pending Approval'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <Snackbar
                open={snack.open}
                autoHideDuration={4000}
                onClose={() => setSnack({ ...snack, open: false })}
            >
                <Alert severity={snack.severity} sx={{ width: '100%' }} elevation={6} variant="filled">
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default StudentProfile;
