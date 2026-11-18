import { Schema, model, Types } from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
//  HRM data models
//  Dates that represent a calendar day (attendance, leave, holiday) are stored
//  as 'YYYY-MM-DD' strings so they never shift across time zones.
//  Payroll months are stored as 'YYYY-MM'.
// ─────────────────────────────────────────────────────────────────────────────

export const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'intern'] as const;
export const EMPLOYEE_STATUSES = ['active', 'probation', 'resigned', 'terminated'] as const;
export const SALARY_METHODS = ['cash', 'bank', 'bkash', 'nagad', 'rocket'] as const;
export const ATTENDANCE_STATUSES = ['present', 'late', 'half_day', 'absent', 'leave', 'holiday', 'weekend'] as const;
export const LEAVE_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'] as const;
export const PAYROLL_STATUSES = ['draft', 'paid'] as const;

// ── Department ──────────────────────────────────────────────────────────────
export interface IDepartment {
    _id?: Types.ObjectId;
    name: string;
    code?: string;
    description?: string;
    head?: Types.ObjectId | null;
    isActive: boolean;
}

const departmentSchema = new Schema<IDepartment>(
    {
        name: { type: String, required: true, trim: true, unique: true },
        code: { type: String, trim: true, uppercase: true },
        description: { type: String, trim: true },
        head: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);
export const Department = model<IDepartment>('Department', departmentSchema);

// ── Employee ────────────────────────────────────────────────────────────────
export interface ISalaryStructure {
    basic: number;
    houseRent: number;
    medical: number;
    transport: number;
    otherAllowance: number;
}

export interface IEmployee {
    _id?: Types.ObjectId;
    employeeId: string;
    firstName: string;
    lastName?: string;
    email?: string;
    phone: string;
    gender?: 'male' | 'female' | 'other';
    dateOfBirth?: string;
    bloodGroup?: string;
    nid?: string;
    presentAddress?: string;
    permanentAddress?: string;
    photo?: string;
    department?: Types.ObjectId | null;
    designation: string;
    employmentType: (typeof EMPLOYMENT_TYPES)[number];
    joiningDate: string;
    exitDate?: string;
    exitReason?: string;
    status: (typeof EMPLOYEE_STATUSES)[number];
    salary: ISalaryStructure;
    salaryMethod: (typeof SALARY_METHODS)[number];
    bankName?: string;
    bankAccountNo?: string;
    mobileBankingNo?: string;
    emergencyContact?: { name?: string; relation?: string; phone?: string };
    user?: Types.ObjectId | null;
    notes?: string;
}

const salarySchema = new Schema<ISalaryStructure>(
    {
        basic: { type: Number, default: 0, min: 0 },
        houseRent: { type: Number, default: 0, min: 0 },
        medical: { type: Number, default: 0, min: 0 },
        transport: { type: Number, default: 0, min: 0 },
        otherAllowance: { type: Number, default: 0, min: 0 },
    },
    { _id: false }
);

const employeeSchema = new Schema<IEmployee>(
    {
        employeeId: { type: String, required: true, unique: true, trim: true },
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, trim: true, default: '' },
        email: { type: String, trim: true, lowercase: true },
        phone: { type: String, required: true, trim: true },
        gender: { type: String, enum: ['male', 'female', 'other'] },
        dateOfBirth: { type: String },
        bloodGroup: { type: String, trim: true },
        nid: { type: String, trim: true },
        presentAddress: { type: String, trim: true },
        permanentAddress: { type: String, trim: true },
        photo: { type: String },
        department: { type: Schema.Types.ObjectId, ref: 'Department', default: null, index: true },
        designation: { type: String, required: true, trim: true },
        employmentType: { type: String, enum: EMPLOYMENT_TYPES, default: 'full_time' },
        joiningDate: { type: String, required: true },
        exitDate: { type: String },
        exitReason: { type: String, trim: true },
        status: { type: String, enum: EMPLOYEE_STATUSES, default: 'active', index: true },
        salary: { type: salarySchema, default: () => ({}) },
        salaryMethod: { type: String, enum: SALARY_METHODS, default: 'cash' },
        bankName: { type: String, trim: true },
        bankAccountNo: { type: String, trim: true },
        mobileBankingNo: { type: String, trim: true },
        emergencyContact: {
            name: { type: String, trim: true },
            relation: { type: String, trim: true },
            phone: { type: String, trim: true },
        },
        user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        notes: { type: String, trim: true },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

employeeSchema.virtual('fullName').get(function (this: IEmployee) {
    return `${this.firstName} ${this.lastName || ''}`.trim();
});
employeeSchema.virtual('grossSalary').get(function (this: IEmployee) {
    const s = this.salary || ({} as ISalaryStructure);
    return (s.basic || 0) + (s.houseRent || 0) + (s.medical || 0) + (s.transport || 0) + (s.otherAllowance || 0);
});
employeeSchema.index({ firstName: 'text', lastName: 'text', employeeId: 'text', phone: 'text', designation: 'text' });

export const Employee = model<IEmployee>('Employee', employeeSchema);

// ── Attendance ──────────────────────────────────────────────────────────────
export interface IAttendance {
    _id?: Types.ObjectId;
    employee: Types.ObjectId;
    date: string; // YYYY-MM-DD
    status: (typeof ATTENDANCE_STATUSES)[number];
    checkIn?: string; // HH:mm
    checkOut?: string; // HH:mm
    workHours?: number;
    overtimeHours?: number;
    note?: string;
    leave?: Types.ObjectId | null;
    markedBy?: Types.ObjectId | null;
}

const attendanceSchema = new Schema<IAttendance>(
    {
        employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
        date: { type: String, required: true, index: true },
        status: { type: String, enum: ATTENDANCE_STATUSES, required: true },
        checkIn: { type: String },
        checkOut: { type: String },
        workHours: { type: Number, default: 0 },
        overtimeHours: { type: Number, default: 0, min: 0 },
        note: { type: String, trim: true },
        leave: { type: Schema.Types.ObjectId, ref: 'Leave', default: null },
        markedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true }
);
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
export const Attendance = model<IAttendance>('Attendance', attendanceSchema);

// ── Holiday ─────────────────────────────────────────────────────────────────
export interface IHoliday {
    _id?: Types.ObjectId;
    name: string;
    date: string; // YYYY-MM-DD
    note?: string;
}
const holidaySchema = new Schema<IHoliday>(
    {
        name: { type: String, required: true, trim: true },
        date: { type: String, required: true, unique: true },
        note: { type: String, trim: true },
    },
    { timestamps: true }
);
export const Holiday = model<IHoliday>('Holiday', holidaySchema);

// ── Leave ───────────────────────────────────────────────────────────────────
export interface ILeave {
    _id?: Types.ObjectId;
    employee: Types.ObjectId;
    leaveType: string; // code from HrSettings.leaveTypes
    startDate: string;
    endDate: string;
    days: number;
    halfDay: boolean;
    reason?: string;
    status: (typeof LEAVE_STATUSES)[number];
    reviewedBy?: Types.ObjectId | null;
    reviewedAt?: Date;
    reviewNote?: string;
}
const leaveSchema = new Schema<ILeave>(
    {
        employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
        leaveType: { type: String, required: true },
        startDate: { type: String, required: true },
        endDate: { type: String, required: true },
        days: { type: Number, required: true, min: 0 },
        halfDay: { type: Boolean, default: false },
        reason: { type: String, trim: true },
        status: { type: String, enum: LEAVE_STATUSES, default: 'pending', index: true },
        reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        reviewedAt: { type: Date },
        reviewNote: { type: String, trim: true },
    },
    { timestamps: true }
);
export const Leave = model<ILeave>('Leave', leaveSchema);

// ── Payroll ─────────────────────────────────────────────────────────────────
export interface IPayroll {
    _id?: Types.ObjectId;
    payslipNo: string;
    employee: Types.ObjectId;
    month: string; // YYYY-MM
    snapshot: { name: string; employeeId: string; designation: string; department?: string };
    attendance: {
        daysInMonth: number;
        employedDays: number;
        workingDays: number;
        present: number;
        late: number;
        halfDay: number;
        absent: number;
        paidLeave: number;
        unpaidLeave: number;
        holidays: number;
        weekends: number;
        unmarked: number;
        overtimeHours: number;
    };
    earnings: ISalaryStructure & { overtimePay: number; bonus: number };
    deductions: {
        proRata: number;
        absent: number;
        late: number;
        unpaidLeave: number;
        advance: number;
        tax: number;
        other: number;
    };
    grossEarnings: number;
    totalDeductions: number;
    netPay: number;
    status: (typeof PAYROLL_STATUSES)[number];
    paymentMethod?: string;
    referenceNo?: string;
    paidAt?: Date;
    expense?: Types.ObjectId | null;
    note?: string;
    generatedBy?: Types.ObjectId | null;
}
const payrollSchema = new Schema<IPayroll>(
    {
        payslipNo: { type: String, required: true, unique: true },
        employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
        month: { type: String, required: true, index: true },
        snapshot: {
            name: String,
            employeeId: String,
            designation: String,
            department: String,
        },
        attendance: {
            daysInMonth: Number,
            employedDays: Number,
            workingDays: Number,
            present: Number,
            late: Number,
            halfDay: Number,
            absent: Number,
            paidLeave: Number,
            unpaidLeave: Number,
            holidays: Number,
            weekends: Number,
            unmarked: Number,
            overtimeHours: Number,
        },
        earnings: {
            basic: { type: Number, default: 0 },
            houseRent: { type: Number, default: 0 },
            medical: { type: Number, default: 0 },
            transport: { type: Number, default: 0 },
            otherAllowance: { type: Number, default: 0 },
            overtimePay: { type: Number, default: 0 },
            bonus: { type: Number, default: 0 },
        },
        deductions: {
            proRata: { type: Number, default: 0 },
            absent: { type: Number, default: 0 },
            late: { type: Number, default: 0 },
            unpaidLeave: { type: Number, default: 0 },
            advance: { type: Number, default: 0 },
            tax: { type: Number, default: 0 },
            other: { type: Number, default: 0 },
        },
        grossEarnings: { type: Number, default: 0 },
        totalDeductions: { type: Number, default: 0 },
        netPay: { type: Number, default: 0 },
        status: { type: String, enum: PAYROLL_STATUSES, default: 'draft', index: true },
        paymentMethod: { type: String },
        referenceNo: { type: String, trim: true },
        paidAt: { type: Date },
        expense: { type: Schema.Types.ObjectId, ref: 'Expense', default: null },
        note: { type: String, trim: true },
        generatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true }
);
payrollSchema.index({ employee: 1, month: 1 }, { unique: true });
export const Payroll = model<IPayroll>('Payroll', payrollSchema);

// ── HR settings (singleton) ─────────────────────────────────────────────────
export interface ILeaveType {
    code: string;
    name: string;
    daysPerYear: number;
    paid: boolean;
}
export interface IHrSettings {
    _id?: Types.ObjectId;
    key: 'default';
    weeklyOffDays: number[]; // 0 = Sunday … 6 = Saturday
    officeStart: string; // HH:mm
    officeEnd: string; // HH:mm
    graceMinutes: number;
    latesPerDeduction: number; // e.g. 3 lates = 1 day salary cut (0 = never)
    overtimeMultiplier: number; // × basic hourly rate
    standardMonthlyHours: number; // basic / this = hourly rate
    unmarkedAsPresent: boolean; // unmarked working days count as present
    leaveTypes: ILeaveType[];
}
const hrSettingsSchema = new Schema<IHrSettings>(
    {
        key: { type: String, default: 'default', unique: true },
        weeklyOffDays: { type: [Number], default: [5] },
        officeStart: { type: String, default: '10:00' },
        officeEnd: { type: String, default: '19:00' },
        graceMinutes: { type: Number, default: 15 },
        latesPerDeduction: { type: Number, default: 3 },
        overtimeMultiplier: { type: Number, default: 2 },
        standardMonthlyHours: { type: Number, default: 208 },
        unmarkedAsPresent: { type: Boolean, default: true },
        leaveTypes: {
            type: [
                {
                    _id: false,
                    code: { type: String, required: true },
                    name: { type: String, required: true },
                    daysPerYear: { type: Number, default: 0 },
                    paid: { type: Boolean, default: true },
                },
            ],
            default: () => [
                { code: 'casual', name: 'Casual Leave', daysPerYear: 10, paid: true },
                { code: 'sick', name: 'Sick Leave', daysPerYear: 14, paid: true },
                { code: 'annual', name: 'Annual Leave', daysPerYear: 15, paid: true },
                { code: 'unpaid', name: 'Unpaid Leave', daysPerYear: 0, paid: false },
            ],
        },
    },
    { timestamps: true }
);
export const HrSettings = model<IHrSettings>('HrSettings', hrSettingsSchema);
