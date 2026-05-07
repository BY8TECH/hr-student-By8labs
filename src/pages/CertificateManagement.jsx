import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Paper, Tabs, Tab, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Tooltip, Chip,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
    TextField, Grid, Typography, Divider, CircularProgress, Alert,
    Snackbar, Stack, MenuItem, InputAdornment, Avatar
} from '@mui/material';
import {
    Add, Delete, Edit, GetApp, Visibility, Description,
    WorkOutline, Close, Save, Search, Article, BadgeOutlined
} from '@mui/icons-material';

const API = import.meta.env.VITE_API_URL || '/api/hr';

/* ─────────────── helpers ─────────────── */
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const authHeaders = () => {
    const token = localStorage.getItem('token');
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

/* ══════════════════════════════════════════════════════
   EXPERIENCE LETTER SECTION
══════════════════════════════════════════════════════ */
const EXP_DEFAULTS = {
    employeeName: '', employeeId: '', jobRole: '', companyName: '', companyAddress: '',
    companyPhone: '', companyEmail: '', companyWebsite: '',
    hrManagerName: '', companyLogo: '', dateOfJoining: '', lastWorkingDate: '',
    totalExperience: '', rolesResponsibilities: '', department: '', skillsTechnologies: '',
    certificationText: '', workPerformance: '', conduct: ''
};

function ExperienceLetterTab() {
    const [letters, setLetters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [viewData, setViewData] = useState(null);
    const [form, setForm] = useState(EXP_DEFAULTS);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

    const showSnack = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const r = await fetch(`${API}/experience-letters`, { headers: authHeaders() });
            const d = await r.json();
            setLetters(Array.isArray(d) ? d : []);
        } catch { showSnack('Failed to load letters', 'error'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const openCreate = () => { setForm(EXP_DEFAULTS); setEditing(false); setFormOpen(true); };
    const openEdit = async (id) => {
        try {
            const r = await fetch(`${API}/experience-letters/${id}`, { headers: authHeaders() });
            const d = await r.json();
            const fmt = (date) => date ? new Date(date).toISOString().split('T')[0] : '';
            setForm({ ...EXP_DEFAULTS, ...d, dateOfJoining: fmt(d.dateOfJoining), lastWorkingDate: fmt(d.lastWorkingDate) });
            setSelectedId(id);
            setEditing(true);
            setFormOpen(true);
        } catch { showSnack('Failed to load letter', 'error'); }
    };

    const openView = async (id) => {
        try {
            const r = await fetch(`${API}/experience-letters/${id}`, { headers: authHeaders() });
            const d = await r.json();
            setViewData(d);
            setViewOpen(true);
        } catch { showSnack('Failed to load letter', 'error'); }
    };

    const openDelete = (id) => { setSelectedId(id); setDeleteOpen(true); };

    const handleSave = async () => {
        if (!form.employeeName || !form.jobRole || !form.companyName || !form.companyAddress || !form.hrManagerName || !form.dateOfJoining || !form.lastWorkingDate || !form.totalExperience) {
            showSnack('Please fill all required fields', 'warning'); return;
        }
        setSaving(true);
        try {
            const url = editing ? `${API}/experience-letters/${selectedId}` : `${API}/experience-letters`;
            const method = editing ? 'PUT' : 'POST';
            const r = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) });
            if (!r.ok) throw new Error();
            showSnack(editing ? 'Letter updated!' : 'Letter created!');
            setFormOpen(false);
            fetchAll();
        } catch { showSnack('Save failed', 'error'); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        try {
            await fetch(`${API}/experience-letters/${selectedId}`, { method: 'DELETE', headers: authHeaders() });
            showSnack('Deleted successfully');
            setDeleteOpen(false);
            fetchAll();
        } catch { showSnack('Delete failed', 'error'); }
    };

    const handleDownload = async (id, name) => {
        try {
            const r = await fetch(`${API}/experience-letters/${id}/download-pdf`, { headers: authHeaders() });
            const blob = await r.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `experience_letter_${name}.pdf`; a.click();
            URL.revokeObjectURL(url);
        } catch { showSnack('PDF download failed', 'error'); }
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setForm(f => ({ ...f, companyLogo: ev.target.result }));
        reader.readAsDataURL(file);
    };

    const filtered = letters.filter(l =>
        l.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
        l.jobRole?.toLowerCase().includes(search.toLowerCase()) ||
        l.companyName?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Box>
            {/* Toolbar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <TextField size="small" placeholder="Search by name, role, company…"
                    value={search} onChange={e => setSearch(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }}
                    sx={{ width: 280 }} />
                <Button variant="contained" startIcon={<Add />} onClick={openCreate} id="exp-create-btn">
                    Create Experience Letter
                </Button>
            </Box>

            {/* Table */}
            <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell>Employee Name</TableCell>
                            <TableCell>Designation</TableCell>
                            <TableCell>Company</TableCell>
                            <TableCell>DOJ</TableCell>
                            <TableCell>Last Working Day</TableCell>
                            <TableCell>Experience</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={8} align="center"><CircularProgress size={24} sx={{ my: 2 }} /></TableCell></TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>No experience letters found. Click "Create" to add one.</TableCell></TableRow>
                        ) : filtered.map((l, i) => (
                            <TableRow key={l._id} hover>
                                <TableCell>{i + 1}</TableCell>
                                <TableCell><Typography fontWeight={600} fontSize="0.875rem">{l.employeeName}</Typography></TableCell>
                                <TableCell><Chip label={l.jobRole} size="small" color="primary" variant="outlined" /></TableCell>
                                <TableCell>{l.companyName}</TableCell>
                                <TableCell>{fmtDate(l.dateOfJoining)}</TableCell>
                                <TableCell>{fmtDate(l.lastWorkingDate)}</TableCell>
                                <TableCell><Chip label={l.totalExperience} size="small" sx={{ bgcolor: '#d1fae5', color: '#065f46' }} /></TableCell>
                                <TableCell align="center">
                                    <Stack direction="row" spacing={0.5} justifyContent="center">
                                        <Tooltip title="View"><IconButton size="small" color="info" onClick={() => openView(l._id)} id={`el-view-${l._id}`}><Visibility fontSize="small" /></IconButton></Tooltip>
                                        <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => openEdit(l._id)} id={`el-edit-${l._id}`}><Edit fontSize="small" /></IconButton></Tooltip>
                                        <Tooltip title="Download PDF"><IconButton size="small" color="success" onClick={() => handleDownload(l._id, l.employeeName)} id={`el-dl-${l._id}`}><GetApp fontSize="small" /></IconButton></Tooltip>
                                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => openDelete(l._id)} id={`el-del-${l._id}`}><Delete fontSize="small" /></IconButton></Tooltip>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create/Edit Dialog */}
            <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth scroll="paper">
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'white', py: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Description />
                        <Typography fontWeight={700}>{editing ? 'Edit Experience Letter' : 'Create Experience Letter'}</Typography>
                    </Box>
                    <IconButton onClick={() => setFormOpen(false)} sx={{ color: 'white' }}><Close /></IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    <Grid container spacing={2.5}>
                        {/* Employee Details */}
                        <Grid item xs={12}><Typography variant="subtitle1" fontWeight={700} color="primary.dark" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><BadgeOutlined fontSize="small" /> Employee Details</Typography><Divider sx={{ mt: 0.5 }} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth required label="Full Name" value={form.employeeName} onChange={e => setForm(f => ({ ...f, employeeName: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Employee ID (optional)" value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth required label="Job Role / Designation" value={form.jobRole} onChange={e => setForm(f => ({ ...f, jobRole: e.target.value }))} /></Grid>

                        {/* Company Details */}
                        <Grid item xs={12}><Typography variant="subtitle1" fontWeight={700} color="primary.dark" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}><WorkOutline fontSize="small" /> Company Details</Typography><Divider sx={{ mt: 0.5 }} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth required label="Company Name" value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth required label="Company Address" value={form.companyAddress} onChange={e => setForm(f => ({ ...f, companyAddress: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={4}><TextField fullWidth label="Company Phone" value={form.companyPhone} onChange={e => setForm(f => ({ ...f, companyPhone: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={4}><TextField fullWidth label="Company Email" value={form.companyEmail} onChange={e => setForm(f => ({ ...f, companyEmail: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={4}><TextField fullWidth label="Company Website" value={form.companyWebsite} onChange={e => setForm(f => ({ ...f, companyWebsite: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth required label="HR / Manager Name" value={form.hrManagerName} onChange={e => setForm(f => ({ ...f, hrManagerName: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={6}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Company Logo (optional)</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                    {form.companyLogo && <Avatar src={form.companyLogo} variant="rounded" sx={{ width: 40, height: 40 }} />}
                                    <Button variant="outlined" size="small" component="label">
                                        Upload Logo
                                        <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                                    </Button>
                                    {form.companyLogo && <Button size="small" color="error" onClick={() => setForm(f => ({ ...f, companyLogo: '' }))}>Remove</Button>}
                                </Box>
                            </Box>
                        </Grid>

                        {/* Employment Details */}
                        <Grid item xs={12}><Typography variant="subtitle1" fontWeight={700} color="primary.dark" sx={{ mt: 1 }}>Employment Details</Typography><Divider sx={{ mt: 0.5 }} /></Grid>
                        <Grid item xs={12} sm={4}><TextField fullWidth required label="Date of Joining" type="date" InputLabelProps={{ shrink: true }} value={form.dateOfJoining} onChange={e => setForm(f => ({ ...f, dateOfJoining: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={4}><TextField fullWidth required label="Last Working Date" type="date" InputLabelProps={{ shrink: true }} value={form.lastWorkingDate} onChange={e => setForm(f => ({ ...f, lastWorkingDate: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={4}><TextField fullWidth required label="Total Experience (e.g. 2 years 3 months)" value={form.totalExperience} onChange={e => setForm(f => ({ ...f, totalExperience: e.target.value }))} /></Grid>

                        {/* Work Details */}
                        <Grid item xs={12}><Typography variant="subtitle1" fontWeight={700} color="primary.dark" sx={{ mt: 1 }}>Work Details</Typography><Divider sx={{ mt: 0.5 }} /></Grid>
                        <Grid item xs={12}><TextField fullWidth multiline minRows={3} label="Roles & Responsibilities" value={form.rolesResponsibilities} onChange={e => setForm(f => ({ ...f, rolesResponsibilities: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Department (optional)" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Skills / Technologies (optional)" value={form.skillsTechnologies} onChange={e => setForm(f => ({ ...f, skillsTechnologies: e.target.value }))} /></Grid>

                        {/* Letter Content */}
                        <Grid item xs={12}><Typography variant="subtitle1" fontWeight={700} color="primary.dark" sx={{ mt: 1 }}>Letter Content</Typography><Divider sx={{ mt: 0.5 }} /></Grid>
                        <Grid item xs={12}><TextField fullWidth multiline minRows={3} label='Certification Text (e.g. "This is to certify that…") — leave blank for auto-generated' value={form.certificationText} onChange={e => setForm(f => ({ ...f, certificationText: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth multiline minRows={2} label="Work Performance" value={form.workPerformance} onChange={e => setForm(f => ({ ...f, workPerformance: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth multiline minRows={2} label="Conduct" value={form.conduct} onChange={e => setForm(f => ({ ...f, conduct: e.target.value }))} /></Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setFormOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}>
                        {saving ? 'Saving…' : editing ? 'Update Letter' : 'Create Letter'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
                    Experience Letter Details
                    <IconButton onClick={() => setViewOpen(false)} sx={{ color: 'white' }}><Close /></IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    {viewData && (
                        <Grid container spacing={1.5}>
                            {[
                                ['Employee Name', viewData.employeeName], ['Employee ID', viewData.employeeId],
                                ['Designation', viewData.jobRole], ['Department', viewData.department],
                                ['Company', viewData.companyName], ['HR Manager', viewData.hrManagerName],
                                ['Date of Joining', fmtDate(viewData.dateOfJoining)], ['Last Working Date', fmtDate(viewData.lastWorkingDate)],
                                ['Total Experience', viewData.totalExperience], ['Skills', viewData.skillsTechnologies],
                            ].filter(([, v]) => v).map(([label, value]) => (
                                <React.Fragment key={label}>
                                    <Grid item xs={5}><Typography variant="body2" color="text.secondary" fontWeight={600}>{label}</Typography></Grid>
                                    <Grid item xs={7}><Typography variant="body2">{value}</Typography></Grid>
                                </React.Fragment>
                            ))}
                            {viewData.rolesResponsibilities && <>
                                <Grid item xs={12}><Divider sx={{ my: 0.5 }} /></Grid>
                                <Grid item xs={12}><Typography variant="body2" fontWeight={700} color="primary.dark">Roles & Responsibilities</Typography><Typography variant="body2">{viewData.rolesResponsibilities}</Typography></Grid>
                            </>}
                            {viewData.workPerformance && <>
                                <Grid item xs={12}><Typography variant="body2" fontWeight={700} color="primary.dark">Work Performance</Typography><Typography variant="body2">{viewData.workPerformance}</Typography></Grid>
                            </>}
                            {viewData.conduct && <>
                                <Grid item xs={12}><Typography variant="body2" fontWeight={700} color="primary.dark">Conduct</Typography><Typography variant="body2">{viewData.conduct}</Typography></Grid>
                            </>}
                        </Grid>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs">
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent><DialogContentText>Are you sure you want to delete this experience letter? This cannot be undone.</DialogContentText></DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} elevation={6}>{snack.msg}</Alert>
            </Snackbar>
        </Box>
    );
}

/* ══════════════════════════════════════════════════════
   OFFER LETTER SECTION
══════════════════════════════════════════════════════ */
const OFF_DEFAULTS = {
    candidateName: '', candidateAddress: '', candidateEmail: '', candidatePhone: '',
    companyName: '', companyAddress: '', companyPhone: '', companyEmail: '', companyWebsite: '',
    hrName: '', companyLogo: '',
    jobRole: '', department: '', workLocation: '', employmentType: 'Full-Time',
    offerDate: '', joiningDate: '', probationPeriod: '',
    salary: '', ctcBreakdown: '', paymentCycle: 'Monthly',
    workingHours: '', leavePolicy: '', noticePeriod: '', companyRules: '',
    offerConfirmationText: '', acceptanceInstruction: ''
};

function OfferLetterTab() {
    const [letters, setLetters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [viewData, setViewData] = useState(null);
    const [form, setForm] = useState(OFF_DEFAULTS);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

    const showSnack = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const r = await fetch(`${API}/offer-letters-hr`, { headers: authHeaders() });
            const d = await r.json();
            setLetters(Array.isArray(d) ? d : []);
        } catch { showSnack('Failed to load letters', 'error'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const openCreate = () => { setForm(OFF_DEFAULTS); setEditing(false); setFormOpen(true); };
    const openEdit = async (id) => {
        try {
            const r = await fetch(`${API}/offer-letters-hr/${id}`, { headers: authHeaders() });
            const d = await r.json();
            const fmt = (date) => date ? new Date(date).toISOString().split('T')[0] : '';
            setForm({ ...OFF_DEFAULTS, ...d, offerDate: fmt(d.offerDate), joiningDate: fmt(d.joiningDate) });
            setSelectedId(id);
            setEditing(true);
            setFormOpen(true);
        } catch { showSnack('Failed to load letter', 'error'); }
    };

    const openView = async (id) => {
        try {
            const r = await fetch(`${API}/offer-letters-hr/${id}`, { headers: authHeaders() });
            const d = await r.json();
            setViewData(d);
            setViewOpen(true);
        } catch { showSnack('Failed to load letter', 'error'); }
    };

    const openDelete = (id) => { setSelectedId(id); setDeleteOpen(true); };

    const handleSave = async () => {
        if (!form.candidateName || !form.companyName || !form.companyAddress || !form.hrName || !form.jobRole || !form.department || !form.offerDate || !form.joiningDate || !form.salary) {
            showSnack('Please fill all required fields', 'warning'); return;
        }
        setSaving(true);
        try {
            const url = editing ? `${API}/offer-letters-hr/${selectedId}` : `${API}/offer-letters-hr`;
            const method = editing ? 'PUT' : 'POST';
            const r = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) });
            if (!r.ok) throw new Error();
            showSnack(editing ? 'Offer letter updated!' : 'Offer letter created!');
            setFormOpen(false);
            fetchAll();
        } catch { showSnack('Save failed', 'error'); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        try {
            await fetch(`${API}/offer-letters-hr/${selectedId}`, { method: 'DELETE', headers: authHeaders() });
            showSnack('Deleted successfully');
            setDeleteOpen(false);
            fetchAll();
        } catch { showSnack('Delete failed', 'error'); }
    };

    const handleDownload = async (id, name) => {
        try {
            showSnack('Generating PDF…', 'info');
            const r = await fetch(`${API}/offer-letters-hr/${id}/download-pdf`, { headers: authHeaders() });
            if (!r.ok) {
                const errJson = await r.json().catch(() => ({ message: `HTTP ${r.status}` }));
                showSnack(`Download failed: ${errJson.message || r.statusText}`, 'error');
                return;
            }
            const blob = await r.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `offer_letter_${(name || 'candidate').replace(/\s/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            showSnack('PDF downloaded!', 'success');
        } catch (err) {
            showSnack(`PDF download failed: ${err.message}`, 'error');
        }
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setForm(f => ({ ...f, companyLogo: ev.target.result }));
        reader.readAsDataURL(file);
    };

    const filtered = letters.filter(l =>
        l.candidateName?.toLowerCase().includes(search.toLowerCase()) ||
        l.jobRole?.toLowerCase().includes(search.toLowerCase()) ||
        l.companyName?.toLowerCase().includes(search.toLowerCase())
    );

    const empTypes = ['Full-Time', 'Part-Time', 'Contract', 'Internship'];
    const payCycles = ['Monthly', 'Weekly', 'Bi-Weekly', 'Quarterly'];

    return (
        <Box>
            {/* Toolbar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <TextField size="small" placeholder="Search by name, role, company…"
                    value={search} onChange={e => setSearch(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }}
                    sx={{ width: 280 }} />
                <Button variant="contained" startIcon={<Add />} onClick={openCreate} id="off-create-btn">
                    Create Offer Letter
                </Button>
            </Box>

            {/* Table */}
            <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell>Candidate Name</TableCell>
                            <TableCell>Designation</TableCell>
                            <TableCell>Company</TableCell>
                            <TableCell>Department</TableCell>
                            <TableCell>Offer Date</TableCell>
                            <TableCell>Joining Date</TableCell>
                            <TableCell>Salary</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={9} align="center"><CircularProgress size={24} sx={{ my: 2 }} /></TableCell></TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>No offer letters found. Click "Create" to add one.</TableCell></TableRow>
                        ) : filtered.map((l, i) => (
                            <TableRow key={l._id} hover>
                                <TableCell>{i + 1}</TableCell>
                                <TableCell><Typography fontWeight={600} fontSize="0.875rem">{l.candidateName}</Typography></TableCell>
                                <TableCell><Chip label={l.jobRole} size="small" color="primary" variant="outlined" /></TableCell>
                                <TableCell>{l.companyName}</TableCell>
                                <TableCell>{l.department}</TableCell>
                                <TableCell>{fmtDate(l.offerDate)}</TableCell>
                                <TableCell>{fmtDate(l.joiningDate)}</TableCell>
                                <TableCell><Chip label={l.salary} size="small" sx={{ bgcolor: '#d1fae5', color: '#065f46' }} /></TableCell>
                                <TableCell align="center">
                                    <Stack direction="row" spacing={0.5} justifyContent="center">
                                        <Tooltip title="View"><IconButton size="small" color="info" onClick={() => openView(l._id)} id={`ol-view-${l._id}`}><Visibility fontSize="small" /></IconButton></Tooltip>
                                        <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => openEdit(l._id)} id={`ol-edit-${l._id}`}><Edit fontSize="small" /></IconButton></Tooltip>
                                        <Tooltip title="Download PDF"><IconButton size="small" color="success" onClick={() => handleDownload(l._id, l.candidateName)} id={`ol-dl-${l._id}`}><GetApp fontSize="small" /></IconButton></Tooltip>
                                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => openDelete(l._id)} id={`ol-del-${l._id}`}><Delete fontSize="small" /></IconButton></Tooltip>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create/Edit Dialog */}
            <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth scroll="paper">
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'white', py: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Article />
                        <Typography fontWeight={700}>{editing ? 'Edit Offer Letter' : 'Create Offer Letter'}</Typography>
                    </Box>
                    <IconButton onClick={() => setFormOpen(false)} sx={{ color: 'white' }}><Close /></IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    <Grid container spacing={2.5}>
                        {/* Candidate Details */}
                        <Grid item xs={12}><Typography variant="subtitle1" fontWeight={700} color="primary.dark" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><BadgeOutlined fontSize="small" /> Candidate Details</Typography><Divider sx={{ mt: 0.5 }} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth required label="Full Name" value={form.candidateName} onChange={e => setForm(f => ({ ...f, candidateName: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Address (optional)" value={form.candidateAddress} onChange={e => setForm(f => ({ ...f, candidateAddress: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Email" type="email" value={form.candidateEmail} onChange={e => setForm(f => ({ ...f, candidateEmail: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Phone" value={form.candidatePhone} onChange={e => setForm(f => ({ ...f, candidatePhone: e.target.value }))} /></Grid>

                        {/* Company Details */}
                        <Grid item xs={12}><Typography variant="subtitle1" fontWeight={700} color="primary.dark" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}><WorkOutline fontSize="small" /> Company Details</Typography><Divider sx={{ mt: 0.5 }} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth required label="Company Name" value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth required label="Company Address" value={form.companyAddress} onChange={e => setForm(f => ({ ...f, companyAddress: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={4}><TextField fullWidth label="Company Phone" value={form.companyPhone} onChange={e => setForm(f => ({ ...f, companyPhone: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={4}><TextField fullWidth label="Company Email" value={form.companyEmail} onChange={e => setForm(f => ({ ...f, companyEmail: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={4}><TextField fullWidth label="Company Website" value={form.companyWebsite} onChange={e => setForm(f => ({ ...f, companyWebsite: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth required label="HR Name / Hiring Manager" value={form.hrName} onChange={e => setForm(f => ({ ...f, hrName: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={6}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Company Logo (optional)</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                    {form.companyLogo && <Avatar src={form.companyLogo} variant="rounded" sx={{ width: 40, height: 40 }} />}
                                    <Button variant="outlined" size="small" component="label">
                                        Upload Logo
                                        <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                                    </Button>
                                    {form.companyLogo && <Button size="small" color="error" onClick={() => setForm(f => ({ ...f, companyLogo: '' }))}>Remove</Button>}
                                </Box>
                            </Box>
                        </Grid>

                        {/* Job Details */}
                        <Grid item xs={12}><Typography variant="subtitle1" fontWeight={700} color="primary.dark" sx={{ mt: 1 }}>Job Details</Typography><Divider sx={{ mt: 0.5 }} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth required label="Job Role / Designation" value={form.jobRole} onChange={e => setForm(f => ({ ...f, jobRole: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth required label="Department" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Work Location" value={form.workLocation} onChange={e => setForm(f => ({ ...f, workLocation: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth select label="Employment Type" value={form.employmentType} onChange={e => setForm(f => ({ ...f, employmentType: e.target.value }))}>{empTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></Grid>

                        {/* Dates */}
                        <Grid item xs={12}><Typography variant="subtitle1" fontWeight={700} color="primary.dark" sx={{ mt: 1 }}>Dates</Typography><Divider sx={{ mt: 0.5 }} /></Grid>
                        <Grid item xs={12} sm={4}><TextField fullWidth required label="Offer Date" type="date" InputLabelProps={{ shrink: true }} value={form.offerDate} onChange={e => setForm(f => ({ ...f, offerDate: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={4}><TextField fullWidth required label="Joining Date" type="date" InputLabelProps={{ shrink: true }} value={form.joiningDate} onChange={e => setForm(f => ({ ...f, joiningDate: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={4}><TextField fullWidth label="Probation Period (e.g. 3 months)" value={form.probationPeriod} onChange={e => setForm(f => ({ ...f, probationPeriod: e.target.value }))} /></Grid>

                        {/* Salary Details */}
                        <Grid item xs={12}><Typography variant="subtitle1" fontWeight={700} color="primary.dark" sx={{ mt: 1 }}>Salary Details</Typography><Divider sx={{ mt: 0.5 }} /></Grid>
                        <Grid item xs={12} sm={4}><TextField fullWidth required label="Salary / Stipend (e.g. ₹50,000/month)" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={4}><TextField fullWidth select label="Payment Cycle" value={form.paymentCycle} onChange={e => setForm(f => ({ ...f, paymentCycle: e.target.value }))}>{payCycles.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></Grid>
                        <Grid item xs={12} sm={4}><TextField fullWidth label="CTC Breakdown (optional)" value={form.ctcBreakdown} onChange={e => setForm(f => ({ ...f, ctcBreakdown: e.target.value }))} /></Grid>

                        {/* Terms & Conditions */}
                        <Grid item xs={12}><Typography variant="subtitle1" fontWeight={700} color="primary.dark" sx={{ mt: 1 }}>Terms & Conditions</Typography><Divider sx={{ mt: 0.5 }} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Working Hours (e.g. 9 AM – 6 PM, Mon–Fri)" value={form.workingHours} onChange={e => setForm(f => ({ ...f, workingHours: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Leave Policy (e.g. 12 days/year)" value={form.leavePolicy} onChange={e => setForm(f => ({ ...f, leavePolicy: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Notice Period (e.g. 30 days)" value={form.noticePeriod} onChange={e => setForm(f => ({ ...f, noticePeriod: e.target.value }))} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Company Rules (optional)" value={form.companyRules} onChange={e => setForm(f => ({ ...f, companyRules: e.target.value }))} /></Grid>

                        {/* Letter Content */}
                        <Grid item xs={12}><Typography variant="subtitle1" fontWeight={700} color="primary.dark" sx={{ mt: 1 }}>Letter Content</Typography><Divider sx={{ mt: 0.5 }} /></Grid>
                        <Grid item xs={12}><TextField fullWidth multiline minRows={3} label="Offer Confirmation Text (leave blank for auto-generated)" value={form.offerConfirmationText} onChange={e => setForm(f => ({ ...f, offerConfirmationText: e.target.value }))} /></Grid>
                        <Grid item xs={12}><TextField fullWidth multiline minRows={2} label="Acceptance Instruction (leave blank for default)" value={form.acceptanceInstruction} onChange={e => setForm(f => ({ ...f, acceptanceInstruction: e.target.value }))} /></Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setFormOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}>
                        {saving ? 'Saving…' : editing ? 'Update Letter' : 'Create Letter'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
                    Offer Letter Details
                    <IconButton onClick={() => setViewOpen(false)} sx={{ color: 'white' }}><Close /></IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    {viewData && (
                        <Grid container spacing={1.5}>
                            {[
                                ['Candidate Name', viewData.candidateName], ['Email', viewData.candidateEmail],
                                ['Phone', viewData.candidatePhone], ['Address', viewData.candidateAddress],
                                ['Company', viewData.companyName], ['HR Manager', viewData.hrName],
                                ['Job Role', viewData.jobRole], ['Department', viewData.department],
                                ['Employment Type', viewData.employmentType], ['Work Location', viewData.workLocation],
                                ['Offer Date', fmtDate(viewData.offerDate)], ['Joining Date', fmtDate(viewData.joiningDate)],
                                ['Probation Period', viewData.probationPeriod], ['Salary', viewData.salary],
                                ['Payment Cycle', viewData.paymentCycle], ['CTC Breakdown', viewData.ctcBreakdown],
                                ['Working Hours', viewData.workingHours], ['Leave Policy', viewData.leavePolicy],
                                ['Notice Period', viewData.noticePeriod],
                            ].filter(([, v]) => v).map(([label, value]) => (
                                <React.Fragment key={label}>
                                    <Grid item xs={5}><Typography variant="body2" color="text.secondary" fontWeight={600}>{label}</Typography></Grid>
                                    <Grid item xs={7}><Typography variant="body2">{value}</Typography></Grid>
                                </React.Fragment>
                            ))}
                        </Grid>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs">
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent><DialogContentText>Are you sure you want to delete this offer letter? This cannot be undone.</DialogContentText></DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} elevation={6}>{snack.msg}</Alert>
            </Snackbar>
        </Box>
    );
}

/* ══════════════════════════════════════════════════════
   MAIN CERTIFICATE MANAGEMENT PAGE
══════════════════════════════════════════════════════ */
export default function CertificateManagement() {
    const [tab, setTab] = useState(0);

    return (
        <Box sx={{ p: { xs: 1, md: 2 } }}>
            {/* Page Header */}
            <Box sx={{
                background: 'linear-gradient(135deg, #080a09ff 0%, #0a0b0bff 100%)',
                borderRadius: 3, p: 3, mb: 3, color: 'white',
                display: 'flex', alignItems: 'center', gap: 2,
                boxShadow: '0 4px 20px rgba(59, 62, 61, 0.35)'
            }}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, p: 1.5, display: 'flex' }}>
                    <Description sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                    <Typography variant="h5" fontWeight={800}>Certificate Management</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85 }}>
                        Generate, manage and download Experience Letters &amp; Offer Letters
                    </Typography>
                </Box>
            </Box>

            {/* Tabs */}
            <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden', mb: 2 }}>
                <Tabs
                    value={tab} onChange={(_, v) => setTab(v)}
                    sx={{
                        borderBottom: 1, borderColor: 'divider',
                        '& .MuiTab-root': { py: 1.8, minHeight: 56, fontWeight: 600 },
                        '& .Mui-selected': { color: 'primary.main' },
                        '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' }
                    }}
                >
                    <Tab
                        id="tab-experience-letter"
                        icon={<Description fontSize="small" />}
                        iconPosition="start"
                        label="Experience Letter"
                    />
                    <Tab
                        id="tab-offer-letter"
                        icon={<Article fontSize="small" />}
                        iconPosition="start"
                        label="Offer Letter"
                    />
                </Tabs>
            </Paper>

            {/* Tab Content */}
            <Box>
                {tab === 0 && <ExperienceLetterTab />}
                {tab === 1 && <OfferLetterTab />}
            </Box>
        </Box>
    );
}
