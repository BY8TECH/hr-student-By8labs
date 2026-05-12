import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            // Check if user is logged in
            const token = localStorage.getItem('token');
            const savedUser = localStorage.getItem('user');

            if (token && savedUser) {
                setUser(JSON.parse(savedUser));
                // Refresh user data from server to ensure it's up to date
                // This fixes issues where local storage has stale data (missing employeeId)
                await refreshUser();
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (credentials) => {
        try {
            const response = await authAPI.login(credentials);
            const { token, ...userData } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const register = async (userData) => {
        try {
            const response = await axios.post('/api/auth/register', userData);

            // Check if verification is required
            if (response.data.requiresVerification) {
                return {
                    success: true,
                    requiresVerification: true,
                    userId: response.data.userId,
                    email: response.data.email
                };
            }

            // Auto-approved registration - user gets token immediately (legacy/admin flow)
            if (response.data.token) {
                const user = {
                    _id: response.data._id,
                    username: response.data.username,
                    email: response.data.email,
                    role: response.data.role,
                    employeeId: response.data.employeeId,
                    hasDataAccess: response.data.hasDataAccess || false
                };

                setUser(user);
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(user));

                return { success: true };
            }

            return { success: true, pending: true };
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const refreshUser = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await authAPI.getCurrentUser();
            const userData = response.data;

            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            return userData;
        } catch (error) {
            console.error('Failed to refresh user:', error);
            // If token is invalid, logout
            if (error.response?.status === 401) {
                logout();
            }
        }
    };

    const updateUser = (data) => {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const value = {
        user,
        login,
        register,
        logout,
        refreshUser,
        updateUser,
        loading,
        isAuthenticated: !!user,
        isHR: user?.role === 'HR',
        isManager: user?.role === 'Manager',
        isEmployee: user?.role === 'Employee',
        isStudent: user?.role === 'Student' || user?.role === 'student'
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export default AuthContext;
