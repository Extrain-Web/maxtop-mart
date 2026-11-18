import { Types } from 'mongoose';
import AppError from '../../utils/AppError';
import {
    Attendance,
    Department,
    Employee,
    Holiday,
    HrSettings,
    IHrSettings,
    Leave,
    Payroll,
} from './hr.models';
import {
    currentMonthBD,
    eachDate,
    escapeRegex,
    getSettings,
    monthRange,
    round2,
    todayBD,
    toMinutes,
    weekdayOf,
} from './hr.utils';

/* eslint-disable @typescript-eslint/no-explicit-any */

const ACTIVE_STATUSES = ['active', 'probation'];
const EMPLOYEE_LIST_FIELDS =
    'employeeId firstName lastName phone email designation department status employmentType photo joiningDate exitDate salary';

const assertObjectId = (id: string, label = 'ID') => {
    if (!Types.ObjectId.isValid(id)) throw new AppError(400, `Invalid ${label}`);
};

/** Employees on the payroll / attendance sheet on a given date. */
const employedOnFilter = (date: string) => ({
    joiningDate: { $lte: date },
    $or: [{ exitDate: { $exists: false } }, { exitDate: null }, { exitDate: '' }, { exitDate: { $gte: date } }],
    status: { $in: [...ACTIVE_STATUSES, 'resigned', 'terminated'] },
});

/** Employees employed at any point between start and end. */
const employedBetweenFilter = (start: string, end: string) => ({
    joiningDate: { $lte: end },
    $or: [{ exitDate: { $exists: false } }, { exitDate: null }, { exitDate: '' }, { exitDate: { $gte: start } }],
});

// ═════════════════════════════════════════════════════════════════════════════
//  SETTINGS
// ═════════════════════════════════════════════════════════════════════════════
export const SettingsService = {
    get: getSettings,

    async update(payload: Partial<IHrSettings>) {
        await getSettings();
        if (payload.leaveTypes) {
            const codes = payload.leaveTypes.map((t) => t.code);
            if (new Set(codes).size !== codes.length) throw new AppError(400, 'Leave type codes must be unique');
        }
        const { key: _k, _id, ...rest } = payload as any;
        return HrSettings.findOneAndUpdate({ key: 'default' }, rest, { new: true, runValidators: true }).lean();
    },
};

// ═════════════════════════════════════════════════════════════════════════════
//  DEPARTMENTS
// ═════════════════════════════════════════════════════════════════════════════
export const DepartmentService = {
    async list() {
        const [departments, counts] = await Promise.all([
            Department.find().populate('head', 'firstName lastName employeeId designation').sort({ name: 1 }).lean(),
            Employee.aggregate([
                { $match: { status: { $in: ACTIVE_STATUSES } } },
                {
                    $group: {
                        _id: '$department',
                        count: { $sum: 1 },
                        salary: {
                            $sum: {
                                $add: [
                                    { $ifNull: ['$salary.basic', 0] },
                                    { $ifNull: ['$salary.houseRent', 0] },
                                    { $ifNull: ['$salary.medical', 0] },
                                    { $ifNull: ['$salary.transport', 0] },
                                    { $ifNull: ['$salary.otherAllowance', 0] },
                                ],
                            },
                        },
                    },
                },
            ]),
        ]);
        const byId = new Map(counts.map((c: any) => [String(c._id), c]));
        return departments.map((d: any) => ({
            ...d,
            employeeCount: byId.get(String(d._id))?.count || 0,
            monthlySalary: byId.get(String(d._id))?.salary || 0,
        }));
    },

    async create(payload: any) {
        const exists = await Department.findOne({ name: new RegExp(`^${escapeRegex(payload.name.trim())}$`, 'i') });
        if (exists) throw new AppError(409, 'A department with this name already exists');
        return Department.create(payload);
    },

    async update(id: string, payload: any) {
        assertObjectId(id, 'department ID');
        if (payload.name) {
            const exists = await Department.findOne({
                _id: { $ne: id },
                name: new RegExp(`^${escapeRegex(payload.name.trim())}$`, 'i'),
            });
            if (exists) throw new AppError(409, 'A department with this name already exists');
        }
        const dep = await Department.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
        if (!dep) throw new AppError(404, 'Department not found');
        return dep;
    },

    async remove(id: string) {
        assertObjectId(id, 'department ID');
        const count = await Employee.countDocuments({ department: id });
        if (count > 0) {
            throw new AppError(400, `This department still has ${count} employee(s). Move them to another department first.`);
        }
        const dep = await Department.findByIdAndDelete(id);
        if (!dep) throw new AppError(404, 'Department not found');
        return dep;
    },
};

