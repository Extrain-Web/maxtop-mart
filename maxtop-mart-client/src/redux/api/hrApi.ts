import { baseApi } from './baseApi';

// ─────────────────────────────────────────────────────────────────────────────
//  HRM API — backend routes live under /api/hr (see server modules/hr)
// ─────────────────────────────────────────────────────────────────────────────

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern';
export type EmployeeStatus = 'active' | 'probation' | 'resigned' | 'terminated';
export type SalaryMethod = 'cash' | 'bank' | 'bkash' | 'nagad' | 'rocket';
export type AttendanceStatus = 'present' | 'late' | 'half_day' | 'absent' | 'leave' | 'holiday' | 'weekend';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface Salary {
    basic: number;
    houseRent: number;
    medical: number;
    transport: number;
    otherAllowance: number;
}

export interface DepartmentRef {
    _id: string;
    name: string;
    code?: string;
}

export interface Employee {
    _id: string;
    employeeId: string;
    firstName: string;
    lastName?: string;
    fullName: string;
    email?: string;
    phone: string;
    gender?: 'male' | 'female' | 'other';
    dateOfBirth?: string;
    bloodGroup?: string;
    nid?: string;
    presentAddress?: string;
    permanentAddress?: string;
    photo?: string;
    department?: DepartmentRef | null;
    designation: string;
    employmentType: EmploymentType;
    joiningDate: string;
    exitDate?: string;
    exitReason?: string;
    status: EmployeeStatus;
    salary: Salary;
    grossSalary: number;
    salaryMethod: SalaryMethod;
    bankName?: string;
    bankAccountNo?: string;
    mobileBankingNo?: string;
    emergencyContact?: { name?: string; relation?: string; phone?: string };
    user?: { _id: string; firstName: string; lastName: string; email: string; role: string } | null;
    notes?: string;
    createdAt?: string;
}

export interface Department {
    _id: string;
    name: string;
    code?: string;
    description?: string;
    head?: { _id: string; firstName: string; lastName?: string; employeeId: string; designation: string } | null;
    isActive: boolean;
    employeeCount: number;
    monthlySalary: number;
}

export interface AttendanceRecord {
    _id: string;
    employee: string;
    date: string;
    status: AttendanceStatus;
    checkIn?: string;
    checkOut?: string;
    workHours?: number;
    overtimeHours?: number;
    note?: string;
    leave?: { _id: string; leaveType: string; halfDay: boolean } | string | null;
}

export interface DailyAttendance {
    date: string;
    isWeekend: boolean;
    holiday: { name: string } | null;
    officeStart: string;
    officeEnd: string;
    graceMinutes: number;
    counts: Record<string, number>;
    rows: { employee: Employee; record: AttendanceRecord | null; locked: 'paid' | 'leave' | null }[];
}

export interface MonthlyAttendance {
    month: string;
    dates: string[];
    weeklyOffDays: number[];
    holidays: { date: string; name: string }[];
    rows: { employee: Employee; days: Record<string, string>; summary: Record<string, number> }[];
}

export interface Leave {
    _id: string;
    employee: Pick<Employee, '_id' | 'employeeId' | 'firstName' | 'lastName' | 'designation' | 'photo'> & { department?: DepartmentRef | null };
    leaveType: string;
    startDate: string;
    endDate: string;
    days: number;
    halfDay: boolean;
    reason?: string;
    status: LeaveStatus;
    reviewedBy?: { firstName: string; lastName: string } | null;
    reviewedAt?: string;
    reviewNote?: string;
    createdAt: string;
}

export interface LeaveBalance {
    code: string;
    name: string;
    paid: boolean;
    quota: number;
    used: number;
    pending: number;
    remaining: number | null;
}

export interface Holiday {
    _id: string;
    name: string;
    date: string;
    note?: string;
}

export interface LeaveType {
    code: string;
    name: string;
    daysPerYear: number;
    paid: boolean;
}

export interface HrSettings {
    weeklyOffDays: number[];
    officeStart: string;
    officeEnd: string;
    graceMinutes: number;
    latesPerDeduction: number;
    overtimeMultiplier: number;
    standardMonthlyHours: number;
    unmarkedAsPresent: boolean;
    leaveTypes: LeaveType[];
}

