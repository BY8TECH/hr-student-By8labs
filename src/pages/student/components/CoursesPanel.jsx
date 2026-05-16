import React, { useState, useEffect } from 'react';
import {
    Box, Grid, Typography, Paper, CircularProgress, Alert,
    Chip, IconButton, Button, TextField, Card, CardContent,
    Dialog, DialogTitle, DialogContent, DialogActions, MenuItem
} from '@mui/material';
import { Refresh, Delete, MenuBook, AccessTime } from '@mui/icons-material';
import { courseAPI, STUDENT_API_URL } from '../../../services/studentPortalAPI';

export default function CoursesPanel() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [catOpen, setCatOpen] = useState(false);
    const [catData, setCatData] = useState({ name: '', categoryId: '', description: '', imageUrl: '', fees: '', duration: '' });
    const [catFile, setCatFile] = useState(null);
    const [catSaving, setCatSaving] = useState(false);
    const [catNames, setCatNames] = useState([]);

    const fetchCourses = () => {
        setLoading(true);
        courseAPI.getAllCourses()
            .then(r => setCourses(r.data.data || []))
            .catch(() => setError('Failed to load courses.'))
            .finally(() => setLoading(false));
    };

    const fetchCatNames = () => {
        courseAPI.getCategoryNames()
            .then(r => setCatNames(r.data.data || []))
            .catch(() => console.error('Failed to fetch category names'));
    };

    const getImageUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const cleanUrl = url.replace(/\\/g, '/').replace(/^\//, '');
        const baseUrl = STUDENT_API_URL.endsWith('/api') ? STUDENT_API_URL.slice(0, -4) : STUDENT_API_URL;
        return `${baseUrl}/${cleanUrl}`;
    };

    const categoryNameMap = {
        '1001': 'AI',
        '1002': 'Web Development'
    };

    useEffect(() => {
        fetchCourses();
        fetchCatNames();
    }, []);

    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            setCatSaving(true);
            setError('');

            let finalImageUrl = catData.imageUrl || '';

            // 1. Upload to Cloudinary if a file is selected
            if (catFile) {
                const cloudFormData = new FormData();
                cloudFormData.append('file', catFile);
                cloudFormData.append('upload_preset', 'zdxqbgct'); 
                cloudFormData.append('cloud_name', 'druuaiprp');

                const cloudRes = await fetch('https://api.cloudinary.com/v1_1/druuaiprp/image/upload', {
                    method: 'POST',
                    body: cloudFormData
                });

                const cloudData = await cloudRes.json();

                if (cloudData.error) {
                    throw new Error(`Cloudinary Error: ${cloudData.error.message}.`);
                }

                finalImageUrl = cloudData.secure_url;
            }

            // 2. Send JSON payload to Backend
            await courseAPI.addCategory({
                name: catData.name,
                description: catData.description,
                imageUrl: finalImageUrl,
                fees: catData.fees,
                duration: catData.duration,
                categoryId: catData.categoryId,
            });

            setSuccess('Course added successfully!');
            setCatOpen(false);
            setCatData({ name: '', categoryId: '', description: '', imageUrl: '', fees: '', duration: '' });
            setCatFile(null);
            fetchCourses();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to add course');
        } finally {
            setCatSaving(false);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Are you sure you want to delete this course?')) return;
        try {
            setLoading(true);
            await courseAPI.deleteCategory(id);
            setSuccess('Course deleted successfully!');
            fetchCourses();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete course');
        } finally {
            setLoading(false);
        }
    };

    if (loading && courses.length === 0) return <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>;

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={700}>All Courses</Typography>
                <Box>
                    <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={fetchCourses} disabled={loading} sx={{ mr: 1 }}>Refresh</Button>
                    <Button variant="contained" size="small" onClick={() => setCatOpen(true)}>Add Course</Button>
                </Box>
            </Box>

            {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}
            {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

            {courses.length === 0
                ? <Typography color="text.secondary">No courses available.</Typography>
                : (
                    <Grid container spacing={2}>
                        {courses.map(c => (
                            <Grid item xs={12} sm={6} md={4} key={c._id}>
                                <Card sx={{ position: 'relative' }}>
                                    <Box sx={{ position: 'absolute', top: 5, right: 5, zIndex: 1 }}>
                                        <IconButton
                                            size="small"
                                            sx={{ bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: '#fff' } }}
                                            color="error"
                                            onClick={() => handleDeleteCategory(c._id)}
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </Box>
                                    <Box sx={{ height: 140, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        {c.imageUrl ? (
                                            <Box
                                                component="img"
                                                src={getImageUrl(c.imageUrl)}
                                                alt={c.name}
                                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://via.placeholder.com/300x140.png?text=Image+Not+Found';
                                                }}
                                            />
                                        ) : (
                                            <MenuBook sx={{ fontSize: 40, color: 'text.disabled' }} />
                                        )}
                                    </Box>
                                    <CardContent>
                                        <Chip label={categoryNameMap[c.categoryId] || c.categoryId || c.category || 'Category'} size="small" color="primary" variant="outlined" sx={{ mb: 1 }} />
                                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>{c.name || c.title}</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {c.description || 'No description.'}
                                        </Typography>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <AccessTime sx={{ fontSize: 14 }} /> {c.duration || 'N/A'} Months
                                            </Typography>
                                            <Typography variant="caption" fontWeight={700} color="primary.main">
                                                {c.fees || c.price ? `₹${c.fees || c.price}` : 'Free'}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )
            }

            <Dialog open={catOpen} onClose={() => setCatOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add New Course</DialogTitle>
                <form onSubmit={handleAddCategory}>
                    <DialogContent dividers>
                        <TextField
                            label="Course Name" fullWidth size="small" required sx={{ mb: 2 }}
                            value={catData.name} onChange={e => setCatData({ ...catData, name: e.target.value })}
                        />
                        <TextField
                            select
                            label="Category" fullWidth size="small" required sx={{ mb: 2 }}
                            value={catData.categoryId} onChange={e => setCatData({ ...catData, categoryId: e.target.value })}
                        >
                            {catNames.map((name) => (
                                <MenuItem key={name} value={name === 'AI' ? '1001' : (name === 'Web Development' ? '1002' : name)}>
                                    {name}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="Description" fullWidth size="small" multiline rows={3} sx={{ mb: 2 }}
                            value={catData.description} onChange={e => setCatData({ ...catData, description: e.target.value })}
                        />
                        <Box sx={{ mb: 2, p: 2, border: '1px dashed grey', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                Course Image (Choose File OR paste Image URL)
                            </Typography>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={e => setCatFile(e.target.files[0])}
                                style={{ width: '100%', marginBottom: '10px' }}
                            />
                            <Typography variant="caption" display="block" align="center" sx={{ my: 1 }}>OR</Typography>
                            <TextField
                                label="Image URL" fullWidth size="small"
                                placeholder="https://example.com/image.jpg"
                                value={catData.imageUrl} onChange={e => setCatData({ ...catData, imageUrl: e.target.value })}
                            />
                        </Box>
                        <TextField
                            label="Fees" type="number" fullWidth size="small"
                            value={catData.fees} onChange={e => setCatData({ ...catData, fees: e.target.value })}
                        />
                        <TextField
                            label="Duration (Months)" type="number" fullWidth size="small" sx={{ mt: 2 }}
                            value={catData.duration} onChange={e => setCatData({ ...catData, duration: e.target.value })}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCatOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={catSaving}>
                            {catSaving ? 'Saving...' : 'Add Course'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