// ═════════════════════════════════════════════════════════════════════════════
//  EMPLOYEES
// ═════════════════════════════════════════════════════════════════════════════
const nextEmployeeId = async (): Promise<string> => {
    const last = await Employee.findOne({ employeeId: /^MM-EMP-\d+$/ })
        .sort({ employeeId: -1 })
        .select('employeeId')
        .lean();
    const n = last ? parseInt(last.employeeId.replace('MM-EMP-', ''), 10) + 1 : 1;
    return `MM-EMP-${String(n).padStart(4, '0')}`;
};

const validateEmployeeRefs = async (payload: any, selfId?: string) => {
    if (payload.department) {
        assertObjectId(payload.department, 'department');
        if (!(await Department.exists({ _id: payload.department }))) throw new AppError(400, 'Department not found');
    }
    if (payload.user) {
        assertObjectId(payload.user, 'user');
        const taken = await Employee.findOne({ user: payload.user, ...(selfId ? { _id: { $ne: selfId } } : {}) });
        if (taken) throw new AppError(409, 'That login account is already linked to another employee');
    }
    if (payload.exitDate && payload.joiningDate && payload.exitDate < payload.joiningDate) {
        throw new AppError(400, 'Exit date cannot be before joining date');
    }
};

export const EmployeeService = {
    async list(query: Record<string, any>) {
        const page = Math.max(Number(query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 200);
        const filter: Record<string, any> = {};

        if (query.status && query.status !== 'all') {
            filter.status = query.status === 'current' ? { $in: ACTIVE_STATUSES } : query.status;
        }
        if (query.department && query.department !== 'all') filter.department = query.department;
        if (query.employmentType && query.employmentType !== 'all') filter.employmentType = query.employmentType;
        if (query.search) {
            const rx = new RegExp(escapeRegex(String(query.search).trim()), 'i');
            filter.$or = [
                { firstName: rx },
                { lastName: rx },
                { employeeId: rx },
                { phone: rx },
                { email: rx },
                { designation: rx },
            ];
        }

        const [employees, total] = await Promise.all([
            Employee.find(filter)
                .select(EMPLOYEE_LIST_FIELDS)
                .populate('department', 'name code')
                .sort({ employeeId: 1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Employee.countDocuments(filter),
        ]);

        return {
            employees: employees.map((e) => e.toJSON()),
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
        };
    },

    async getById(id: string) {
        assertObjectId(id, 'employee ID');
        const employee = await Employee.findById(id)
            .populate('department', 'name code')
            .populate('user', 'firstName lastName email role');
        if (!employee) throw new AppError(404, 'Employee not found');

        const month = currentMonthBD();
        const { start, end } = monthRange(month);
        const year = Number(todayBD().slice(0, 4));

        const [leaveBalance, monthAttendance, recentLeaves, payrolls] = await Promise.all([
            LeaveService.balance(id, year),
            Attendance.find({ employee: id, date: { $gte: start, $lte: end } }).sort({ date: 1 }).lean(),
            Leave.find({ employee: id }).sort({ startDate: -1 }).limit(10).lean(),
            Payroll.find({ employee: id })
                .select('month netPay grossEarnings totalDeductions status paidAt payslipNo')
                .sort({ month: -1 })
                .limit(12)
                .lean(),
        ]);

        const attendanceSummary: Record<string, number> = {};
        monthAttendance.forEach((a) => {
            attendanceSummary[a.status] = (attendanceSummary[a.status] || 0) + 1;
        });

        return {
            employee: employee.toJSON(),
            leaveBalance,
            attendance: { month, records: monthAttendance, summary: attendanceSummary },
            recentLeaves,
            payrolls,
        };
    },

    async create(payload: any) {
        await validateEmployeeRefs(payload);
        // Retry once in the rare case two admins create employees at the same moment.
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const employeeId = await nextEmployeeId();
                return await Employee.create({ ...payload, employeeId });
            } catch (err: any) {
                if (err?.code === 11000 && err?.keyPattern?.employeeId && attempt < 2) continue;
                throw err;
            }
        }
        throw new AppError(500, 'Could not generate an employee ID, please try again');
    },

    async update(id: string, payload: any) {
        assertObjectId(id, 'employee ID');
        const current = await Employee.findById(id);
        if (!current) throw new AppError(404, 'Employee not found');
        await validateEmployeeRefs({ joiningDate: current.joiningDate, ...payload }, id);

        // Leaving the company: make sure an exit date is recorded.
        if (payload.status && ['resigned', 'terminated'].includes(payload.status) && !payload.exitDate && !current.exitDate) {
            payload.exitDate = todayBD();
        }
        // Coming back: clear the exit details.
        if (payload.status && ACTIVE_STATUSES.includes(payload.status)) {
            payload.exitDate = '';
            payload.exitReason = '';
        }
        // Merge nested salary instead of wiping missing parts.
        if (payload.salary) {
            payload.salary = { ...(current.salary as any)?.toObject?.() ?? current.salary, ...payload.salary };
        }
        delete payload.employeeId;

        const employee = await Employee.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).populate(
            'department',
            'name code'
        );
        return employee?.toJSON();
    },

    async remove(id: string) {
        assertObjectId(id, 'employee ID');
        const payrollCount = await Payroll.countDocuments({ employee: id });
        if (payrollCount > 0) {
            throw new AppError(
                400,
                'This employee has salary history and cannot be deleted. Change the status to Resigned or Terminated instead.'
            );
        }
        const employee = await Employee.findByIdAndDelete(id);
        if (!employee) throw new AppError(404, 'Employee not found');
        await Promise.all([
            Attendance.deleteMany({ employee: id }),
            Leave.deleteMany({ employee: id }),
            Department.updateMany({ head: id }, { head: null }),
        ]);
        return employee;
    },
};