export interface Payroll {
    _id: string;
    payslipNo: string;
    employee: Pick<Employee, '_id' | 'employeeId' | 'firstName' | 'lastName' | 'designation' | 'photo' | 'salaryMethod'> & {
        department?: DepartmentRef | null;
    };
    month: string;
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
    earnings: Salary & { overtimePay: number; bonus: number };
    deductions: { proRata: number; absent: number; late: number; unpaidLeave: number; advance: number; tax: number; other: number };
    grossEarnings: number;
    totalDeductions: number;
    netPay: number;
    status: 'draft' | 'paid';
    paymentMethod?: string;
    referenceNo?: string;
    paidAt?: string;
    note?: string;
}

export interface PayrollSheet {
    month: string;
    monthLabel: string;
    payrolls: Payroll[];
    summary: {
        count: number;
        gross: number;
        deductions: number;
        net: number;
        paid: number;
        due: number;
        paidCount: number;
        draftCount: number;
        eligible: number;
        notGenerated: number;
    };
}

export interface HrDashboard {
    today: string;
    month: string;
    isWeekend: boolean;
    holidayToday: string | null;
    headcount: { total: number; probation: number; byDepartment: { name: string; count: number }[]; byType: Record<string, number> };
    todayAttendance: { present: number; late: number; halfDay: number; absent: number; onLeave: number; unmarked: number };
    monthlySalaryBudget: number;
    payroll: { generated: number; draftAmount: number; paidAmount: number; notGenerated: number };
    payrollTrend: { month: string; net: number; paid: number }[];
    pendingLeaveCount: number;
    pendingLeaves: Leave[];
    onLeaveToday: Leave[];
    newJoiners: Employee[];
    exits: Employee[];
    birthdays: { _id: string; name: string; designation: string; date: string; inDays: number }[];
    anniversaries: { _id: string; name: string; designation: string; date: string; inDays: number; years: number }[];
    upcomingHolidays: Holiday[];
}

export interface EmployeeDetails {
    employee: Employee;
    leaveBalance: LeaveBalance[];
    attendance: { month: string; records: AttendanceRecord[]; summary: Record<string, number> };
    recentLeaves: Omit<Leave, 'employee'>[];
    payrolls: Pick<Payroll, '_id' | 'month' | 'netPay' | 'grossEarnings' | 'totalDeductions' | 'status' | 'paidAt' | 'payslipNo'>[];
}

type Res<T> = { success: boolean; message: string; data: T };
type Meta = { page: number; limit: number; total: number; totalPages: number };

