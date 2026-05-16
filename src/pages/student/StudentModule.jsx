import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import {
    Box, Typography, Paper, CircularProgress, Divider,
    List as MuiList, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Tooltip, Button
} from '@mui/material';
import {
    Dashboard, PeopleOutlined, MenuBook, EventAvailable,
    HowToReg, PersonSearch, EventNote, LinkOff,
    Assignment, Payments, CloudUpload, VerifiedUser
} from '@mui/icons-material';

import {
    getStudentPortalToken, clearStudentPortalToken,
} from '../../services/studentPortalAPI';

// ─── Lazy-loaded Sub-modules ────────────────────────────────────────────────
const PortalConnect = lazy(() => import('./components/PortalConnect'));
const DashboardPanel = lazy(() => import('./components/DashboardPanel'));
const UsersPanel = lazy(() => import('./components/UsersPanel'));
const StudentListPanel = lazy(() => import('./components/StudentListPanel'));
const AdmissionFormPanel = lazy(() => import('./components/AdmissionFormPanel'));
const CoursesPanel = lazy(() => import('./components/CoursesPanel'));
const DocumentsPanel = lazy(() => import('./components/DocumentsPanel'));
const AttendanceControlPanel = lazy(() => import('./components/AttendanceControlPanel'));
const LeaderboardPanel = lazy(() => import('./components/LeaderboardPanel'));
const NotificationsPanel = lazy(() => import('./components/NotificationsPanel'));
const EnrollmentsPanel = lazy(() => import('./components/EnrollmentsPanel'));
const StudentLeaveManagementPanel = lazy(() => import('./StudentLeaveManagementPanel'));
const TasksPanel = lazy(() => import('./components/TasksPanel'));
const PaymentModule = lazy(() => import('./components/PaymentModule'));
const CertificateManagementPanel = lazy(() => import('./components/CertificateManagementPanel'));

const MODULES = [
    { id: 'dashboard', label: 'Dashboard', icon: <Dashboard /> },
    { id: 'students', label: 'Users', icon: <PeopleOutlined /> },
    { id: 'studentList', label: 'Student List', icon: <HowToReg /> },
    { id: 'admission', label: 'Admission Form', icon: <PersonSearch /> },
    { id: 'courses', label: 'Courses', icon: <MenuBook /> },
    { id: 'documents', label: 'Upload Course Materials', icon: <CloudUpload /> },
    { id: 'attendance', label: 'Attendance', icon: <EventAvailable /> },
    { id: 'leave', label: 'Leave Management', icon: <EventNote /> },
    { id: 'tasks', label: 'Tasks', icon: <Assignment /> },
    { id: 'payment', label: 'Payments', icon: <Payments /> },
    { id: 'certificates', label: 'Certificates', icon: <VerifiedUser /> },
];

export default function StudentModule() {
    const [active, setActive] = useState('dashboard');
    const [connected, setConnected] = useState(!!getStudentPortalToken());
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);
    const handleConnect = () => setConnected(true);
    const handleDisconnect = useCallback(() => { clearStudentPortalToken(); setConnected(false); }, []);

    useEffect(() => {
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            const moduleId = MODULES.find(m => m.id === hash)?.id;
            if (moduleId) {
                setActive(moduleId);
            } else if (hash.includes('leave')) {
                setActive('leave');
            } else if (hash.includes('certificates')) {
                setActive('certificates');
            }
        }

        const handleUnauthorized = () => {
            handleDisconnect();
        };

        window.addEventListener('student_portal_unauthorized', handleUnauthorized);
        return () => window.removeEventListener('student_portal_unauthorized', handleUnauthorized);
    }, [handleDisconnect]);

    if (!connected) {
        return (
            <Suspense fallback={<Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>}>
                <PortalConnect onConnect={handleConnect} />
            </Suspense>
        );
    }

    return (
        <Box display="flex" gap={0} sx={{ minHeight: '80vh', border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            {/* ── Left Navigation ── */}
            <Paper
                elevation={0}
                sx={{
                    width: 240,
                    flexShrink: 0,
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                }}
            >
                <Box sx={{ px: 2, py: 2.5 }}>
                    <Typography variant="overline" fontWeight={700} color="text.secondary" letterSpacing={1.5}>
                        Student Module
                    </Typography>
                </Box>
                <Divider />
                <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1 }}>
                    <MuiList dense sx={{ pt: 1 }}>
                        {MODULES.map(m => (
                            <ListItem key={m.id} disablePadding>
                                <ListItemButton
                                    selected={active === m.id}
                                    onClick={() => setActive(m.id)}
                                    sx={{
                                        my: 0.3, borderRadius: 1.5,
                                        '&.Mui-selected': {
                                            bgcolor: 'primary.main',
                                            color: '#fff',
                                            '& .MuiListItemIcon-root': { color: '#fff' },
                                            '&:hover': { bgcolor: 'primary.dark' },
                                        },
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 36 }}>{m.icon}</ListItemIcon>
                                    <ListItemText
                                        primary={m.label}
                                        primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active === m.id ? 700 : 500 }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </MuiList>
                </Box>

                <Divider sx={{ mt: 'auto' }} />
                <Box sx={{ p: 1.5 }}>
                    <Tooltip title="Disconnect from Student Portal">
                        <Button
                            size="small" color="error" variant="outlined" fullWidth
                            startIcon={<LinkOff fontSize="small" />}
                            onClick={handleDisconnect}
                            sx={{ fontSize: '0.75rem' }}
                        >
                            Disconnect
                        </Button>
                    </Tooltip>
                </Box>
            </Paper>

            {/* ── Right Content ── */}
            <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto' }}>
                <Suspense fallback={<Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>}>
                    {active === 'dashboard' && <DashboardPanel refreshTrigger={refreshTrigger} onTabChange={setActive} />}
                    {active === 'students' && <UsersPanel />}
                    {active === 'studentList' && <StudentListPanel />}
                    {active === 'admission' && <AdmissionFormPanel />}
                    {active === 'courses' && <CoursesPanel />}
                    {active === 'documents' && <DocumentsPanel />}
                    {active === 'attendance' && <AttendanceControlPanel onRefresh={triggerRefresh} />}
                    {active === 'leaderboard' && <LeaderboardPanel />}
                    {active === 'notifications' && <NotificationsPanel />}
                    {active === 'enrollments' && <EnrollmentsPanel />}
                    {active === 'leave' && <StudentLeaveManagementPanel />}
                    {active === 'tasks' && <TasksPanel />}
                    {active === 'payment' && <PaymentModule />}
                    {active === 'certificates' && <CertificateManagementPanel />}
                </Suspense>
            </Box>
        </Box>
    );
}