// ═════════════════════════════════════════════════════════════════════════════
//  HOLIDAYS
// ═════════════════════════════════════════════════════════════════════════════
export const HolidayService = {
    async list(query: Record<string, any>) {
        const year = String(query.year || todayBD().slice(0, 4));
        return Holiday.find({ date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` } })
            .sort({ date: 1 })
            .lean();
    },
    async create(payload: any) {
        if (await Holiday.exists({ date: payload.date })) throw new AppError(409, 'A holiday already exists on this date');
        return Holiday.create(payload);
    },
    async remove(id: string) {
        assertObjectId(id, 'holiday ID');
        const h = await Holiday.findByIdAndDelete(id);
        if (!h) throw new AppError(404, 'Holiday not found');
        return h;
    },
};

// ═════════════════════════════════════════════════════════════════════════════
//  ATTENDANCE
// ═════════════════════════════════════════════════════════════════════════════
const computeWorkHours = (checkIn?: string, checkOut?: string) => {
    const a = toMinutes(checkIn);
    const b = toMinutes(checkOut);
    if (a === null || b === null || b <= a) return 0;
    return round2((b - a) / 60);
};

export const AttendanceService = {
    /** Sheet for one day: every employee on the books that day + their record. */
    async daily(date: string) {
        const settings = await getSettings();
        const [employees, records, holiday] = await Promise.all([
            Employee.find(employedOnFilter(date))
                .select('employeeId firstName lastName designation department photo status')
                .populate('department', 'name')
                .sort({ employeeId: 1 }),
            Attendance.find({ date }).populate('leave', 'leaveType halfDay').lean(),
            Holiday.findOne({ date }).lean(),
        ]);
        const byEmp = new Map(records.map((r) => [String(r.employee), r]));
        const isWeekend = settings.weeklyOffDays.includes(weekdayOf(date));
        const paid = await Payroll.find({ month: date.slice(0, 7), status: 'paid' }).select('employee').lean();
        const paidSet = new Set(paid.map((p) => String(p.employee)));

        const rows = employees.map((e) => {
            const record = byEmp.get(String(e._id)) || null;
            // 'paid' = salary for this month already paid; 'leave' = managed from the Leave screen.
            const locked = paidSet.has(String(e._id)) ? 'paid' : record?.leave ? 'leave' : null;
            return { employee: e.toJSON(), record, locked };
        });

        const counts: Record<string, number> = { total: rows.length, unmarked: 0 };
        rows.forEach((r) => {
            const s = r.record?.status;
            if (!s) counts.unmarked++;
            else counts[s] = (counts[s] || 0) + 1;
        });

        return {
            date,
            isWeekend,
            holiday: holiday ? { name: holiday.name } : null,
            officeStart: settings.officeStart,
            officeEnd: settings.officeEnd,
            graceMinutes: settings.graceMinutes,
            counts,
            rows,
        };
    },

    async bulkMark(payload: { date: string; records: any[] }, userId?: string) {
        const { date, records } = payload;
        if (date > todayBD()) throw new AppError(400, 'You cannot mark attendance for a future date');
        const settings = await getSettings();
        const lateAfter = (toMinutes(settings.officeStart) ?? 600) + (settings.graceMinutes || 0);

        const ids = records.map((r) => r.employee);
        const employees = await Employee.find({ _id: { $in: ids }, ...employedOnFilter(date) }).select('_id');
        const valid = new Set(employees.map((e) => String(e._id)));

        // Attendance created by an approved leave is managed from the Leave screen.
        const leaveLocked = await Attendance.find({ date, employee: { $in: ids }, leave: { $ne: null } })
            .select('employee')
            .lean();
        // Salary already paid for this month → that month's attendance is frozen.
        const paidLocked = await Payroll.find({ month: date.slice(0, 7), status: 'paid', employee: { $in: ids } })
            .select('employee')
            .lean();
        const locked = new Set([...leaveLocked, ...paidLocked].map((l) => String(l.employee)));

        const ops: any[] = [];
        const skipped: string[] = [];
        for (const r of records) {
            const empId = String(r.employee);
            if (!valid.has(empId) || locked.has(empId)) {
                skipped.push(empId);
                continue;
            }
            let status = r.status;
            // Auto-detect late arrival from the check-in time.
            const inMin = toMinutes(r.checkIn);
            if (status === 'present' && inMin !== null && inMin > lateAfter) status = 'late';

            const noTimes = ['absent', 'holiday', 'weekend', 'leave'].includes(status);
            ops.push({
                updateOne: {
                    filter: { employee: empId, date },
                    update: {
                        $set: {
                            status,
                            checkIn: noTimes ? '' : r.checkIn || '',
                            checkOut: noTimes ? '' : r.checkOut || '',
                            workHours: noTimes ? 0 : computeWorkHours(r.checkIn, r.checkOut),
                            overtimeHours: noTimes ? 0 : Math.max(Number(r.overtimeHours) || 0, 0),
                            note: r.note || '',
                            markedBy: userId || null,
                        },
                        $setOnInsert: { employee: empId, date, leave: null },
                    },
                    upsert: true,
                },
            });
        }
        if (ops.length) await Attendance.bulkWrite(ops);
        return { saved: ops.length, skipped: skipped.length };
    },

    async remove(id: string) {
        assertObjectId(id, 'attendance ID');
        const rec = await Attendance.findById(id);
        if (!rec) throw new AppError(404, 'Attendance record not found');
        if (rec.leave) throw new AppError(400, 'This day is part of an approved leave. Cancel the leave instead.');
        await rec.deleteOne();
        return rec;
    },

    /** Month grid: one row per employee, one cell per day + totals. */
    async monthly(month: string) {
        const settings = await getSettings();
        const { start, end } = monthRange(month);
        const dates = eachDate(start, end);
        const today = todayBD();

        const [employees, records, holidays] = await Promise.all([
            Employee.find(employedBetweenFilter(start, end))
                .select('employeeId firstName lastName designation department joiningDate exitDate')
                .populate('department', 'name')
                .sort({ employeeId: 1 }),
            Attendance.find({ date: { $gte: start, $lte: end } })
                .select('employee date status overtimeHours')
                .lean(),
            Holiday.find({ date: { $gte: start, $lte: end } }).lean(),
        ]);

        const holidaySet = new Map(holidays.map((h) => [h.date, h.name]));
        const recMap = new Map<string, any>();
        records.forEach((r) => recMap.set(`${r.employee}_${r.date}`, r));

        const rows = employees.map((e) => {
            const days: Record<string, string> = {};
            const summary: Record<string, number> = {
                present: 0,
                late: 0,
                half_day: 0,
                absent: 0,
                leave: 0,
                holiday: 0,
                weekend: 0,
                unmarked: 0,
                overtimeHours: 0,
            };
            for (const d of dates) {
                if (d < e.joiningDate || (e.exitDate && d > e.exitDate)) {
                    days[d] = 'na';
                    continue;
                }
                const rec = recMap.get(`${e._id}_${d}`);
                let s: string;
                if (rec) {
                    s = rec.status;
                    summary.overtimeHours += rec.overtimeHours || 0;
                } else if (holidaySet.has(d)) s = 'holiday';
                else if (settings.weeklyOffDays.includes(weekdayOf(d))) s = 'weekend';
                else if (d > today) s = 'future';
                else s = 'unmarked';
                days[d] = s;
                if (s in summary) summary[s]++;
            }
            summary.overtimeHours = round2(summary.overtimeHours);
            return { employee: e.toJSON(), days, summary };
        });

        return {
            month,
            dates,
            weeklyOffDays: settings.weeklyOffDays,
            holidays: holidays.map((h) => ({ date: h.date, name: h.name })),
            rows,
        };
    },
};

// ═════════════════════════════════════════════════════════════════════════════
//  LEAVE
// ═════════════════════════════════════════════════════════════════════════════
const leaveWorkingDates = async (start: string, end: string, settings: IHrSettings) => {
    const holidays = await Holiday.find({ date: { $gte: start, $lte: end } }).select('date').lean();
    const hs = new Set(holidays.map((h) => h.date));
    return eachDate(start, end).filter((d) => !hs.has(d) && !settings.weeklyOffDays.includes(weekdayOf(d)));
};

const checkBalance = async (employeeId: string, leaveType: string, days: number, year: number, excludeId?: string) => {
    const settings = await getSettings();
    const type = settings.leaveTypes.find((t) => t.code === leaveType);
    if (!type) throw new AppError(400, 'Unknown leave type');
    if (!type.paid || !type.daysPerYear) return; // unpaid / unlimited types have no cap
    const used = await Leave.aggregate([
        {
            $match: {
                employee: new Types.ObjectId(employeeId),
                leaveType,
                status: 'approved',
                startDate: { $gte: `${year}-01-01`, $lte: `${year}-12-31` },
                ...(excludeId ? { _id: { $ne: new Types.ObjectId(excludeId) } } : {}),
            },
        },
        { $group: { _id: null, days: { $sum: '$days' } } },
    ]);
    const remaining = type.daysPerYear - (used[0]?.days || 0);
    if (days > remaining) {
        throw new AppError(
            400,
            `Not enough ${type.name} balance — ${remaining} day(s) left this year, ${days} requested. Use Unpaid Leave for the extra days.`
        );
    }
};

/** Once a month's salary is paid, that month's attendance/leave is frozen. */
const assertSalaryNotPaid = async (employee: string, start: string, end: string) => {
    const paid = await Payroll.findOne({
        employee,
        status: 'paid',
        month: { $gte: start.slice(0, 7), $lte: end.slice(0, 7) },
    }).select('month');
    if (paid) {
        throw new AppError(400, `Salary for ${paid.month} is already paid, so this leave can't be changed. Undo that payment first.`);
    }
};

const applyLeaveToAttendance = async (leave: any, settings: IHrSettings, userId?: string) => {
    const dates = await leaveWorkingDates(leave.startDate, leave.endDate, settings);
    if (!dates.length) return;
    await Attendance.bulkWrite(
        dates.map((date): any => ({
            updateOne: {
                filter: { employee: leave.employee, date },
                update: {
                    $set: {
                        status: 'leave',
                        leave: leave._id,
                        checkIn: '',
                        checkOut: '',
                        workHours: 0,
                        overtimeHours: 0,
                        note: leave.halfDay ? 'Half-day leave' : '',
                        markedBy: userId || null,
                    },
                    $setOnInsert: { employee: leave.employee, date },
                },
                upsert: true,
            },
        }))
    );
};

export const LeaveService = {
    async list(query: Record<string, any>) {
        const page = Math.max(Number(query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 200);
        const filter: Record<string, any> = {};
        if (query.status && query.status !== 'all') filter.status = query.status;
        if (query.employee) filter.employee = query.employee;
        if (query.leaveType && query.leaveType !== 'all') filter.leaveType = query.leaveType;
        if (query.month) {
            const { start, end } = monthRange(String(query.month));
            filter.startDate = { $lte: end };
            filter.endDate = { $gte: start };
        }
        const [leaves, total, pending] = await Promise.all([
            Leave.find(filter)
                .populate({
                    path: 'employee',
                    select: 'employeeId firstName lastName designation department photo',
                    populate: { path: 'department', select: 'name' },
                })
                .populate('reviewedBy', 'firstName lastName')
                .sort({ status: 1, startDate: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Leave.countDocuments(filter),
            Leave.countDocuments({ status: 'pending' }),
        ]);
        return { leaves, pendingCount: pending, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
    },

    async create(payload: any, userId?: string) {
        const settings = await getSettings();
        assertObjectId(payload.employee, 'employee');
        const employee = await Employee.findById(payload.employee);
        if (!employee) throw new AppError(404, 'Employee not found');
        if (!['active', 'probation'].includes(employee.status)) {
            throw new AppError(400, 'Leave can only be added for current employees');
        }
        if (payload.endDate < payload.startDate) throw new AppError(400, 'End date cannot be before start date');
        if (payload.startDate.slice(0, 4) !== payload.endDate.slice(0, 4)) {
            throw new AppError(400, 'A leave cannot span two calendar years — split it into two requests');
        }
        if (payload.halfDay && payload.startDate !== payload.endDate) {
            throw new AppError(400, 'Half-day leave must start and end on the same day');
        }
        if (!settings.leaveTypes.some((t) => t.code === payload.leaveType)) throw new AppError(400, 'Unknown leave type');

        const workDates = await leaveWorkingDates(payload.startDate, payload.endDate, settings);
        const days = payload.halfDay ? 0.5 : workDates.length;
        if (days <= 0) throw new AppError(400, 'The selected dates are all weekends or holidays');

        const overlap = await Leave.findOne({
            employee: payload.employee,
            status: { $in: ['pending', 'approved'] },
            startDate: { $lte: payload.endDate },
            endDate: { $gte: payload.startDate },
        });
        if (overlap) {
            throw new AppError(409, `This overlaps an existing ${overlap.status} leave (${overlap.startDate} → ${overlap.endDate})`);
        }

        const year = Number(payload.startDate.slice(0, 4));
        const approveNow = payload.status === 'approved';
        if (approveNow) {
            await assertSalaryNotPaid(payload.employee, payload.startDate, payload.endDate);
            await checkBalance(payload.employee, payload.leaveType, days, year);
        }

        const leave = await Leave.create({
            employee: payload.employee,
            leaveType: payload.leaveType,
            startDate: payload.startDate,
            endDate: payload.endDate,
            halfDay: !!payload.halfDay,
            reason: payload.reason,
            days,
            status: approveNow ? 'approved' : 'pending',
            ...(approveNow ? { reviewedBy: userId || null, reviewedAt: new Date() } : {}),
        });
        if (approveNow) await applyLeaveToAttendance(leave, settings, userId);
        return leave;
    },

    async updateStatus(id: string, payload: { status: string; reviewNote?: string }, userId?: string) {
        assertObjectId(id, 'leave ID');
        const leave = await Leave.findById(id);
        if (!leave) throw new AppError(404, 'Leave request not found');
        const from = leave.status;
        const to = payload.status;

        const allowed: Record<string, string[]> = {
            pending: ['approved', 'rejected', 'cancelled'],
            approved: ['cancelled'],
            rejected: ['pending'],
            cancelled: ['pending'],
        };
        if (!allowed[from]?.includes(to)) throw new AppError(400, `A ${from} leave cannot be changed to ${to}`);

        const settings = await getSettings();
        if (to === 'approved' || from === 'approved') {
            await assertSalaryNotPaid(String(leave.employee), leave.startDate, leave.endDate);
        }
        if (to === 'approved') {
            await checkBalance(String(leave.employee), leave.leaveType, leave.days, Number(leave.startDate.slice(0, 4)), id);
        }
        if (from === 'approved' && to === 'cancelled') {
            await Attendance.deleteMany({ leave: leave._id });
        }

        leave.status = to as any;
        leave.reviewNote = payload.reviewNote ?? leave.reviewNote;
        leave.reviewedBy = (userId as any) || null;
        leave.reviewedAt = new Date();
        await leave.save();

        if (to === 'approved') await applyLeaveToAttendance(leave, settings, userId);
        return leave;
    },

    async remove(id: string) {
        assertObjectId(id, 'leave ID');
        const leave = await Leave.findById(id);
        if (!leave) throw new AppError(404, 'Leave request not found');
        if (leave.status === 'approved') throw new AppError(400, 'Cancel an approved leave before deleting it');
        await leave.deleteOne();
        return leave;
    },

    async balance(employeeId: string, year: number) {
        const settings = await getSettings();
        const rows = await Leave.aggregate([
            {
                $match: {
                    employee: new Types.ObjectId(employeeId),
                    status: { $in: ['approved', 'pending'] },
                    startDate: { $gte: `${year}-01-01`, $lte: `${year}-12-31` },
                },
            },
            { $group: { _id: { type: '$leaveType', status: '$status' }, days: { $sum: '$days' } } },
        ]);
        return settings.leaveTypes.map((t) => {
            const used = rows.find((r) => r._id.type === t.code && r._id.status === 'approved')?.days || 0;
            const pending = rows.find((r) => r._id.type === t.code && r._id.status === 'pending')?.days || 0;
            return {
                code: t.code,
                name: t.name,
                paid: t.paid,
                quota: t.daysPerYear,
                used,
                pending,
                remaining: t.daysPerYear ? Math.max(t.daysPerYear - used, 0) : null,
            };
        });
    },
};

// ═════════════════════════════════════════════════════════════════════════════
//  HR DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════
const daysUntilAnnual = (date: string | undefined, today: string): number | null => {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    const ty = Number(today.slice(0, 4));
    const t = Date.UTC(ty, Number(today.slice(5, 7)) - 1, Number(today.slice(8, 10)));
    let next = Date.UTC(ty, Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)));
    if (next < t) next = Date.UTC(ty + 1, Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)));
    return Math.round((next - t) / 86400000);
};

export const DashboardService = {
    async get() {
        const today = todayBD();
        const month = currentMonthBD();
        const { start, end } = monthRange(month);

        // Last 6 months, oldest first.
        const months: string[] = [];
        const [cy, cm] = month.split('-').map(Number);
        for (let i = 5; i >= 0; i--) {
            const d = new Date(Date.UTC(cy, cm - 1 - i, 1));
            months.push(d.toISOString().slice(0, 7));
        }

        const [current, byDept, todayRecords, pendingLeaves, onLeaveToday, payrollMonth, payrollTrend, newJoiners, exits, holidayToday, upcomingHolidays] =
            await Promise.all([
                Employee.find({ status: { $in: ACTIVE_STATUSES } })
                    .select('employeeId firstName lastName designation dateOfBirth joiningDate employmentType salary photo department status')
                    .lean(),
                Employee.aggregate([
                    { $match: { status: { $in: ACTIVE_STATUSES } } },
                    { $group: { _id: '$department', count: { $sum: 1 } } },
                    { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'd' } },
                    { $project: { count: 1, name: { $ifNull: [{ $arrayElemAt: ['$d.name', 0] }, 'Unassigned'] } } },
                    { $sort: { count: -1 } },
                ]),
                Attendance.find({ date: today }).select('employee status').lean(),
                Leave.find({ status: 'pending' })
                    .populate('employee', 'employeeId firstName lastName designation photo')
                    .sort({ createdAt: -1 })
                    .limit(6)
                    .lean(),
                Leave.find({ status: 'approved', startDate: { $lte: today }, endDate: { $gte: today } })
                    .populate('employee', 'employeeId firstName lastName designation photo')
                    .lean(),
                Payroll.aggregate([
                    { $match: { month } },
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 },
                            net: { $sum: '$netPay' },
                        },
                    },
                ]),
                Payroll.aggregate([
                    { $match: { month: { $in: months } } },
                    { $group: { _id: '$month', net: { $sum: '$netPay' }, paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$netPay', 0] } } } },
                ]),
                Employee.find({ joiningDate: { $gte: start, $lte: end } })
                    .select('employeeId firstName lastName designation joiningDate photo')
                    .lean(),
                Employee.find({ exitDate: { $gte: start, $lte: end } })
                    .select('employeeId firstName lastName designation exitDate status')
                    .lean(),
                Holiday.findOne({ date: today }).lean(),
                Holiday.find({ date: { $gte: today } }).sort({ date: 1 }).limit(4).lean(),
            ]);

        const settings = await getSettings();
        const currentIds = new Set(current.map((e) => String(e._id)));
        const todayCounts: Record<string, number> = {};
        todayRecords.forEach((r) => {
            if (!currentIds.has(String(r.employee))) return;
            todayCounts[r.status] = (todayCounts[r.status] || 0) + 1;
        });
        const marked = Object.values(todayCounts).reduce((a, b) => a + b, 0);

        const gross = (s: any) =>
            (s?.basic || 0) + (s?.houseRent || 0) + (s?.medical || 0) + (s?.transport || 0) + (s?.otherAllowance || 0);

        const byType: Record<string, number> = {};
        current.forEach((e) => {
            byType[e.employmentType] = (byType[e.employmentType] || 0) + 1;
        });

        const birthdays = current
            .map((e) => ({ e, in: daysUntilAnnual(e.dateOfBirth, today) }))
            .filter((x) => x.in !== null && x.in <= 30)
            .sort((a, b) => (a.in as number) - (b.in as number))
            .slice(0, 6)
            .map((x) => ({
                _id: x.e._id,
                name: `${x.e.firstName} ${x.e.lastName || ''}`.trim(),
                designation: x.e.designation,
                date: x.e.dateOfBirth,
                inDays: x.in,
            }));

        const anniversaries = current
            .map((e) => ({ e, in: daysUntilAnnual(e.joiningDate, today) }))
            .filter((x) => x.in !== null && x.in <= 30 && x.e.joiningDate.slice(0, 4) < today.slice(0, 4))
            .sort((a, b) => (a.in as number) - (b.in as number))
            .slice(0, 6)
            .map((x) => ({
                _id: x.e._id,
                name: `${x.e.firstName} ${x.e.lastName || ''}`.trim(),
                designation: x.e.designation,
                date: x.e.joiningDate,
                inDays: x.in,
                years: (x.e.joiningDate.slice(5) >= today.slice(5) ? Number(today.slice(0, 4)) : Number(today.slice(0, 4)) + 1) - Number(x.e.joiningDate.slice(0, 4)),
            }));

        const pm = (s: string) => payrollMonth.find((p) => p._id === s);
        const trendMap = new Map(payrollTrend.map((p) => [p._id, p]));

        return {
            today,
            month,
            isWeekend: settings.weeklyOffDays.includes(weekdayOf(today)),
            holidayToday: holidayToday ? holidayToday.name : null,
            headcount: {
                total: current.length,
                probation: current.filter((e) => e.status === 'probation').length,
                byDepartment: byDept.map((d: any) => ({ name: d.name, count: d.count })),
                byType,
            },
            todayAttendance: {
                present: (todayCounts.present || 0) + (todayCounts.late || 0),
                late: todayCounts.late || 0,
                halfDay: todayCounts.half_day || 0,
                absent: todayCounts.absent || 0,
                onLeave: todayCounts.leave || 0,
                unmarked: Math.max(current.length - marked, 0),
            },
            monthlySalaryBudget: current.reduce((sum, e) => sum + gross(e.salary), 0),
            payroll: {
                generated: (pm('draft')?.count || 0) + (pm('paid')?.count || 0),
                draftAmount: pm('draft')?.net || 0,
                paidAmount: pm('paid')?.net || 0,
                notGenerated: Math.max(current.length - ((pm('draft')?.count || 0) + (pm('paid')?.count || 0)), 0),
            },
            payrollTrend: months.map((m) => ({ month: m, net: trendMap.get(m)?.net || 0, paid: trendMap.get(m)?.paid || 0 })),
            pendingLeaveCount: await Leave.countDocuments({ status: 'pending' }),
            pendingLeaves,
            onLeaveToday,
            newJoiners,
            exits,
            birthdays,
            anniversaries,
            upcomingHolidays,
        };
    },
};
