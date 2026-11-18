import express from 'express';
import HrController from './hr.controller';
import { authMiddleware, authorizeRoles, authorizePermission, authorizeAnyPermission } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import {
    adjustPayrollValidation,
    bulkAttendanceValidation,
    createDepartmentValidation,
    createEmployeeValidation,
    createHolidayValidation,
    createLeaveValidation,
    generatePayrollValidation,
    payPayrollValidation,
    updateDepartmentValidation,
    updateEmployeeValidation,
    updateLeaveStatusValidation,
    updateSettingsValidation,
} from './hr.validation';

const router = express.Router();

// Every HR endpoint needs an admin account.
router.use(authMiddleware, authorizeRoles('admin', 'superadmin'));

// manage_hr     → people, departments, attendance, leave, holidays
// manage_payroll → salary sheets, payments and payslips (more sensitive)
const hr = authorizePermission('manage_hr');
const payroll = authorizePermission('manage_payroll');
const hrOrPayroll = authorizeAnyPermission('manage_hr', 'manage_payroll');

// Dashboard & settings
router.get('/dashboard', hrOrPayroll, HrController.dashboard);
router.get('/settings', hrOrPayroll, HrController.getSettings);
router.put('/settings', hr, validateRequest(updateSettingsValidation), HrController.updateSettings);

// Departments
router.get('/departments', hrOrPayroll, HrController.listDepartments);
router.post('/departments', hr, validateRequest(createDepartmentValidation), HrController.createDepartment);
router.patch('/departments/:id', hr, validateRequest(updateDepartmentValidation), HrController.updateDepartment);
router.delete('/departments/:id', hr, HrController.deleteDepartment);

// Employees
router.get('/employees', hrOrPayroll, HrController.listEmployees);
router.get('/employees/:id', hrOrPayroll, HrController.getEmployee);
router.post('/employees', hr, validateRequest(createEmployeeValidation), HrController.createEmployee);
router.patch('/employees/:id', hr, validateRequest(updateEmployeeValidation), HrController.updateEmployee);
router.delete('/employees/:id', hr, HrController.deleteEmployee);

// Attendance
router.get('/attendance/daily', hr, HrController.dailyAttendance);
router.get('/attendance/monthly', hrOrPayroll, HrController.monthlyAttendance);
router.post('/attendance', hr, validateRequest(bulkAttendanceValidation), HrController.markAttendance);
router.delete('/attendance/:id', hr, HrController.deleteAttendance);

// Holidays
router.get('/holidays', hrOrPayroll, HrController.listHolidays);
router.post('/holidays', hr, validateRequest(createHolidayValidation), HrController.createHoliday);
router.delete('/holidays/:id', hr, HrController.deleteHoliday);

// Leave
router.get('/leaves', hrOrPayroll, HrController.listLeaves);
router.get('/leaves/balance/:employeeId', hrOrPayroll, HrController.leaveBalance);
router.post('/leaves', hr, validateRequest(createLeaveValidation), HrController.createLeave);
router.patch('/leaves/:id/status', hr, validateRequest(updateLeaveStatusValidation), HrController.updateLeaveStatus);
router.delete('/leaves/:id', hr, HrController.deleteLeave);

// Payroll
router.get('/payroll', payroll, HrController.listPayroll);
router.post('/payroll/generate', payroll, validateRequest(generatePayrollValidation), HrController.generatePayroll);
router.post('/payroll/pay', payroll, validateRequest(payPayrollValidation), HrController.payPayroll);
router.get('/payroll/:id', payroll, HrController.getPayroll);
router.get('/payroll/:id/payslip', payroll, HrController.payslipPdf);
router.patch('/payroll/:id', payroll, validateRequest(adjustPayrollValidation), HrController.adjustPayroll);
router.post('/payroll/:id/undo', payroll, HrController.undoPayroll);
router.delete('/payroll/:id', payroll, HrController.deletePayroll);

export const HrRoutes = router;
