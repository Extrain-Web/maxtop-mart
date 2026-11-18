import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import AppError from '../../utils/AppError';
import ActivityLogService from '../activityLog/activityLog.service';
import {
    AttendanceService,
    DashboardService,
    DepartmentService,
    EmployeeService,
    HolidayService,
    LeaveService,
    SettingsService,
} from './hr.service';
import PayrollService from './payroll.service';
import { currentMonthBD, DATE_RE, MONTH_RE, todayBD } from './hr.utils';

/* eslint-disable @typescript-eslint/no-explicit-any */

const ok = (res: Response, message: string, data: unknown, statusCode = 200) =>
    sendResponse(res, { statusCode, success: true, message, data });

const log = (req: Request, action: string, target: string, meta?: unknown) =>
    ActivityLogService.logActivity({ actor: req.user?.userId, actorName: req.user?.email, action, target, meta });

/** Empty strings from forms → unset optional refs. */
const cleanRefs = (body: any) => {
    if (body.department === '') body.department = null;
    if (body.user === '') body.user = null;
    return body;
};

const HrController = {
    // Dashboard & settings
    dashboard: catchAsync(async (_req, res) => ok(res, 'HR dashboard', await DashboardService.get())),
    getSettings: catchAsync(async (_req, res) => ok(res, 'HR settings', await SettingsService.get())),
    updateSettings: catchAsync(async (req, res) => {
        const data = await SettingsService.update(req.body);
        log(req, 'hr.settings.update', 'HR settings');
        ok(res, 'HR settings saved', data);
    }),

    // Departments
    listDepartments: catchAsync(async (_req, res) => ok(res, 'Departments', await DepartmentService.list())),
    createDepartment: catchAsync(async (req, res) => {
        const data = await DepartmentService.create(req.body);
        log(req, 'hr.department.create', data.name);
        ok(res, 'Department created', data, 201);
    }),
    updateDepartment: catchAsync(async (req, res) => ok(res, 'Department updated', await DepartmentService.update(req.params.id, req.body))),
    deleteDepartment: catchAsync(async (req, res) => {
        const data = await DepartmentService.remove(req.params.id);
        log(req, 'hr.department.delete', data.name);
        ok(res, 'Department deleted', data);
    }),

    // Employees
    listEmployees: catchAsync(async (req, res) => ok(res, 'Employees', await EmployeeService.list(req.query))),
    getEmployee: catchAsync(async (req, res) => ok(res, 'Employee details', await EmployeeService.getById(req.params.id))),
    createEmployee: catchAsync(async (req, res) => {
        const data = await EmployeeService.create(cleanRefs(req.body));
        log(req, 'hr.employee.create', `${data.employeeId} ${data.firstName}`);
        ok(res, 'Employee added', data, 201);
    }),
    updateEmployee: catchAsync(async (req, res) => {
        const data: any = await EmployeeService.update(req.params.id, cleanRefs(req.body));
        log(req, 'hr.employee.update', data?.employeeId || req.params.id, { fields: Object.keys(req.body) });
        ok(res, 'Employee updated', data);
    }),
    deleteEmployee: catchAsync(async (req, res) => {
        const data = await EmployeeService.remove(req.params.id);
        log(req, 'hr.employee.delete', `${data.employeeId} ${data.firstName}`);
        ok(res, 'Employee deleted', data);
    }),

    // Attendance
    dailyAttendance: catchAsync(async (req, res) => {
        const date = String(req.query.date || todayBD());
        if (!DATE_RE.test(date)) throw new AppError(400, 'Date must be YYYY-MM-DD');
        ok(res, 'Daily attendance', await AttendanceService.daily(date));
    }),
    monthlyAttendance: catchAsync(async (req, res) => {
        const month = String(req.query.month || currentMonthBD());
        if (!MONTH_RE.test(month)) throw new AppError(400, 'Month must be YYYY-MM');
        ok(res, 'Monthly attendance', await AttendanceService.monthly(month));
    }),
    markAttendance: catchAsync(async (req, res) => {
        const data = await AttendanceService.bulkMark(req.body, req.user?.userId);
        log(req, 'hr.attendance.mark', req.body.date, data);
        ok(res, `Attendance saved for ${data.saved} employee(s)`, data);
    }),
    deleteAttendance: catchAsync(async (req, res) => ok(res, 'Attendance removed', await AttendanceService.remove(req.params.id))),

    // Holidays
    listHolidays: catchAsync(async (req, res) => ok(res, 'Holidays', await HolidayService.list(req.query))),
    createHoliday: catchAsync(async (req, res) => ok(res, 'Holiday added', await HolidayService.create(req.body), 201)),
    deleteHoliday: catchAsync(async (req, res) => ok(res, 'Holiday removed', await HolidayService.remove(req.params.id))),

    // Leave
    listLeaves: catchAsync(async (req, res) => ok(res, 'Leave requests', await LeaveService.list(req.query))),
    createLeave: catchAsync(async (req, res) => {
        const data = await LeaveService.create(req.body, req.user?.userId);
        log(req, 'hr.leave.create', String(data._id), { status: data.status, days: data.days });
        ok(res, data.status === 'approved' ? 'Leave added and approved' : 'Leave request added', data, 201);
    }),
    updateLeaveStatus: catchAsync(async (req, res) => {
        const data = await LeaveService.updateStatus(req.params.id, req.body, req.user?.userId);
        log(req, `hr.leave.${data.status}`, String(data._id));
        ok(res, `Leave ${data.status}`, data);
    }),
    deleteLeave: catchAsync(async (req, res) => ok(res, 'Leave deleted', await LeaveService.remove(req.params.id))),
    leaveBalance: catchAsync(async (req, res) => {
        const year = Number(req.query.year) || Number(todayBD().slice(0, 4));
        ok(res, 'Leave balance', await LeaveService.balance(req.params.employeeId, year));
    }),

    // Payroll
    listPayroll: catchAsync(async (req, res) => {
        if (req.query.month && !MONTH_RE.test(String(req.query.month))) throw new AppError(400, 'Month must be YYYY-MM');
        ok(res, 'Payroll', await PayrollService.list(req.query));
    }),
    getPayroll: catchAsync(async (req, res) => ok(res, 'Payslip', await PayrollService.getById(req.params.id))),
    generatePayroll: catchAsync(async (req, res) => {
        const data = await PayrollService.generate(req.body, req.user?.userId);
        log(req, 'hr.payroll.generate', data.month, data);
        ok(res, `Salary sheet ready — ${data.created} new, ${data.updated} refreshed`, data);
    }),
    adjustPayroll: catchAsync(async (req, res) => ok(res, 'Payslip updated', await PayrollService.adjust(req.params.id, req.body))),
    payPayroll: catchAsync(async (req, res) => {
        const data = await PayrollService.markPaid(req.body.ids, req.body, req.user?.userId);
        log(req, 'hr.payroll.pay', `${data.paid} payslip(s)`, data);
        ok(res, `${data.paid} salary payment(s) recorded`, data);
    }),
    undoPayroll: catchAsync(async (req, res) => {
        const data = await PayrollService.undoPayment(req.params.id);
        log(req, 'hr.payroll.undo', data.payslipNo);
        ok(res, 'Payment undone', data);
    }),
    deletePayroll: catchAsync(async (req, res) => ok(res, 'Payslip deleted', await PayrollService.remove(req.params.id))),
    payslipPdf: catchAsync(async (req: Request, res: Response) => {
        const { buffer, filename } = await PayrollService.payslipPdf(req.params.id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }),
};

export default HrController;
