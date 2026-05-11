import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert
} from '@mui/material';
import { Login as LoginIcon } from '@mui/icons-material';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login({ email, password });

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #2d2d2d 100%)'
            }}
        >
            <Container maxWidth="sm">
                <Paper elevation={10} sx={{ p: 4 }}>
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <LoginIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h4" component="h1" gutterBottom>
                            BY8labs
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Sign in to your account
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Email Address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            margin="normal"
                            required
                            autoFocus
                        />
                        <TextField
                            fullWidth
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            margin="normal"
                            required
                        />
                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{ 
                                mt: 3, mb: 2, py: 1.5,
                                color: '#ffffff !important', // Force white text
                                fontWeight: 700
                            }}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>

                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            Don't have an account?{' '}
                            <Link to="/register" style={{ color: '#5b5454ff', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>
                                Register here
                            </Link>
                        </Typography>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default Login;
