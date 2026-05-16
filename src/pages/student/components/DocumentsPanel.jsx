import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, CircularProgress, Alert,
    Button, TextField, MenuItem, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip
} from '@mui/material';
import { Refresh, CloudUpload, Delete, FileDownload } from '@mui/icons-material';
import { courseAPI, documentAPI, STUDENT_API_URL } from '../../../services/studentPortalAPI';

export default function DocumentsPanel() {
    const [courses, setCourses] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [loadingDocs, setLoadingDocs] = useState(true);

    // Upload form
    const [courseId, setCourseId] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    const fetchDocs = useCallback(async () => {
        setLoadingDocs(true);
        try {
            const res = await documentAPI.getAllAdminDocuments();
            setDocuments(res.data.data || []);
        } catch (err) {
            console.error('Failed to load documents:', err);
        } finally {
            setLoadingDocs(false);
        }
    }, []);

    useEffect(() => {
        courseAPI.getAllCourses()
            .then(res => setCourses(res.data?.data || res.data || []))
            .catch(console.error)
            .finally(() => setLoadingCourses(false));

        fetchDocs();
    }, [fetchDocs]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!courseId) return setMsg({ type: 'error', text: 'Please select a course.' });
        if (!file) return setMsg({ type: 'error', text: 'Please choose a file to upload.' });

        setUploading(true);
        setMsg({ type: '', text: '' });

        const selectedCourse = courses.find(c => (c.courseId || c._id) === courseId);
        const courseName = selectedCourse ? (selectedCourse.name || selectedCourse.courseName) : 'Unknown Course';

        const formData = new FormData();
        formData.append('file', file);
        formData.append('courseId', courseId);
        formData.append('courseName', courseName);

        const uStr = localStorage.getItem('user');
        let uploadUserId = 'admin';
        if (uStr) {
            try { const u = JSON.parse(uStr); uploadUserId = u._id || 'admin'; } catch (e) { }
        }
        formData.append('userId', uploadUserId);

        try {
            await documentAPI.uploadDocument(formData);
            setMsg({ type: 'success', text: 'Document uploaded successfully!' });
            setFile(null);
            setCourseId('');
            const fileInput = document.getElementById('upload-course-doc-input');
            if (fileInput) fileInput.value = '';
            fetchDocs();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to upload document' });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;
        try {
            await documentAPI.deleteDocument(id);
            setMsg({ type: 'success', text: 'Document deleted successfully!' });
            fetchDocs();
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to delete document.' });
        }
    };

    return (
        <Box>
            <Typography variant="h6" fontWeight={700} mb={3}>Upload Course Materials</Typography>

            <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={2}>New Upload</Typography>
                {msg.text && <Alert severity={msg.type} sx={{ mb: 2 }} onClose={() => setMsg({ type: '', text: '' })}>{msg.text}</Alert>}
                
                <Box component="form" onSubmit={handleUpload}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4}>
                            <TextField
                                select fullWidth size="small" label="Select Course"
                                value={courseId} onChange={e => setCourseId(e.target.value)}
                                disabled={loadingCourses}
                            >
                                {courses.map(c => (
                                    <MenuItem key={c._id} value={c.courseId || c._id}>
                                        {c.name || c.courseName}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={5}>
                            <Button
                                variant="outlined"
                                component="label"
                                fullWidth
                                startIcon={<CloudUpload />}
                                sx={{ height: 40, textTransform: 'none' }}
                            >
                                {file ? file.name : 'Choose PDF / Material'}
                                <input id="upload-course-doc-input" type="file" hidden onChange={handleFileChange} accept=".pdf,.doc,.docx,.ppt,.pptx" />
                            </Button>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                disabled={uploading || !file || !courseId}
                                sx={{ height: 40, fontWeight: 700 }}
                            >
                                {uploading ? <CircularProgress size={20} color="inherit" /> : 'Upload'}
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle2" fontWeight={700}>Managed Materials</Typography>
                <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={fetchDocs} disabled={loadingDocs}>Refresh</Button>
            </Box>

            {loadingDocs ? <CircularProgress size={30} /> : (
                <TableContainer component={Paper} elevation={1}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <TableCell><b>File Name</b></TableCell>
                                <TableCell><b>Course</b></TableCell>
                                <TableCell><b>Uploaded</b></TableCell>
                                <TableCell align="right"><b>Actions</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {documents.length === 0 ? (
                                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>No documents found.</TableCell></TableRow>
                            ) : documents.map(doc => (
                                <TableRow key={doc._id} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600}>{doc.originalName || doc.fileName}</Typography>
                                    </TableCell>
                                    <TableCell><Chip label={doc.courseName || 'N/A'} size="small" variant="outlined" /></TableCell>
                                    <TableCell><Typography variant="caption">{new Date(doc.createdAt).toLocaleDateString()}</Typography></TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Download">
                                            <IconButton size="small" color="primary" component="a" href={`${STUDENT_API_URL}/documents/download/${doc._id}`} target="_blank">
                                                <FileDownload fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton size="small" color="error" onClick={() => handleDelete(doc._id)}>
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
}
