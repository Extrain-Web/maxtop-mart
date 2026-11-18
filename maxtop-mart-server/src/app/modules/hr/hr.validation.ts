import { z } from 'zod';
import { ATTENDANCE_STATUSES, EMPLOYEE_STATUSES, EMPLOYMENT_TYPES, SALARY_METHODS } from './hr.models';
import { DATE_RE, MONTH_RE, TIME_RE } from './hr.utils';

const date = z.string().regex(DATE_RE, 'Date must be YYYY-MM-DD');
const optDate = z.union([date, z.literal('')]).optional();
const month = z.string().regex(MONTH_RE, 'Month must be YYYY-MM');
const time = z.union([z.string().regex(TIME_RE, 'Time must be HH:mm'), z.literal('')]).optional();
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID');
const money = z.coerce.number().min(0, 'Amount cannot be negative').max(10_000_000);
const optText = (max = 500) => z.string().trim().max(max).optional();

// ── Department ──
export const createDepartmentValidation = z.object({
    body: z.object({
        name: z.string().trim().min(2, 'Department name is required').max(80),
        code: optText(12),
        description: optText(300),
        head: objectId.nullable().optional(),
        isActive: z.boolean().optional(),
    }),
});
export const updateDepartmentValidation = z.object({ body: createDepartmentValidation.shape.body.partial() });

// ── Employee ──
const salary = z.object({
    basic: money.optional(),
    houseRent: money.optional(),
    medical: money.optional(),
    transport: money.optional(),
    otherAllowance: money.optional(),
});

const employeeBody = z.object({
    firstName: z.string().trim().min(1, 'First name is required').max(60),
    lastName: optText(60),
    email: z.union([z.string().trim().email('Invalid email'), z.literal('')]).optional(),
    phone: z.string().trim().min(6, 'Phone number is required').max(20),
    gender: z.enum(['male', 'female', 'other']).optional(),
    dateOfBirth: optDate,
    bloodGroup: optText(5),
    nid: optText(30),
    presentAddress: optText(300),
    permanentAddress: optText(300),
    photo: optText(1000),
    department: objectId.nullable().optional().or(z.literal('')),
    designation: z.string().trim().min(2, 'Designation is required').max(80),
    employmentType: z.enum(EMPLOYMENT_TYPES).optional(),
    joiningDate: date,
    exitDate: optDate,
    exitReason: optText(300),
    status: z.enum(EMPLOYEE_STATUSES).optional(),
    salary: salary.optional(),
    salaryMethod: z.enum(SALARY_METHODS).optional(),
    bankName: optText(80),
    bankAccountNo: optText(40),
    mobileBankingNo: optText(20),
    emergencyContact: z.object({ name: optText(80), relation: optText(40), phone: optText(20) }).optional(),
    user: objectId.nullable().optional().or(z.literal('')),
    notes: optText(1000),
});

export const createEmployeeValidation = z.object({ body: employeeBody });
export const updateEmployeeValidation = z.object({ body: employeeBody.partial() });

// ── Attendance ──
export const bulkAttendanceValidation = z.object({
    body: z.object({
        date,
        records: z
            .array(
                z.object({
                    employee: objectId,
                    status: z.enum(ATTENDANCE_STATUSES).refine((s) => s !== 'leave', 'Use the Leave screen to add leave'),
                    checkIn: time,
                    checkOut: time,
                    overtimeHours: z.coerce.number().min(0).max(16).optional(),
                    note: optText(200),
                })
            )
            .min(1, 'Nothing to save')
            .max(1000),
    }),
});

// ── Holiday ──
export const createHolidayValidation = z.object({
    body: z.object({ name: z.string().trim().min(2, 'Holiday name is required').max(80), date, note: optText(200) }),
});

// ── Leave ──
export const createLeaveValidation = z.object({
    body: z.object({
        employee: objectId,
        leaveType: z.string().trim().min(1, 'Leave type is required'),
        startDate: date,
        endDate: date,
        halfDay: z.boolean().optional(),
        reason: optText(500),
        status: z.enum(['pending', 'approved']).optional(),
    }),
});
export const updateLeaveStatusValidation = z.object({
    body: z.object({
        status: z.enum(['pending', 'approved', 'rejected', 'cancelled']),
        reviewNote: optText(300),
    }),
});

// ── Payroll ──
export const generatePayrollValidation = z.object({
    body: z.object({ month, employees: z.array(objectId).optional() }),
});
export const adjustPayrollValidation = z.object({
    body: z.object({
        bonus: money.optional(),
        advance: money.optional(),
        tax: money.optional(),
        other: money.optional(),
        note: optText(300),
    }),
});
export const payPayrollValidation = z.object({
    body: z.object({
        ids: z.array(objectId).min(1, 'Select at least one salary'),
        paymentMethod: z.string().trim().min(1, 'Payment method is required').max(40),
        referenceNo: optText(80),
        paidAt: optDate,
    }),
});

// ── Settings ──
export const updateSettingsValidation = z.object({
    body: z.object({
        weeklyOffDays: z.array(z.number().int().min(0).max(6)).max(6).optional(),
        officeStart: z.string().regex(TIME_RE).optional(),
        officeEnd: z.string().regex(TIME_RE).optional(),
        graceMinutes: z.coerce.number().int().min(0).max(240).optional(),
        latesPerDeduction: z.coerce.number().int().min(0).max(31).optional(),
        overtimeMultiplier: z.coerce.number().min(0).max(5).optional(),
        standardMonthlyHours: z.coerce.number().min(1).max(400).optional(),
        unmarkedAsPresent: z.boolean().optional(),
        leaveTypes: z
            .array(
                z.object({
                    code: z.string().trim().regex(/^[a-z_]{2,20}$/, 'Code: lowercase letters / underscore'),
                    name: z.string().trim().min(2).max(40),
                    daysPerYear: z.coerce.number().min(0).max(365),
                    paid: z.boolean(),
                })
            )
            .min(1)
            .max(15)
            .optional(),
    }),
});
