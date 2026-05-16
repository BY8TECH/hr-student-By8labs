import React, { useState } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Alert, CircularProgress
} from '@mui/material';
import { Lock } from '@mui/icons-material';
import { portalAuthAPI, setStudentPortalToken } from '../../../services/studentPortalAPI';

export default function PortalConnect({ onConnect }) {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!identifier || !password) { setError('Identifier and password are required.'); return; }
        try {
            setLoading(true); setError('');
            const res = await portalAuthAPI.login({ identifier, password });
            const token = res.data?.token || res.data?.data?.token;
            if (!token) throw new Error('No token returned');
            setStudentPortalToken(token);
            onConnect();
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Check credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
            <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%', borderRadius: 3 }}>
                <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                    <Box sx={{ bgcolor: 'primary.main', borderRadius: '50%', p: 1.5, mb: 1.5 }}>
                        <Lock sx={{ color: '#fff', fontSize: 32 }} />
                    </Box>
                    <Typography variant="h6" fontWeight={700}>Connect to Student Portal</Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center" mt={0.5}>
                        The Student Portal uses a separate authentication system.<br />
                        Enter your <strong>Student Portal admin credentials</strong> to continue.
                    </Typography>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box component="form" onSubmit={handleLogin}>
                    <TextField
                        fullWidth size="small" label="Email / Username (Identifier)" type="text"
                        value={identifier} onChange={e => setIdentifier(e.target.value)}
                        sx={{ mb: 2 }} autoComplete="username"
                        placeholder="Enter your email or username"
                    />
                    <TextField
                        fullWidth size="small" label="Password" type="password"
                        value={password} onChange={e => setPassword(e.target.value)}
                        sx={{ mb: 3 }} autoComplete="current-password"
                    />
                    <Button
                        type="submit" variant="contained" fullWidth
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
                        sx={{ color: '#ffffff !important', fontWeight: 700 }}
                    >
                        {loading ? 'Connecting…' : 'Connect'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}
