import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://hrstudent-backend.onrender.com');
export const STUDENT_API_URL = import.meta.env.VITE_SP_API_URL || `${BACKEND_URL}/api/sp`;

// Separate token key so it doesn't collide with the HR backend token
const TOKEN_KEY = 'student_portal_token';

export const getStudentPortalToken = () => localStorage.getItem(TOKEN_KEY);
export const setStudentPortalToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearStudentPortalToken = () => localStorage.removeItem(TOKEN_KEY);

// Create axios instance for Student Portal
const studentApi = axios.create({
    baseURL: STUDENT_API_URL,
    headers: { 'Content-Type': 'application/json' }
});

// Attach student portal token (not HR token)
studentApi.interceptors.request.use(
    (config) => {
        const token = getStudentPortalToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

studentApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token is invalid or expired
            clearStudentPortalToken();
            // Dispatch a custom event to tell the UI to show the connection gate again
            window.dispatchEvent(new Event('student_portal_unauthorized'));
        }
        return Promise.reject(error);
    }
);

// Auth
export const portalAuthAPI = {
    login: (data) => studentApi.post('/auth/login', data),
    register: (data) => studentApi.post('/auth/register', data),
};

// 1) Dashboard
export const dashboardAPI = {
    getCounts: () => studentApi.get('/dashboard/counts'),
    getStudentStats: () => studentApi.get('/dashboard/admin/stats'),
    getAdminAttendanceStats: () => studentApi.get('/dashboard/admin/attendance'),
    getOverallAdminStats: () => studentApi.get('/dashboard/admin/overall'),
};

// 2) Admin
export const adminStudentAPI = {
    getAllStudents: () => studentApi.get('/admin/students'),
    approveStudent: (id) => studentApi.patch(`/admin/students/${id}/approve`),
    rejectStudent: (id) => studentApi.patch(`/admin/students/${id}/reject`),
};

// 3) Courses
export const courseAPI = {
    getCategoryNames: () => studentApi.get('/courses/categories/names'),
    getCategories: () => studentApi.get('/courses/categories/list'),
    addCategory: (data) => studentApi.post('/courses/categories/list', data),
    getAllCourses: () => studentApi.get('/courses/categories/list'),
    addCourse: (data) => studentApi.post('/courses', data),
    getCourseAbout: (id) => studentApi.get(`/courses/${id}/about`),
    enrollCourse: (id) => studentApi.post(`/courses/${id}/enroll`),
    getCourseLessons: (id) => studentApi.get(`/courses/${id}/lessons`),
    
    // Doubts
    getDoubts: (id) => studentApi.get(`/courses/${id}/doubts`),
    postDoubt: (id, data) => studentApi.post(`/courses/${id}/doubts`, data),
    
    // Notes
    getNotes: (id) => studentApi.get(`/courses/${id}/notes`),
    postNote: (id, data) => studentApi.post(`/courses/${id}/notes`, data),

    // Quizzes & MCQs
    getLessonMCQs: (lessonId) => studentApi.get(`/courses/lessons/${lessonId}/mcq`),
    submitQuizScore: (lessonId, data) => studentApi.post(`/courses/lessons/${lessonId}/quiz-score`, data),
};

// 4) Attendance
export const attendanceAPI = {
    getSummary: () => studentApi.get('/attendance/summary'),
    getOverallSummary: () => studentApi.get('/attendance/summary'),
    getMyAttendance: () => studentApi.get('/attendance'),
    // Student-ID based APIs
    markAttendanceById: (userId, data) => studentApi.post(`/attendance/${userId}`, data),
    getAttendanceById: (userId, params) => studentApi.get(`/attendance/${userId}`, { params }),
    getAttendanceSummaryById: (userId) => studentApi.get(`/attendance/summary/${userId}`),
    // OTP edit flow
    requestEdit: (userId, data) => studentApi.post(`/attendance/${userId}/request-edit`, data),
    verifyEdit: (userId, data) => studentApi.put(`/attendance/${userId}/verify-edit`, data),
};

// 5) Leaderboard
export const leaderboardAPI = {
    getLeaderboard: () => studentApi.get('/leaderboard'),
};

// 6) Notifications
export const notificationAPI = {
    getNotifications: () => studentApi.get('/notifications'),
};

// 7) Enrollments
export const enrollmentAPI = {
    getMyCourses: () => studentApi.get('/enrollments/my-courses'),
};

// 8) Leave
export const leaveAPI = {
    getAllLeaves: (params) => studentApi.get('/leave', { params }),
    updateLeaveStatus: (leaveId, data) => studentApi.put(`/leave/${leaveId}/status`, data),
};

// 9) Tasks
export const taskAPI = {
    getAdminDashboard: () => studentApi.get('/tasks/admin/dashboard'),
};

// ═══════════════════════════════════════════════════════════════════════════
// Payment API
// ═══════════════════════════════════════════════════════════════════════════
export const paymentAPI = {
    add: (data) => studentApi.post('/payments/admin/add', data),
    getReport: (params) => studentApi.get('/payments/admin/report', { params }),
    getList: (params) => studentApi.get('/payments/admin/list', { params }),
    downloadReport: (params) => studentApi.get('/payments/admin/report/download', { params, responseType: 'blob' }),
    getStudentCourse: (userId) => studentApi.get(`/payments/admin/student-course/${userId}`),
};

// ═══════════════════════════════════════════════════════════════════════════
// Document API
// ═══════════════════════════════════════════════════════════════════════════
export const documentAPI = {
    getAllAdminDocuments: () => studentApi.get('/documents/admin/all'),
    uploadDocument: (data) => studentApi.post('/documents/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    downloadDocument: (id) => studentApi.get(`/documents/download/${id}`, { responseType: 'blob' })
};

// ═══════════════════════════════════════════════════════════════════════════
// Certificate API
// ═══════════════════════════════════════════════════════════════════════════
export const certificateAPI = {
    getRequests:      (params) => studentApi.get('/certificates/requests', { params }),
    generate:         (data)   => studentApi.post('/certificates/generate', data),
    download:         (certId) => studentApi.get(`/certificates/download/${certId}`, { responseType: 'blob' }),
    view:             (certId) => studentApi.get(`/certificates/view/${certId}`, { responseType: 'blob' }),
    getDashboard:     ()       => studentApi.get('/certificates/dashboard'),
    getAllCertificates: ()     => studentApi.get('/certificates/all'),
    getCertificatesByUserId: (userId) => studentApi.get(`/certificates/user/${userId}`),
    getStudentDetails: (userId) => studentApi.get(`/certificates/student-details/${userId}`),
};

export default studentApi;

