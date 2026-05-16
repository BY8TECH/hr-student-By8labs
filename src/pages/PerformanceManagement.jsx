import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { performanceAPI, employeeAPI } from '../services/api';
import {
    Container, Box, Typography, Paper, Tabs, Tab,
    Button, Grid, Card, CardContent, Chip, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, Select, InputLabel, FormControl,
    FormControlLabel, Checkbox, Alert, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    LinearProgress, Tooltip, Avatar, Divider, Stack, Rating
} from '@mui/material';
import {
    Add, Edit, Delete, Visibility, Star, TrendingUp,
    WorkspacePremium, CheckCircle, HourglassEmpty, PendingActions,
    EmojiEvents, Grade, ThumbUp, Close, Person
} from '@mui/icons-material';

// ─── Helpers ────────────────────────────────────────────────────────────────

const REVIEW_TYPES = ['Quarterly', 'Half-Yearly', 'Annual', 'Probation Review'];
const RATING_LABELS = { 1: 'Poor', 2: 'Below Average', 3: 'Average', 4: 'Good', 5: 'Excellent' };
const RATING_CATEGORIES = ['technical', 'communication', 'teamwork', 'leadership', 'punctuality'];
const RATING_ICONS = { technical: '💻', communication: '💬', teamwork: '🤝', leadership: '🏆', punctuality: '⏱️' };

const statusColor = (s) => ({ Draft: 'warning', Submitted: 'info', Acknowledged: 'success' }[s] || 'default');
const ratingColor = (r) => {
    if (r >= 4.5) return '#16a34a';
    if (r >= 3.5) return '#2563eb';
    if (r >= 2.5) return '#d97706';
    return '#dc2626';
};

const StarRating = ({ value, onChange, readOnly }) => (
    <Rating
        value={value}
        onChange={readOnly ? undefined : (_, v) => onChange(v)}
        max={5}
        precision={1}
        readOnly={readOnly}
        size="large"
        sx={{ color: '#f59e0b' }}
    />
);

// ─── Default Form ────────────────────────────────────────────────────────────

const defaultForm = {
    employeeId: '',
    reviewType: 'Annual',
    reviewPeriod: { startDate: '', endDate: '' },
    ratings: { technical: 0, communication: 0, teamwork: 0, leadership: 0, punctuality: 0 },
    strengths: '',
    areasOfImprovement: '',
    comments: '',
    promotionEligible: false,
    bonusEligible: false,
    bonusPercentage: 0,
    status: 'Draft',
    goals: [],
};

// ─── Component ───────────────────────────────────────────────────────────────

