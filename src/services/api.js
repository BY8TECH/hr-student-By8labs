import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://hrstudent-backend.onrender.com');
const API_URL = import.meta.env.VITE_API_URL || `${BACKEND_URL}/api/hr`;

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getCurrentUser: () => api.get('/auth/me'),
    getPendingUsers: () => api.get('/auth/pending-users'),
    approveUser: (userId) => api.put(`/auth/approve-user/${userId}`),
    rejectUser: (userId, reason) => api.put(`/auth/reject-user/${userId}`, { reason }),
    verifyOTP: (data) => api.post('/auth/verify-otp', data),
    resendOTP: (data) => api.post('/auth/resend-otp', data)
};

// Employee APIs
export const employeeAPI = {
    getAll: () => api.get('/employees'),
    getMe: () => api.get('/employees/me'),
    getById: (id) => api.get(`/employees/${id}`),
    create: (data) => api.post('/employees', data),
    update: (id, data) => api.put(`/employees/${id}`, data),
    delete: (id) => api.delete(`/employees/${id}`),
    uploadDocument: (id, formData) => api.post(`/employees/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
};

// Attendance APIs
export const attendanceAPI = {
    getAll: (params) => api.get('/attendance', { params }),
    getByEmployee: (employeeId, params) => api.get(`/attendance/employee/${employeeId}`, { params }),
    markAttendance: (data) => api.post('/attendance/mark', data),
    getTodayStatus: () => api.get('/attendance/today'),
    getMyStats: () => api.get('/attendance/my-stats'),
    create: (data) => api.post('/attendance', data),
    update: (id, data) => api.put(`/attendance/${id}`, data),
    editAttendance: (id, data) => api.patch(`/attendance/hr-edit/${id}`, data),
    delete: (id) => api.delete(`/attendance/${id}`),
    bulkMark: (data) => api.post('/attendance/bulk-mark', data),
    exportExcel: (params) => api.get('/attendance/export', {
        params,
        responseType: 'blob'
    }),
    monthlySummary: (params) => api.get('/attendance/monthly-summary', { params })
};

// Leave APIs
export const leaveAPI = {
    getAll: (params) => api.get('/leaves', { params }),
    getByEmployee: (employeeId) => api.get(`/leaves/employee/${employeeId}`),
    getBalance: (employeeId) => api.get(`/leaves/balance/${employeeId}`),
    create: (data) => api.post('/leaves', data),
    update: (id, data) => api.put(`/leaves/${id}`, data),
    review: (id, data) => api.put(`/leaves/${id}/review`, data),
    delete: (id) => api.delete(`/leaves/${id}`)
};

// Payroll APIs
export const payrollAPI = {
    getAll: (params) => api.get('/payroll', { params }),
    getByEmployee: (employeeId) => api.get(`/payroll/employee/${employeeId}`),
    getMyPayroll: () => api.get('/payroll/my-payroll'), // Get by logged-in user's email
    create: (data) => api.post('/payroll', data),
    update: (id, data) => api.put(`/payroll/${id}`, data),
    delete: (id) => api.delete(`/payroll/${id}`),
    downloadSlip: (id, withTax = true) => api.get(`/payroll/slip/${id}/pdf`, {
        params: { withTax: withTax ? 'true' : 'false' },
        responseType: 'blob'
    })
};

// Access Requests API
export const accessRequestAPI = {
    create: (data) => api.post('/access-requests', data),
    getAll: () => api.get('/access-requests'),
    approve: (id) => api.put(`/access-requests/${id}/approve`),
    reject: (id, reason) => api.put(`/access-requests/${id}/reject`, { reason })
};

// Performance API
export const performanceAPI = {
    getAll: () => api.get('/performance'),
    getById: (id) => api.get(`/performance/${id}`),
    create: (data) => api.post('/performance', data),
    update: (id, data) => api.put(`/performance/${id}`, data),
    acknowledge: (id, data) => api.put(`/performance/${id}/acknowledge`, data),
    delete: (id) => api.delete(`/performance/${id}`),
};

// Announcement APIs
export const announcementAPI = {
    getAll: () => api.get('/announcements'),
    getById: (id) => api.get(`/announcements/${id}`),
    create: (formData) => api.post('/announcements', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    update: (id, formData) => api.put(`/announcements/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    delete: (id) => api.delete(`/announcements/${id}`)
};

// Holiday APIs
export const holidayAPI = {
    getAll: (params) => api.get('/holidays', { params }),
    getByMonth: (year, month) => api.get(`/holidays/${year}/${month}`),
    create: (data) => api.post('/holidays', data),
    update: (id, data) => api.put(`/holidays/${id}`, data),
    delete: (id) => api.delete(`/holidays/${id}`)
};

// Feedback APIs
export const feedbackAPI = {
    // Feedback CRUD
    getAll: (params) => api.get('/feedback', { params }),
    getById: (id) => api.get(`/feedback/${id}`),
    create: (formData) => api.post('/feedback', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    update: (id, data) => api.put(`/feedback/${id}`, data),
    delete: (id) => api.delete(`/feedback/${id}`),

    // Social Interactions
    react: (id, type) => api.post(`/feedback/${id}/react`, { type }),
    addComment: (id, text) => api.post(`/feedback/${id}/comment`, { text }),
    updateComment: (id, commentId, text) => api.put(`/feedback/${id}/comment/${commentId}`, { text }),
    deleteComment: (id, commentId) => api.delete(`/feedback/${id}/comment/${commentId}`),
    incrementView: (id) => api.post(`/feedback/${id}/view`),

    // HR Actions
    updateStatus: (id, status) => api.patch(`/feedback/${id}/status`, { status }),
    addOfficialResponse: (id, text) => api.post(`/feedback/${id}/official-response`, { text })
};

// Email APIs
export const emailsAPI = {
    getRecipientsList: () => api.get('/emails/recipients/list'),
    sendEmail: (emailData) => api.post('/emails', emailData),
    getInbox: () => api.get('/emails/inbox'),
    getSent: () => api.get('/emails/sent'),
    getEmailById: (id) => api.get(`/emails/${id}`),
    markAsRead: (id) => api.put(`/emails/${id}/read`),
    deleteEmail: (id) => api.delete(`/emails/${id}`),

    // External Email APIs (Hostinger)
    getExternalInbox: (emailPassword) => api.get('/emails/external/inbox', { 
        timeout: 60000,
        headers: emailPassword ? { 'X-Hostinger-Password': emailPassword } : {}
    }), 
    getExternalEmailById: (uid, emailPassword) => api.get(`/emails/external/message/${uid}`, {
        headers: emailPassword ? { 'X-Hostinger-Password': emailPassword } : {}
    })
};

// Email Configuration APIs
export const emailConfigAPI = {
    getConfig: () => api.get('/email-config'),
    saveConfig: (data) => api.put('/email-config', data),
    testConfig: (data) => api.post('/email-config/test', data)
};

// Document Management APIs
export const documentAPI = {
    getAll: () => api.get('/documents'),
    getByEmployee: (employeeId) => api.get(`/documents/employee/${employeeId}`),
    upload: (formData) => api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    update: (id, data) => api.put(`/documents/${id}`, data),
    delete: (id) => api.delete(`/documents/${id}`),
    // Returns a URL the browser can use to trigger download (with auth token in header via axios)
    download: (id) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
};

export default api;