export const hrApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Dashboard & settings
        getHrDashboard: builder.query<Res<HrDashboard>, void>({
            query: () => '/hr/dashboard',
            providesTags: ['HrDashboard'],
        }),
        getHrSettings: builder.query<Res<HrSettings>, void>({
            query: () => '/hr/settings',
            providesTags: ['HrSettings'],
        }),
        updateHrSettings: builder.mutation<Res<HrSettings>, Partial<HrSettings>>({
            query: (body) => ({ url: '/hr/settings', method: 'PUT', body }),
            invalidatesTags: ['HrSettings', 'HrAttendance', 'HrDashboard', 'HrLeaves'],
        }),

        // Departments
        getDepartments: builder.query<Res<Department[]>, void>({
            query: () => '/hr/departments',
            providesTags: ['HrDepartments'],
        }),
        createDepartment: builder.mutation<Res<Department>, Record<string, unknown>>({
            query: (body) => ({ url: '/hr/departments', method: 'POST', body }),
            invalidatesTags: ['HrDepartments', 'HrDashboard'],
        }),
        updateDepartment: builder.mutation<Res<Department>, { id: string; body: Record<string, unknown> }>({
            query: ({ id, body }) => ({ url: `/hr/departments/${id}`, method: 'PATCH', body }),
            invalidatesTags: ['HrDepartments', 'HrEmployees', 'HrDashboard'],
        }),
        deleteDepartment: builder.mutation<Res<Department>, string>({
            query: (id) => ({ url: `/hr/departments/${id}`, method: 'DELETE' }),
            invalidatesTags: ['HrDepartments', 'HrDashboard'],
        }),

        // Employees
        getEmployees: builder.query<Res<{ employees: Employee[]; meta: Meta }>, Record<string, string | number | undefined>>({
            query: (params) => ({ url: '/hr/employees', params }),
            providesTags: ['HrEmployees'],
        }),
        getEmployee: builder.query<Res<EmployeeDetails>, string>({
            query: (id) => `/hr/employees/${id}`,
            providesTags: (_r, _e, id) => [{ type: 'HrEmployees', id }],
        }),
        createEmployee: builder.mutation<Res<Employee>, Record<string, unknown>>({
            query: (body) => ({ url: '/hr/employees', method: 'POST', body }),
            invalidatesTags: ['HrEmployees', 'HrDepartments', 'HrDashboard', 'HrAttendance'],
        }),
        updateEmployee: builder.mutation<Res<Employee>, { id: string; body: Record<string, unknown> }>({
            query: ({ id, body }) => ({ url: `/hr/employees/${id}`, method: 'PATCH', body }),
            invalidatesTags: (_r, _e, { id }) => ['HrEmployees', { type: 'HrEmployees', id }, 'HrDepartments', 'HrDashboard', 'HrAttendance'],
        }),
        deleteEmployee: builder.mutation<Res<Employee>, string>({
            query: (id) => ({ url: `/hr/employees/${id}`, method: 'DELETE' }),
            invalidatesTags: ['HrEmployees', 'HrDepartments', 'HrDashboard', 'HrAttendance', 'HrLeaves'],
        }),

        // Attendance
        getDailyAttendance: builder.query<Res<DailyAttendance>, string>({
            query: (date) => ({ url: '/hr/attendance/daily', params: { date } }),
            providesTags: ['HrAttendance'],
        }),
        getMonthlyAttendance: builder.query<Res<MonthlyAttendance>, string>({
            query: (month) => ({ url: '/hr/attendance/monthly', params: { month } }),
            providesTags: ['HrAttendance'],
        }),
        markAttendance: builder.mutation<
            Res<{ saved: number; skipped: number }>,
            { date: string; records: { employee: string; status: string; checkIn?: string; checkOut?: string; overtimeHours?: number; note?: string }[] }
        >({
            query: (body) => ({ url: '/hr/attendance', method: 'POST', body }),
            invalidatesTags: ['HrAttendance', 'HrDashboard', 'HrEmployees'],
        }),
        deleteAttendance: builder.mutation<Res<unknown>, string>({
            query: (id) => ({ url: `/hr/attendance/${id}`, method: 'DELETE' }),
            invalidatesTags: ['HrAttendance', 'HrDashboard'],
        }),

        // Holidays
        getHolidays: builder.query<Res<Holiday[]>, number | void>({
            query: (year) => ({ url: '/hr/holidays', params: year ? { year } : undefined }),
            providesTags: ['HrHolidays'],
        }),
        createHoliday: builder.mutation<Res<Holiday>, { name: string; date: string; note?: string }>({
            query: (body) => ({ url: '/hr/holidays', method: 'POST', body }),
            invalidatesTags: ['HrHolidays', 'HrAttendance', 'HrDashboard'],
        }),
        deleteHoliday: builder.mutation<Res<Holiday>, string>({
            query: (id) => ({ url: `/hr/holidays/${id}`, method: 'DELETE' }),
            invalidatesTags: ['HrHolidays', 'HrAttendance', 'HrDashboard'],
        }),

        // Leave
        getLeaves: builder.query<Res<{ leaves: Leave[]; pendingCount: number; meta: Meta }>, Record<string, string | number | undefined>>({
            query: (params) => ({ url: '/hr/leaves', params }),
            providesTags: ['HrLeaves'],
        }),
        getLeaveBalance: builder.query<Res<LeaveBalance[]>, { employeeId: string; year?: number }>({
            query: ({ employeeId, year }) => ({ url: `/hr/leaves/balance/${employeeId}`, params: year ? { year } : undefined }),
            providesTags: ['HrLeaves'],
        }),
        createLeave: builder.mutation<Res<Leave>, Record<string, unknown>>({
            query: (body) => ({ url: '/hr/leaves', method: 'POST', body }),
            invalidatesTags: ['HrLeaves', 'HrAttendance', 'HrDashboard', 'HrEmployees'],
        }),
        updateLeaveStatus: builder.mutation<Res<Leave>, { id: string; status: LeaveStatus; reviewNote?: string }>({
            query: ({ id, ...body }) => ({ url: `/hr/leaves/${id}/status`, method: 'PATCH', body }),
            invalidatesTags: ['HrLeaves', 'HrAttendance', 'HrDashboard', 'HrEmployees'],
        }),
        deleteLeave: builder.mutation<Res<Leave>, string>({
            query: (id) => ({ url: `/hr/leaves/${id}`, method: 'DELETE' }),
            invalidatesTags: ['HrLeaves', 'HrDashboard'],
        }),

        // Payroll
        getPayroll: builder.query<Res<PayrollSheet>, { month: string; status?: string }>({
            query: (params) => ({ url: '/hr/payroll', params }),
            providesTags: ['HrPayroll'],
        }),
        generatePayroll: builder.mutation<Res<{ month: string; created: number; updated: number; skippedPaid: number }>, { month: string; employees?: string[] }>({
            query: (body) => ({ url: '/hr/payroll/generate', method: 'POST', body }),
            invalidatesTags: ['HrPayroll', 'HrDashboard', 'HrEmployees'],
        }),
        adjustPayroll: builder.mutation<Res<Payroll>, { id: string; bonus?: number; advance?: number; tax?: number; other?: number; note?: string }>({
            query: ({ id, ...body }) => ({ url: `/hr/payroll/${id}`, method: 'PATCH', body }),
            invalidatesTags: ['HrPayroll', 'HrDashboard'],
        }),
        payPayroll: builder.mutation<Res<{ paid: number; amount: number }>, { ids: string[]; paymentMethod: string; referenceNo?: string; paidAt?: string }>({
            query: (body) => ({ url: '/hr/payroll/pay', method: 'POST', body }),
            invalidatesTags: ['HrPayroll', 'HrDashboard', 'HrEmployees', 'HrAttendance', 'Expenses'],
        }),
        undoPayroll: builder.mutation<Res<Payroll>, string>({
            query: (id) => ({ url: `/hr/payroll/${id}/undo`, method: 'POST' }),
            invalidatesTags: ['HrPayroll', 'HrDashboard', 'HrEmployees', 'HrAttendance', 'Expenses'],
        }),
        deletePayroll: builder.mutation<Res<Payroll>, string>({
            query: (id) => ({ url: `/hr/payroll/${id}`, method: 'DELETE' }),
            invalidatesTags: ['HrPayroll', 'HrDashboard'],
        }),
    }),
});

export const {
    useGetHrDashboardQuery,
    useGetHrSettingsQuery,
    useUpdateHrSettingsMutation,
    useGetDepartmentsQuery,
    useCreateDepartmentMutation,
    useUpdateDepartmentMutation,
    useDeleteDepartmentMutation,
    useGetEmployeesQuery,
    useGetEmployeeQuery,
    useCreateEmployeeMutation,
    useUpdateEmployeeMutation,
    useDeleteEmployeeMutation,
    useGetDailyAttendanceQuery,
    useGetMonthlyAttendanceQuery,
    useMarkAttendanceMutation,
    useDeleteAttendanceMutation,
    useGetHolidaysQuery,
    useCreateHolidayMutation,
    useDeleteHolidayMutation,
    useGetLeavesQuery,
    useGetLeaveBalanceQuery,
    useCreateLeaveMutation,
    useUpdateLeaveStatusMutation,
    useDeleteLeaveMutation,
    useGetPayrollQuery,
    useGeneratePayrollMutation,
    useAdjustPayrollMutation,
    usePayPayrollMutation,
    useUndoPayrollMutation,
    useDeletePayrollMutation,
} = hrApi;