const PerformanceManagement = () => {
    const { user } = useAuth();
    const isHR = user?.role === 'HR' || user?.role === 'Manager';

    const [tab, setTab] = useState(0);
    const [reviews, setReviews] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [viewDialog, setViewDialog] = useState(false);
    const [ackDialog, setAckDialog] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [formData, setFormData] = useState(defaultForm);
    const [ackComment, setAckComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchReviews();
        if (isHR) fetchEmployees();
    }, []);

    const fetchReviews = async () => {
        try {
            const res = await performanceAPI.getAll();
            setReviews(res.data);
        } catch {
            setError('Failed to load performance reviews');
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await employeeAPI.getAll();
            setEmployees(res.data);
        } catch { /* silent */ }
    };

    // ── Form helpers ─────────────────────────────────────────────────────────

    const openCreate = () => {
        setSelectedReview(null);
        setFormData(defaultForm);
        setOpenDialog(true);
    };

    const openEdit = (review) => {
        setSelectedReview(review);
        setFormData({
            employeeId: review.employeeId?._id || review.employeeId,
            reviewType: review.reviewType,
            reviewPeriod: {
                startDate: review.reviewPeriod?.startDate?.split('T')[0] || '',
                endDate: review.reviewPeriod?.endDate?.split('T')[0] || '',
            },
            ratings: { ...review.ratings },
            strengths: review.strengths || '',
            areasOfImprovement: review.areasOfImprovement || '',
            comments: review.comments || '',
            promotionEligible: review.promotionEligible || false,
            bonusEligible: review.bonusEligible || false,
            bonusPercentage: review.bonusPercentage || 0,
            status: review.status,
            goals: review.goals || [],
        });
        setOpenDialog(true);
    };

    const handleSubmit = async () => {
        if (!formData.employeeId) { setError('Please select an employee.'); return; }
        if (!formData.reviewPeriod.startDate || !formData.reviewPeriod.endDate) { setError('Please set the review period.'); return; }
        setSubmitting(true);
        try {
            // Compute overall rating
            const rVals = Object.values(formData.ratings).filter(v => v > 0);
            const overallRating = rVals.length ? Math.round((rVals.reduce((a, b) => a + b, 0) / rVals.length) * 10) / 10 : undefined;
            const payload = { ...formData, overallRating };

            if (selectedReview) {
                const res = await performanceAPI.update(selectedReview._id, payload);
                setReviews(prev => prev.map(r => r._id === selectedReview._id ? res.data : r));
            } else {
                const res = await performanceAPI.create(payload);
                setReviews(prev => [res.data, ...prev]);
            }
            setSuccess(selectedReview ? 'Review updated!' : 'Review created!');
            setOpenDialog(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save review');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this review?')) return;
        try {
            await performanceAPI.delete(id);
            setReviews(prev => prev.filter(r => r._id !== id));
            setSuccess('Review deleted');
        } catch { setError('Failed to delete'); }
    };

    const handleAcknowledge = async () => {
        if (!selectedReview) return;
        setSubmitting(true);
        try {
            const res = await performanceAPI.acknowledge(selectedReview._id, { employeeComments: ackComment });
            setReviews(prev => prev.map(r => r._id === selectedReview._id ? res.data : r));
            setSuccess('Review acknowledged!');
            setAckDialog(false);
            setViewDialog(false);
        } catch { setError('Failed to acknowledge'); } finally { setSubmitting(false); }
    };

    // ── Rating stats ─────────────────────────────────────────────────────────

    const submittedReviews = reviews.filter(r => r.status !== 'Draft');
    const avgRatings = {};
    RATING_CATEGORIES.forEach(cat => {
        const vals = submittedReviews.map(r => r.ratings?.[cat]).filter(v => v > 0);
        avgRatings[cat] = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 0;
    });
    const overallAvg = submittedReviews.length
        ? (submittedReviews.reduce((s, r) => s + (r.overallRating || 0), 0) / submittedReviews.length).toFixed(1)
        : 0;

    // Top performers (highest overallRating, submitted)
    const topPerformers = [...submittedReviews]
        .sort((a, b) => (b.overallRating || 0) - (a.overallRating || 0))
        .slice(0, 5);

    // Promotion-eligible
    const promotionList = reviews.filter(r => r.promotionEligible);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 3 }, mb: 4, px: { xs: 1, sm: 2, md: 3 } }}>
            {/* Page Header */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, gap: 2 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Grade sx={{ color: 'primary.main', fontSize: 32 }} />
                        Performance Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {reviews.length} total reviews · {promotionList.length} promotion-eligible
                    </Typography>
                </Box>
                {isHR && (
                    <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
                        New Review
                    </Button>
                )}
            </Box>

            {/* Alerts */}
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

            {/* Stats row */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Total Reviews', value: reviews.length, color: '#3b82f6', bg: '#eff6ff', icon: <PendingActions /> },
                    { label: 'Submitted', value: reviews.filter(r => r.status === 'Submitted').length, color: '#d97706', bg: '#fff7ed', icon: <HourglassEmpty /> },
                    { label: 'Acknowledged', value: reviews.filter(r => r.status === 'Acknowledged').length, color: '#16a34a', bg: '#f0fdf4', icon: <CheckCircle /> },
                    isHR && { label: 'Promotion Eligible', value: promotionList.length, color: '#7c3aed', bg: '#f5f3ff', icon: <WorkspacePremium /> },
                ].filter(Boolean).map(stat => (
                    <Grid item xs={6} md={3} key={stat.label}>
                        <Card sx={{ borderTop: `4px solid ${stat.color}`, bgcolor: stat.bg }}>
                            <CardContent sx={{ py: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" fontWeight={600}>{stat.label}</Typography>
                                        <Typography variant="h4" fontWeight={700} sx={{ color: stat.color }}>{stat.value}</Typography>
                                    </Box>
                                    <Box sx={{ bgcolor: stat.color + '20', borderRadius: 2, p: 1, color: stat.color }}>{stat.icon}</Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Tabs */}
            <Paper elevation={2} sx={{ mb: 3 }}>
                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab label="📋 Reviews" />
                    {isHR && <Tab label="⭐ Ratings Dashboard" />}
                    {isHR && <Tab label="🏆 Promotions" />}
                </Tabs>
            </Paper>

            {/* ── Tab 0: Reviews ─────────────────────────────────────────── */}
            {tab === 0 && (
                <Paper elevation={2}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
                    ) : (
                        <TableContainer sx={{ overflowX: 'auto' }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'primary.main' }}>
                                        {['Employee', 'Review Type', 'Period', 'Overall Rating', 'Promotion', 'Status', 'Actions'].map(h => (
                                            <TableCell key={h} sx={{ color: 'white', fontWeight: 700 }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {reviews.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                                <Grade sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                                <Typography color="text.secondary">No performance reviews yet.</Typography>
                                                {isHR && <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ mt: 2 }}>Create First Review</Button>}
                                            </TableCell>
                                        </TableRow>
                                    ) : reviews.map(review => {
                                        const emp = review.employeeId;
                                        const name = emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
                                        const start = review.reviewPeriod?.startDate ? new Date(review.reviewPeriod.startDate).toLocaleDateString('en-IN') : '';
                                        const end = review.reviewPeriod?.endDate ? new Date(review.reviewPeriod.endDate).toLocaleDateString('en-IN') : '';
                                        return (
                                            <TableRow key={review._id} hover>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontSize: 12 }}>
                                                            {name.charAt(0)}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={600}>{name}</Typography>
                                                            <Typography variant="caption" color="text.secondary">{emp?.department}</Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell><Chip label={review.reviewType} size="small" variant="outlined" /></TableCell>
                                                <TableCell><Typography variant="caption">{start} – {end}</Typography></TableCell>
                                                <TableCell>
                                                    {review.overallRating ? (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Star sx={{ fontSize: 16, color: '#f59e0b' }} />
                                                            <Typography fontWeight={700} sx={{ color: ratingColor(review.overallRating) }}>
                                                                {review.overallRating}/5
                                                            </Typography>
                                                        </Box>
                                                    ) : '—'}
                                                </TableCell>
                                                <TableCell>
                                                    {review.promotionEligible
                                                        ? <Chip icon={<WorkspacePremium />} label="Eligible" size="small" color="secondary" />
                                                        : <Typography variant="caption" color="text.secondary">—</Typography>
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={review.status} size="small" color={statusColor(review.status)} />
                                                </TableCell>
                                                <TableCell>
                                                    <Stack direction="row" spacing={0.5}>
                                                        <Tooltip title="View">
                                                            <IconButton size="small" color="primary" onClick={() => { setSelectedReview(review); setViewDialog(true); }}>
                                                                <Visibility fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        {isHR && (
                                                            <>
                                                                <Tooltip title="Edit">
                                                                    <IconButton size="small" color="info" onClick={() => openEdit(review)}>
                                                                        <Edit fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Delete">
                                                                    <IconButton size="small" color="error" onClick={() => handleDelete(review._id)}>
                                                                        <Delete fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </>
                                                        )}
                                                        {!isHR && review.status === 'Submitted' && (
                                                            <Tooltip title="Acknowledge">
                                                                <IconButton size="small" color="success" onClick={() => { setSelectedReview(review); setAckComment(''); setAckDialog(true); }}>
                                                                    <ThumbUp fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            )}

            {/* ── Tab 1: Ratings Dashboard ───────────────────────────────── */}
            {tab === 1 && isHR && (
                <Grid container spacing={3}>
                    {/* Overall Avg */}
                    <Grid item xs={12} md={4}>
                        <Paper elevation={2} sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                            <Typography variant="h6" fontWeight={700} gutterBottom>Overall Average Rating</Typography>
                            <Typography variant="h2" fontWeight={800} sx={{ color: ratingColor(parseFloat(overallAvg)), lineHeight: 1 }}>
                                {overallAvg || '—'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {overallAvg ? RATING_LABELS[Math.round(overallAvg)] : 'No data'}
                            </Typography>
                            <Rating value={parseFloat(overallAvg) || 0} max={5} precision={0.1} readOnly sx={{ color: '#f59e0b' }} />
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="body2" color="text.secondary">Based on {submittedReviews.length} submitted reviews</Typography>
                        </Paper>
                    </Grid>

                    {/* Category Breakdown */}
                    <Grid item xs={12} md={8}>
                        <Paper elevation={2} sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={700} gutterBottom>Rating Breakdown by Category</Typography>
                            <Grid container spacing={2}>
                                {RATING_CATEGORIES.map(cat => {
                                    const val = parseFloat(avgRatings[cat]);
                                    const pct = (val / 5) * 100;
                                    return (
                                        <Grid item xs={12} key={cat}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography sx={{ minWidth: 130, textTransform: 'capitalize', fontWeight: 600 }}>
                                                    {RATING_ICONS[cat]} {cat}
                                                </Typography>
                                                <Box sx={{ flex: 1 }}>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={pct || 0}
                                                        sx={{
                                                            height: 12,
                                                            borderRadius: 6,
                                                            bgcolor: '#f1f5f9',
                                                            '& .MuiLinearProgress-bar': {
                                                                borderRadius: 6,
                                                                bgcolor: ratingColor(val),
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                                <Typography fontWeight={700} sx={{ minWidth: 36, color: ratingColor(val) }}>
                                                    {val || '—'}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Top Performers */}
                    <Grid item xs={12}>
                        <Paper elevation={2} sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EmojiEvents sx={{ color: '#f59e0b' }} /> Top Performers
                            </Typography>
                            {topPerformers.length === 0 ? (
                                <Typography color="text.secondary">No submitted reviews yet.</Typography>
                            ) : (
                                <Grid container spacing={2}>
                                    {topPerformers.map((review, idx) => {
                                        const emp = review.employeeId;
                                        const name = emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
                                        const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                                        return (
                                            <Grid item xs={12} sm={6} md={4} key={review._id}>
                                                <Box sx={{
                                                    p: 2, borderRadius: 2, border: '1px solid',
                                                    borderColor: idx === 0 ? '#fbbf24' : 'divider',
                                                    bgcolor: idx === 0 ? '#fffbeb' : 'background.paper',
                                                    display: 'flex', alignItems: 'center', gap: 2
                                                }}>
                                                    <Typography variant="h4">{medals[idx]}</Typography>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography fontWeight={700}>{name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{emp?.department} · {review.reviewType}</Typography>
                                                    </Box>
                                                    <Box sx={{ textAlign: 'center' }}>
                                                        <Typography variant="h6" fontWeight={800} sx={{ color: ratingColor(review.overallRating) }}>
                                                            {review.overallRating}
                                                        </Typography>
                                                        <Typography variant="caption">/ 5</Typography>
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* ── Tab 2: Promotions ─────────────────────────────────────── */}
            {tab === 2 && isHR && (
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Paper elevation={2} sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <WorkspacePremium sx={{ color: '#7c3aed' }} /> Promotion-Eligible Employees
                            </Typography>
                            {promotionList.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 6 }}>
                                    <WorkspacePremium sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
                                    <Typography color="text.secondary">No employees marked as promotion-eligible yet.</Typography>
                                    {isHR && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        Mark "Promotion Eligible" when creating or editing a review.
                                    </Typography>}
                                </Box>
                            ) : (
                                <Grid container spacing={2}>
                                    {promotionList.map(review => {
                                        const emp = review.employeeId;
                                        const name = emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
                                        const rating = review.overallRating;
                                        return (
                                            <Grid item xs={12} sm={6} md={4} key={review._id}>
                                                <Card sx={{
                                                    border: '2px solid #7c3aed',
                                                    borderRadius: 3,
                                                    position: 'relative',
                                                    overflow: 'visible',
                                                    '&:hover': { boxShadow: 6 },
                                                    transition: 'box-shadow 0.2s'
                                                }}>
                                                    <Box sx={{
                                                        position: 'absolute', top: -12, right: 12,
                                                        bgcolor: '#7c3aed', color: 'white',
                                                        px: 1.5, py: 0.25, borderRadius: 2, fontSize: 12, fontWeight: 700
                                                    }}>
                                                        🏆 Promotion Ready
                                                    </Box>
                                                    <CardContent>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                            <Avatar sx={{ bgcolor: '#7c3aed', width: 44, height: 44 }}>
                                                                {name.charAt(0)}
                                                            </Avatar>
                                                            <Box>
                                                                <Typography fontWeight={700}>{name}</Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {emp?.employeeId} · {emp?.designation}
                                                                </Typography>
                                                            </Box>
                                                        </Box>

                                                        <Grid container spacing={1}>
                                                            <Grid item xs={6}>
                                                                <Typography variant="caption" color="text.secondary">Department</Typography>
                                                                <Typography variant="body2" fontWeight={600}>{emp?.department || '—'}</Typography>
                                                            </Grid>
                                                            <Grid item xs={6}>
                                                                <Typography variant="caption" color="text.secondary">Review Type</Typography>
                                                                <Typography variant="body2" fontWeight={600}>{review.reviewType}</Typography>
                                                            </Grid>
                                                            <Grid item xs={6}>
                                                                <Typography variant="caption" color="text.secondary">Rating</Typography>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                    <Star sx={{ fontSize: 14, color: '#f59e0b' }} />
                                                                    <Typography fontWeight={700} sx={{ color: ratingColor(rating) }}>
                                                                        {rating || '—'}/5
                                                                    </Typography>
                                                                </Box>
                                                            </Grid>
                                                            <Grid item xs={6}>
                                                                <Typography variant="caption" color="text.secondary">Bonus</Typography>
                                                                <Typography variant="body2" fontWeight={600}>
                                                                    {review.bonusEligible ? `${review.bonusPercentage}%` : 'None'}
                                                                </Typography>
                                                            </Grid>
                                                        </Grid>

                                                        {review.strengths && (
                                                            <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2 }}>
                                                                <Typography variant="caption" color="text.secondary">Strengths</Typography>
                                                                <Typography variant="body2">{review.strengths}</Typography>
                                                            </Box>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* ══ Create / Edit Dialog ════════════════════════════════════════ */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {selectedReview ? 'Edit Performance Review' : 'New Performance Review'}
                    <IconButton onClick={() => setOpenDialog(false)} size="small"><Close /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} sx={{ pt: 1 }}>
                        {/* Employee */}
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Employee</InputLabel>
                                <Select
                                    value={formData.employeeId}
                                    label="Employee"
                                    onChange={e => setFormData(p => ({ ...p, employeeId: e.target.value }))}
                                >
                                    {employees.map(emp => (
                                        <MenuItem key={emp._id} value={emp._id}>
                                            {emp.firstName} {emp.lastName} — {emp.employeeId}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Review Type */}
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Review Type</InputLabel>
                                <Select
                                    value={formData.reviewType}
                                    label="Review Type"
                                    onChange={e => setFormData(p => ({ ...p, reviewType: e.target.value }))}
                                >
                                    {REVIEW_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Dates */}
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth type="date" label="Period Start" InputLabelProps={{ shrink: true }}
                                value={formData.reviewPeriod.startDate}
                                onChange={e => setFormData(p => ({ ...p, reviewPeriod: { ...p.reviewPeriod, startDate: e.target.value } }))}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth type="date" label="Period End" InputLabelProps={{ shrink: true }}
                                value={formData.reviewPeriod.endDate}
                                onChange={e => setFormData(p => ({ ...p, reviewPeriod: { ...p.reviewPeriod, endDate: e.target.value } }))}
                            />
                        </Grid>

                        {/* Ratings */}
                        <Grid item xs={12}>
                            <Divider sx={{ mb: 1 }}><Chip label="⭐ Performance Ratings" size="small" /></Divider>
                            <Grid container spacing={2}>
                                {RATING_CATEGORIES.map(cat => (
                                    <Grid item xs={12} sm={6} key={cat}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                            <Typography fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                                                {RATING_ICONS[cat]} {cat}
                                            </Typography>
                                            <Box>
                                                <StarRating
                                                    value={formData.ratings[cat] || 0}
                                                    onChange={v => setFormData(p => ({ ...p, ratings: { ...p.ratings, [cat]: v } }))}
                                                />
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right' }}>
                                                    {RATING_LABELS[formData.ratings[cat]] || 'Not rated'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Grid>

                        {/* Text fields */}
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth multiline rows={3} label="Strengths"
                                value={formData.strengths}
                                onChange={e => setFormData(p => ({ ...p, strengths: e.target.value }))}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth multiline rows={3} label="Areas of Improvement"
                                value={formData.areasOfImprovement}
                                onChange={e => setFormData(p => ({ ...p, areasOfImprovement: e.target.value }))}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth multiline rows={2} label="HR Comments"
                                value={formData.comments}
                                onChange={e => setFormData(p => ({ ...p, comments: e.target.value }))}
                            />
                        </Grid>

                        {/* Checkboxes */}
                        <Grid item xs={12}>
                            <Divider sx={{ mb: 1 }}><Chip label="🏆 Eligibility" size="small" /></Divider>
                            <Stack direction="row" spacing={3} flexWrap="wrap">
                                <FormControlLabel
                                    control={<Checkbox checked={formData.promotionEligible} onChange={e => setFormData(p => ({ ...p, promotionEligible: e.target.checked }))} color="secondary" />}
                                    label="Promotion Eligible"
                                />
                                <FormControlLabel
                                    control={<Checkbox checked={formData.bonusEligible} onChange={e => setFormData(p => ({ ...p, bonusEligible: e.target.checked }))} color="success" />}
                                    label="Bonus Eligible"
                                />
                                {formData.bonusEligible && (
                                    <TextField
                                        size="small" type="number" label="Bonus %" sx={{ width: 120 }}
                                        value={formData.bonusPercentage}
                                        onChange={e => setFormData(p => ({ ...p, bonusPercentage: e.target.value }))}
                                        inputProps={{ min: 0, max: 100 }}
                                    />
                                )}
                            </Stack>
                        </Grid>

                        {/* Status */}
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select value={formData.status} label="Status"
                                    onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}>
                                    <MenuItem value="Draft">Draft</MenuItem>
                                    <MenuItem value="Submitted">Submitted (visible to employee)</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, gap: 1 }}>
                    <Button onClick={() => setOpenDialog(false)} variant="outlined">Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={submitting} startIcon={submitting ? <CircularProgress size={16} /> : null}>
                        {selectedReview ? 'Update Review' : 'Create Review'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ══ View Dialog ════════════════════════════════════════════════ */}
            <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                {selectedReview && (
                    <>
                        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Performance Review Details
                            <IconButton onClick={() => setViewDialog(false)} size="small"><Close /></IconButton>
                        </DialogTitle>
                        <DialogContent dividers>
                            {/* Employee info */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                                    {selectedReview.employeeId?.firstName?.charAt(0)}
                                </Avatar>
                                <Box>
                                    <Typography fontWeight={700}>
                                        {selectedReview.employeeId?.firstName} {selectedReview.employeeId?.lastName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {selectedReview.employeeId?.designation} · {selectedReview.employeeId?.department}
                                    </Typography>
                                </Box>
                                <Box sx={{ ml: 'auto' }}>
                                    <Chip label={selectedReview.status} color={statusColor(selectedReview.status)} />
                                </Box>
                            </Box>

                            <Grid container spacing={1} sx={{ mb: 2 }}>
                                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Review Type</Typography><Typography fontWeight={600}>{selectedReview.reviewType}</Typography></Grid>
                                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Overall Rating</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Star sx={{ fontSize: 16, color: '#f59e0b' }} />
                                        <Typography fontWeight={700} sx={{ color: ratingColor(selectedReview.overallRating) }}>
                                            {selectedReview.overallRating || '—'}/5
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 1 }} />
                            <Typography fontWeight={700} sx={{ mb: 1 }}>⭐ Ratings</Typography>
                            {RATING_CATEGORIES.map(cat => (
                                <Box key={cat} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                    <Typography variant="body2" sx={{ minWidth: 130, textTransform: 'capitalize' }}>
                                        {RATING_ICONS[cat]} {cat}
                                    </Typography>
                                    <StarRating value={selectedReview.ratings?.[cat] || 0} readOnly />
                                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                        ({selectedReview.ratings?.[cat] || 0}/5)
                                    </Typography>
                                </Box>
                            ))}

                            {selectedReview.strengths && (<><Divider sx={{ my: 1 }} /><Typography variant="caption" color="text.secondary">Strengths</Typography><Typography variant="body2">{selectedReview.strengths}</Typography></>)}
                            {selectedReview.areasOfImprovement && (<><Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>Areas of Improvement</Typography><Typography variant="body2">{selectedReview.areasOfImprovement}</Typography></>)}
                            {selectedReview.comments && (<><Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>HR Comments</Typography><Typography variant="body2">{selectedReview.comments}</Typography></>)}
                            {selectedReview.employeeComments && (<Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2 }}><Typography variant="caption" color="text.secondary">Employee Acknowledgement</Typography><Typography variant="body2">{selectedReview.employeeComments}</Typography></Box>)}

                            {(selectedReview.promotionEligible || selectedReview.bonusEligible) && (
                                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {selectedReview.promotionEligible && <Chip icon={<WorkspacePremium />} label="Promotion Eligible" color="secondary" />}
                                    {selectedReview.bonusEligible && <Chip icon={<Star />} label={`Bonus: ${selectedReview.bonusPercentage}%`} color="success" />}
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions sx={{ p: 2 }}>
                            {!isHR && selectedReview.status === 'Submitted' && (
                                <Button variant="contained" color="success" startIcon={<ThumbUp />}
                                    onClick={() => { setAckComment(''); setAckDialog(true); }}>
                                    Acknowledge
                                </Button>
                            )}
                            <Button onClick={() => setViewDialog(false)} variant="outlined">Close</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* ══ Acknowledge Dialog ════════════════════════════════════════ */}
            <Dialog open={ackDialog} onClose={() => setAckDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle fontWeight={700}>Acknowledge Review</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        By acknowledging, you confirm that you have read and understood your performance review.
                    </Typography>
                    <TextField
                        fullWidth multiline rows={3}
                        label="Your Comments (optional)"
                        value={ackComment}
                        onChange={e => setAckComment(e.target.value)}
                        placeholder="Share your thoughts on this review..."
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => setAckDialog(false)} variant="outlined">Cancel</Button>
                    <Button onClick={handleAcknowledge} variant="contained" color="success" disabled={submitting} startIcon={<CheckCircle />}>
                        Acknowledge
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default PerformanceManagement;
