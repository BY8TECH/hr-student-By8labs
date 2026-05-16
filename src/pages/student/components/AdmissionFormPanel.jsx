import React, { useState, useEffect } from 'react';
import {
    Box, Grid, Typography, Paper, CircularProgress, Alert,
    Divider, TextField, MenuItem, Button, FormControl, FormLabel,
    RadioGroup, FormControlLabel, Radio, Dialog, DialogContent, DialogActions
} from '@mui/material';
import { CheckCircle, MenuBook, CloudUpload } from '@mui/icons-material';
import { adminStudentAPI, courseAPI } from '../../../services/studentPortalAPI';

export default function AdmissionFormPanel() {
    const [form, setForm] = useState({
        name: '', email: '', phone: '', password: '',
        classType: 'Online', course: '', profileImage: null
    });
    const [courses, setCourses] = useState([]);
    const [coursesLoading, setCoursesLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [snack, setSnack] = useState({ open: false, msg: '', severity: 'info' });
    const [successData, setSuccessData] = useState(null);

    useEffect(() => {
        setCoursesLoading(true);
        courseAPI.getAllCourses()
            .then(res => setCourses(res.data?.data || res.data || []))
            .catch(console.error)
            .finally(() => setCoursesLoading(false));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Name is required';
        if (!form.email.trim()) e.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
        if (!form.password) e.password = 'Password is required';
        else if (form.password.length < 6) e.password = 'Min 6 characters';
        if (form.classType === 'Offline' && !form.course) e.course = 'Please select a course for offline mode';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('name', form.name);
            formData.append('email', form.email);
            formData.append('phone', form.phone);
            formData.append('password', form.password);
            formData.append('classType', form.classType);
            if (form.course) formData.append('course', form.course);
            if (form.profileImage) formData.append('profileImage', form.profileImage);

            const res = await adminStudentAPI.createAdmission(formData);
            setSuccessData(res.data?.data || res.data);
            setSnack({ open: true, msg: 'Student registered successfully!', severity: 'success' });
            setForm({ name: '', email: '', phone: '', password: '', classType: 'Online', course: '', profileImage: null });
        } catch (err) {
            setSnack({ open: true, msg: err.response?.data?.message || 'Admission submission failed.', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Typography variant="h5" fontWeight={800} mb={3} sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                New Student Admission
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={7}>
                    <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
                        <Box component="form" onSubmit={handleSubmit}>
                            <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1.2}>
                                Personal Details
                            </Typography>
                            <Divider sx={{ mb: 2, mt: 0.5 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth name="name" label="Full Name *" value={form.name} onChange={handleChange}
                                        error={!!errors.name} helperText={errors.name} size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth name="email" label="Email Address *" type="email" value={form.email} onChange={handleChange}
                                        error={!!errors.email} helperText={errors.email} size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth name="phone" label="Phone Number" value={form.phone} onChange={handleChange}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth name="password" label="Portal Password *" type="password" value={form.password} onChange={handleChange}
                                        error={!!errors.password} helperText={errors.password} size="small"
                                    />
                                </Grid>
                            </Grid>

                            <Box sx={{ mt: 3, mb: 2, p: 2, border: '1px dashed grey', borderRadius: 2 }}>
                                <Typography variant="caption" color="text.secondary" display="block" gutterBottom sx={{ fontWeight: 700 }}>
                                    PROFILE PICTURE (OPTIONAL)
                                </Typography>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setForm(f => ({ ...f, profileImage: e.target.files[0] }))}
                                    style={{ width: '100%' }}
                                />
                            </Box>

                            <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1.2} sx={{ display: 'block', mt: 2 }}>
                                Class Type & Course Selection
                            </Typography>
                            <Divider sx={{ mb: 2, mt: 0.5 }} />

                            <FormControl component="fieldset" sx={{ mb: 2 }}>
                                <FormLabel component="legend" sx={{ fontSize: '0.8rem', fontWeight: 700 }}>CLASS TYPE</FormLabel>
                                <RadioGroup
                                    row
                                    name="classType"
                                    value={form.classType}
                                    onChange={handleChange}
                                >
                                    <FormControlLabel value="Online" control={<Radio size="small" />} label="Online" />
                                    <FormControlLabel value="Offline" control={<Radio size="small" />} label="Offline" />
                                </RadioGroup>
                            </FormControl>

                            {form.classType === 'Offline' && (
                                <TextField
                                    fullWidth select name="course" label="Select Course *"
                                    value={form.course} onChange={handleChange}
                                    error={!!errors.course} helperText={errors.course}
                                    size="small"
                                    disabled={coursesLoading}
                                >
                                    <MenuItem value="" disabled>
                                        <em>{coursesLoading ? 'Loading courses…' : courses.length === 0 ? 'No courses available' : 'Choose a course…'}</em>
                                    </MenuItem>
                                    {courses.map(c => (
                                        <MenuItem key={c._id} value={c._id}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <MenuBook sx={{ fontSize: 16, color: 'primary.main' }} />
                                                {c.name}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )}

                            <Button
                                fullWidth type="submit" variant="contained" size="large"
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
                                sx={{ mt: 3, py: 1.4, fontWeight: 700, borderRadius: 2 }}
                            >
                                {loading ? 'Submitting…' : 'Submit Admission'}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={5}>
                    {successData ? (
                        <Paper elevation={2} sx={{
                            p: 3, borderRadius: 3,
                            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                            border: '1px solid #bbf7d0'
                        }}>
                            <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                                <CheckCircle sx={{ color: '#16a34a', fontSize: 32 }} />
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={800} color="#16a34a">Admission Successful!</Typography>
                                    <Typography variant="body2" color="text.secondary">Student has been registered</Typography>
                                </Box>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            {[
                                ['Name', successData.name],
                                ['Email', successData.email],
                                ['Admission ID', successData.admissionId],
                                ['User ID', successData.userId],
                            ].filter(([, v]) => v).map(([label, value]) => (
                                <Box key={label} sx={{ display: 'flex', mb: 1, gap: 1 }}>
                                    <Typography variant="body2" fontWeight={700} color="text.secondary" sx={{ minWidth: 100 }}>{label}:</Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-all' }}>{value}</Typography>
                                </Box>
                            ))}
                            <Button
                                fullWidth variant="outlined" color="success" size="small"
                                sx={{ mt: 2, borderRadius: 2, fontWeight: 700 }}
                                onClick={() => setSuccessData(null)}
                            >
                                + Add Another Student
                            </Button>
                        </Paper>
                    ) : (
                        <Paper elevation={0} sx={{
                            p: 3, borderRadius: 3,
                            border: '1px dashed', borderColor: 'divider',
                            bgcolor: 'rgba(0,0,0,0.01)'
                        }}>
                            <Typography variant="subtitle2" fontWeight={700} mb={2} color="text.secondary">📋 Admission Guide</Typography>
                            {[
                                { icon: '👤', text: 'Enter the student\'s full legal name' },
                                { icon: '📧', text: 'Use a valid email — it will be their login' },
                                { icon: '📱', text: 'Phone must be numeric' },
                                { icon: '🔑', text: 'Set a strong password (min 6 chars)' },
                                { icon: '🌐', text: 'Select Class Type (Online or Offline)' },
                                { icon: '📚', text: 'Course is required only for Offline' },
                                { icon: '✅', text: 'Student account is created immediately' },
                            ].map((item, i) => (
                                <Box key={i} display="flex" gap={1.5} mb={1.5} alignItems="flex-start">
                                    <Typography sx={{ fontSize: 18, lineHeight: 1.4 }}>{item.icon}</Typography>
                                    <Typography variant="body2" color="text.secondary">{item.text}</Typography>
                                </Box>
                            ))}
                        </Paper>
                    )}
                </Grid>
            </Grid>

            <Dialog open={snack.open && snack.severity === 'success'} onClose={() => setSnack(s => ({ ...s, open: false }))} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
                <Box sx={{ background: 'linear-gradient(135deg, #00b09b 0%, #096939 100%)', py: 3, textAlign: 'center' }}>
                    <CheckCircle sx={{ fontSize: 60, color: '#fff' }} />
                </Box>
                <DialogContent sx={{ textAlign: 'center', pt: 2 }}>
                    <Typography variant="h6" fontWeight={800} color="#096939">Admission Submitted!</Typography>
                    <Typography variant="body2" color="text.secondary" mt={1}>{snack.msg}</Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button fullWidth variant="contained" onClick={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #00b09b 0%, #096939 100%)' }}>OK</Button>
                </DialogActions>
            </Dialog>

            {snack.open && snack.severity === 'error' && (
                <Alert severity="error" onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ mt: 2 }}>
                    {snack.msg}
                </Alert>
            )}
        </Box>
    );
}
