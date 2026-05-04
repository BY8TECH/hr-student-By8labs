import React, { useState, useEffect } from 'react';
import {
    Card,
    CardHeader,
    CardContent,
    Box,
    Typography,
    IconButton,
    Grid,
    Chip
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import api, { attendanceAPI } from '../../services/api';

import { useAuth } from '../../context/AuthContext';

const AttendanceCalendar = ({ refreshTrigger }) => {
    const { user, isHR } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [attendanceData, setAttendanceData] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    useEffect(() => {
        loadData();
    }, [currentDate, user, refreshTrigger]);

    const loadData = async () => {
        try {
            setLoading(true);

            let attendanceRes;

            if (user?.employeeId) {
                // Employees (and HR with employee profile) see their own attendance
                // Handle case where employeeId is an object (populated) or string
                const empId = typeof user.employeeId === 'object' ? user.employeeId._id : user.employeeId;
                
                if (!empId) {
                    console.warn('User has employeeId property but it is empty');
                    setAttendanceData([]);
                    return;
                }

                attendanceRes = await attendanceAPI.getByEmployee(empId, {
                    month: month + 1,
                    year
                });
            } else if (isHR) {
                // Fallback for HR WITHOUT employee profile: see all attendance (or maybe empty?)
                // If they don't have an ID, they can't mark attendance anyway.
                // Keeping this as fallback to show "Organization View" if they are purely admin.
                const startDate = new Date(year, month, 1).toISOString().split('T')[0];
                const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
                attendanceRes = await attendanceAPI.getAll({
                    startDate,
                    endDate
                });
            } else {
                // No access
                setAttendanceData([]);
                return;
            }

            setAttendanceData(attendanceRes.data || []);

            // Fetch holidays for current month
            try {
                const holidaysRes = await api.get(`/holidays/${year}/${month + 1}`);
                setHolidays(holidaysRes.data || []);
            } catch (error) {
                // Holidays optional - continue if endpoint doesn't exist yet
                setHolidays([]);
            }
        } catch (error) {
            console.error('Failed to load calendar data:', error);
        } finally {
            setLoading(false);
        }
    };

    const previousMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const getDaysInMonth = () => {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];

        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // Add actual days
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    };

    const getDateColor = (day) => {
        if (!day) return 'transparent';

        const cellDate = new Date(year, month, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check attendance status first (priority over holiday/future)
        const attendance = attendanceData.find(a => {
            const attDate = new Date(a.date);
            return attDate.getDate() === day &&
                attDate.getMonth() === month &&
                attDate.getFullYear() === year;
        });

        if (attendance) {
            if (attendance.status === 'Present') return '#c8e6c9'; // Light Green
            if (attendance.status === 'Absent') return '#ffcdd2'; // Light Red
            if (attendance.status === 'Permission') return '#bbdefb'; // Light Blue
        }

        // Future dates - light grey
        if (cellDate > today) {
            return '#f5f5f5';
        }

        // Check if it's a holiday
        const isHoliday = holidays.some(h => {
            const holidayDate = new Date(h.date);
            return holidayDate.getDate() === day &&
                holidayDate.getMonth() === month &&
                holidayDate.getFullYear() === year;
        });
        if (isHoliday) {
            return '#e1bee7'; // Light Purple
        }

        // Default - white
        return '#ffffff';
    };

    const days = getDaysInMonth();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <Card elevation={3}>
            <CardHeader
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <IconButton size="small" onClick={previousMonth}>
                            <ChevronLeft />
                        </IconButton>
                        <Typography variant="h6">
                            {monthNames[month]} {year}
                        </Typography>
                        <IconButton size="small" onClick={nextMonth}>
                            <ChevronRight />
                        </IconButton>
                    </Box>
                }
                sx={{ pb: 1 }}
            />
            <CardContent>
                {/* Calendar Grid */}
                <Grid container spacing={0.5} sx={{ mb: 2 }}>
                    {/* Week day headers */}
                    {weekDays.map(day => (
                        <Grid item xs={12 / 7} key={day}>
                            <Typography
                                variant="caption"
                                align="center"
                                sx={{ fontWeight: 'bold', display: 'block', color: 'text.secondary' }}
                            >
                                {day}
                            </Typography>
                        </Grid>
                    ))}

                    {/* Calendar days */}
                    {days.map((day, index) => (
                        <Grid item xs={12 / 7} key={index}>
                            <Box
                                sx={{
                                    aspectRatio: '1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: getDateColor(day),
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 1,
                                    opacity: day ? 1 : 0,
                                    fontSize: '0.875rem',
                                    cursor: 'default',
                                    position: 'relative'
                                }}
                            >
                                {day || ''}
                            </Box>
                        </Grid>
                    ))}
                </Grid>

                {/* Legend */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                    <Chip
                        size="small"
                        label="Present"
                        sx={{ backgroundColor: '#c8e6c9', fontSize: '0.7rem' }}
                    />
                    <Chip
                        size="small"
                        label="Absent"
                        sx={{ backgroundColor: '#ffcdd2', fontSize: '0.7rem' }}
                    />
                    <Chip
                        size="small"
                        label="Permission"
                        sx={{ backgroundColor: '#bbdefb', fontSize: '0.7rem' }}
                    />
                    <Chip
                        size="small"
                        label="Holiday"
                        sx={{ backgroundColor: '#e1bee7', fontSize: '0.7rem' }}
                    />
                </Box>
            </CardContent>
        </Card>
    );
};

export default AttendanceCalendar;
