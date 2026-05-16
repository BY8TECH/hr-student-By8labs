import React from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Divider,
    Button,
    Tabs,
    Tab,
    Chip,
    Card,
    CardContent
} from '@mui/material';
import {
    Download,
    AccountBalance,
    CalendarMonth,
    Person,
    AttachMoney,
    TrendingUp,
    Receipt
} from '@mui/icons-material';

const SalarySlipView = ({ payroll }) => {
    if (!payroll) return null;

    const employee = payroll.employeeId;
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const formatCurrency = (amount) => {
        return `₹${amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`;
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-GB');
    };

    const convertToWords = (amount) => {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        if (amount === 0) return 'Zero Rupees Only';

        const num = Math.round(amount);
        let words = '';

        if (num >= 10000000) {
            words += ones[Math.floor(num / 10000000)] + ' Crore ';
            amount = num % 10000000;
        }
        if (num >= 100000) {
            const lakhs = Math.floor(num / 100000) % 100;
            if (lakhs >= 20) {
                words += tens[Math.floor(lakhs / 10)] + ' ';
                if (lakhs % 10 > 0) words += ones[lakhs % 10] + ' ';
                words += 'Lakh ';
            } else if (lakhs >= 10) {
                words += teens[lakhs - 10] + ' Lakh ';
            } else if (lakhs > 0) {
                words += ones[lakhs] + ' Lakh ';
            }
        }
        if (num >= 1000) {
            const thousands = Math.floor(num / 1000) % 100;
            if (thousands >= 20) {
                words += tens[Math.floor(thousands / 10)] + ' ';
                if (thousands % 10 > 0) words += ones[thousands % 10] + ' ';
                words += 'Thousand ';
            } else if (thousands >= 10) {
                words += teens[thousands - 10] + ' Thousand ';
            } else if (thousands > 0) {
                words += ones[thousands] + ' Thousand ';
            }
        }
        if (num >= 100) {
            const hundreds = Math.floor(num / 100) % 10;
            if (hundreds > 0) words += ones[hundreds] + ' Hundred ';
        }
        const remainder = num % 100;
        if (remainder >= 20) {
            words += tens[Math.floor(remainder / 10)] + ' ';
            if (remainder % 10 > 0) words += ones[remainder % 10] + ' ';
        } else if (remainder >= 10) {
            words += teens[remainder - 10] + ' ';
        } else if (remainder > 0) {
            words += ones[remainder] + ' ';
        }

        return words.trim() + ' Rupees Only';
    };

    const [tabValue, setTabValue] = React.useState(0);
    const [downloading, setDownloading] = React.useState(false);

    const totalTax = payroll.totalTax || 0;
    const withTaxDeductions = payroll.totalDeductions;
    const withTaxNetPay = payroll.netPayableSalary;
    const withoutTaxDeductions = payroll.totalDeductions - totalTax;
    const withoutTaxNetPay = payroll.netPayableSalary + totalTax;

    const handleDownload = async (withTax) => {
        try {
            setDownloading(true);
            const token = localStorage.getItem('token');

            const response = await fetch(`/api/payroll/slip/${payroll._id}/pdf?withTax=${withTax}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Salary_Slip_${payroll.employeeId?.employeeId}_${monthNames[payroll.month - 1]}_${withTax ? 'WithTax' : 'WithoutTax'}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download PDF');
        } finally {
            setDownloading(false);
        }
    };

    const renderSlipDetails = (withTax) => {
        const displayDeductions = withTax ? withTaxDeductions : withoutTaxDeductions;
        const displayNetPay = withTax ? withTaxNetPay : withoutTaxNetPay;

        return (
            <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    {/* Employee Details Card */}
                    <Grid item xs={12} md={6}>
                        <Card
                            elevation={3}
                            sx={{
                                height: '100%',
                                borderTop: '4px solid #10b981',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'translateY(-4px)' }
                            }}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Person sx={{ color: '#10b981', mr: 1, fontSize: 28 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1f2937' }}>
                                        Employee Details
                                    </Typography>
                                </Box>
                                <Grid container spacing={1.5}>
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                            <Typography variant="body2" color="text.secondary">EID:</Typography>
                                            <Typography variant="body2" fontWeight="600">{employee?.employeeId || 'N/A'}</Typography>
                                        </Box>
                                        <Divider />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                            <Typography variant="body2" color="text.secondary">Name:</Typography>
                                            <Typography variant="body2" fontWeight="600">{employee?.firstName} {employee?.lastName}</Typography>
                                        </Box>
                                        <Divider />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                            <Typography variant="body2" color="text.secondary">Designation:</Typography>
                                            <Typography variant="body2" fontWeight="600">{employee?.designation || 'N/A'}</Typography>
                                        </Box>
                                        <Divider />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                            <Typography variant="body2" color="text.secondary">Joining Date:</Typography>
                                            <Typography variant="body2" fontWeight="600">{formatDate(employee?.joiningDate)}</Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Pay Period Card */}
                    <Grid item xs={12} md={6}>
                        <Card
                            elevation={3}
                            sx={{
                                height: '100%',
                                borderTop: '4px solid #14b8a6',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'translateY(-4px)' }
                            }}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <CalendarMonth sx={{ color: '#14b8a6', mr: 1, fontSize: 28 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1f2937' }}>
                                        Pay Period & Attendance
                                    </Typography>
                                </Box>
                                <Grid container spacing={1.5}>
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                            <Typography variant="body2" color="text.secondary">Pay Cycle:</Typography>
                                            <Typography variant="body2" fontWeight="600">
                                                01/{payroll.month.toString().padStart(2, '0')}/{payroll.year} - {new Date(payroll.year, payroll.month, 0).getDate()}/{payroll.month.toString().padStart(2, '0')}/{payroll.year}
                                            </Typography>
                                        </Box>
                                        <Divider />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                            <Typography variant="body2" color="text.secondary">Total Working Days:</Typography>
                                            <Chip label={payroll.totalWorkingDays} size="small" color="success" />
                                        </Box>
                                        <Divider />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                            <Typography variant="body2" color="text.secondary">Absent Days:</Typography>
                                            <Chip label={payroll.absentDays} size="small" color="error" />
                                        </Box>
                                        <Divider />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                            <Typography variant="body2" color="text.secondary">Actual Working Days:</Typography>
                                            <Chip label={payroll.actualWorkingDays} size="small" sx={{ bgcolor: '#10b981', color: 'white' }} />
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Bank Details Card */}
                    {employee?.bankDetails && employee.bankDetails.bankName && (
                        <Grid item xs={12}>
                            <Card
                                elevation={3}
                                sx={{
                                    borderTop: '4px solid #f59e0b',
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'translateY(-4px)' }
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <AccountBalance sx={{ color: '#f59e0b', mr: 1, fontSize: 28 }} />
                                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1f2937' }}>
                                            Bank Details
                                        </Typography>
                                    </Box>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={4}>
                                            <Typography variant="body2" color="text.secondary">Bank Name</Typography>
                                            <Typography variant="body1" fontWeight="600">{employee.bankDetails.bankName}</Typography>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Typography variant="body2" color="text.secondary">Account No</Typography>
                                            <Typography variant="body1" fontWeight="600">{employee.bankDetails.accountNumber || 'N/A'}</Typography>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Typography variant="body2" color="text.secondary">Branch</Typography>
                                            <Typography variant="body1" fontWeight="600">{employee.bankDetails.branch || 'N/A'}</Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}

                    {/* Salary Breakdown Card */}
                    <Grid item xs={12}>
                        <Card
                            elevation={4}
                            sx={{
                                borderTop: '4px solid #10b981',
                                background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)'
                            }}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                    <Receipt sx={{ color: '#10b981', mr: 1, fontSize: 28 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1f2937' }}>
                                        Salary Breakdown {!withTax && <Chip label="Tax Excluded" size="small" color="warning" sx={{ ml: 1 }} />}
                                    </Typography>
                                </Box>

                                <Paper elevation={2} sx={{ overflow: 'hidden', borderRadius: 2 }}>
                                    <Table>
                                        <TableBody>
                                            <TableRow sx={{ bgcolor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                                                <TableCell sx={{ fontWeight: 'bold', color: 'white', bgcolor: '#10b981', fontSize: '0.95rem' }}>
                                                    Description
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'white', bgcolor: '#10b981', fontSize: '0.95rem' }}>
                                                    Amount
                                                </TableCell>
                                            </TableRow>
                                            <TableRow sx={{ '&:hover': { bgcolor: '#f0fdf4' } }}>
                                                <TableCell>Monthly Salary</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(payroll.monthlySalary)}</TableCell>
                                            </TableRow>
                                            <TableRow sx={{ bgcolor: '#fafafa', '&:hover': { bgcolor: '#f0fdf4' } }}>
                                                <TableCell>Actual Salary (after LOP)</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(payroll.actualSalary)}</TableCell>
                                            </TableRow>
                                            <TableRow sx={{ '&:hover': { bgcolor: '#f0fdf4' } }}>
                                                <TableCell>Incentives</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600, color: '#10b981' }}>+{formatCurrency(payroll.incentives)}</TableCell>
                                            </TableRow>
                                            <TableRow sx={{ bgcolor: '#fafafa', '&:hover': { bgcolor: '#f0fdf4' } }}>
                                                <TableCell>Advance Taken</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(payroll.advance)}</TableCell>
                                            </TableRow>
                                            <TableRow sx={{ '&:hover': { bgcolor: '#f0fdf4' } }}>
                                                <TableCell>Advance Deduction</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600, color: '#dc2626' }}>-{formatCurrency(payroll.advanceDeduction)}</TableCell>
                                            </TableRow>
                                            <TableRow sx={{ bgcolor: '#fafafa', '&:hover': { bgcolor: '#f0fdf4' } }}>
                                                <TableCell>
                                                    Total Deductions {!withTax && '(excl. Tax)'}
                                                    {withTax && <Typography variant="caption" display="block" color="text.secondary">Includes tax: {formatCurrency(totalTax)}</Typography>}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600, color: '#dc2626' }}>-{formatCurrency(displayDeductions)}</TableCell>
                                            </TableRow>
                                            <TableRow sx={{
                                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                '&:hover': { opacity: 0.95 }
                                            }}>
                                                <TableCell sx={{ fontWeight: 'bold', color: 'white', fontSize: '1.1rem', py: 2 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <AttachMoney sx={{ mr: 1 }} />
                                                        Net Payable Salary
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'white', fontSize: '1.3rem', py: 2 }}>
                                                    {formatCurrency(displayNetPay)}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </Paper>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Amount in Words */}
                    <Grid item xs={12}>
                        <Paper
                            elevation={2}
                            sx={{
                                p: 3,
                                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                borderLeft: '6px solid #f59e0b',
                                borderRadius: 2
                            }}
                        >
                            <Typography variant="subtitle2" sx={{ color: '#92400e', fontWeight: 'bold', mb: 1 }}>
                                Amount in Words
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#78350f', fontWeight: 600 }}>
                                {convertToWords(displayNetPay)}
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Download Button */}
                    {/* <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<Download />}
                                onClick={() => handleDownload(withTax)}
                                disabled={downloading}
                                sx={{
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: 'white',
                                    px: 5,
                                    py: 1.5,
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    borderRadius: 3,
                                    boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.4)',
                                    transition: 'all 0.3s',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 6px 20px 0 rgba(16, 185, 129, 0.6)',
                                    },
                                    '&:disabled': {
                                        background: '#e5e7eb',
                                    }
                                }}
                            >
                                {downloading ? 'Downloading...' : `Download ${withTax ? 'With Tax' : 'Without Tax'} Slip`}
                            </Button>
                        </Box>
                  </Grid> */}
                </Grid>
            </Box>
        );
    };

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            {/* Header with Gradient */}
            <Box
                sx={{
                    background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
                    borderRadius: '12px 12px 0 0',
                    p: 4,
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                    }
                }}
            >
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <TrendingUp sx={{ fontSize: 48, color: 'white', mb: 1, opacity: 0.9 }} />
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 'bold',
                            color: 'white',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                            mb: 1
                        }}
                    >
                        Salary Slip
                    </Typography>
                    <Typography
                        variant="h5"
                        sx={{
                            color: 'rgba(255, 255, 255, 0.95)',
                            fontWeight: 500
                        }}
                    >
                        {monthNames[payroll.month - 1]} {payroll.year}
                    </Typography>
                </Box>
            </Box>

            {/* Tabs */}
            <Paper elevation={3} sx={{ borderRadius: '0 0 12px 12px' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={tabValue}
                        onChange={(e, newValue) => setTabValue(newValue)}
                        centered
                        sx={{
                            '& .MuiTab-root': {
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                py: 2,
                                transition: 'all 0.3s',
                                '&:hover': {
                                    color: '#10b981',
                                    bgcolor: '#f0fdf4'
                                }
                            },
                            '& .Mui-selected': {
                                color: '#10b981 !important',
                                background: 'linear-gradient(to top, #f0fdf4 0%, transparent 100%)'
                            },
                            '& .MuiTabs-indicator': {
                                backgroundColor: '#10b981',
                                height: 3,
                                borderRadius: '3px 3px 0 0'
                            }
                        }}
                    >
                        <Tab label="With Tax Deductions" icon={<Receipt />} iconPosition="start" />
                        <Tab label="Without Tax Deductions" icon={<Receipt />} iconPosition="start" />
                    </Tabs>
                </Box>

                {/* Tab Panels */}
                {tabValue === 0 && renderSlipDetails(true)}
                {tabValue === 1 && renderSlipDetails(false)}
            </Paper>
        </Box>
    );
};

export default SalarySlipView;
