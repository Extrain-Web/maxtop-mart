import { Types } from 'mongoose';
import PDFDocument from 'pdfkit';
import AppError from '../../utils/AppError';
import { Expense } from '../expense/expense.model';
import { Attendance, Employee, Holiday, IHrSettings, IPayroll, Leave, Payroll } from './hr.models';
import { currentMonthBD, daysInMonth, eachDate, getSettings, monthLabel, monthRange, weekdayOf } from './hr.utils';

/* eslint-disable @typescript-eslint/no-explicit-any */

const taka = (n: number) => Math.round(n || 0);

/** Recalculate gross / deductions / net from the stored breakdown. */
const recalcTotals = (p: any) => {
    const e = p.earnings;
    const d = p.deductions;
    p.grossEarnings = taka(
        (e.basic || 0) + (e.houseRent || 0) + (e.medical || 0) + (e.transport || 0) + (e.otherAllowance || 0) + (e.overtimePay || 0) + (e.bonus || 0)
    );
    const ded = (d.proRata || 0) + (d.absent || 0) + (d.late || 0) + (d.unpaidLeave || 0) + (d.advance || 0) + (d.tax || 0) + (d.other || 0);
    p.totalDeductions = taka(Math.min(ded, p.grossEarnings));
    p.netPay = taka(p.grossEarnings - p.totalDeductions);
    return p;
};

/**
 * Build one employee's salary for a month from their salary structure and
 * the attendance / leave / holiday data. Pure calculation — nothing is saved.
 */
const computePayroll = (
    emp: any,
    month: string,
    settings: IHrSettings,
    holidaySet: Set<string>,
    records: Map<string, any>,
    leaveById: Map<string, any>,
    paidLeaveTypes: Set<string>,
    manual?: { bonus?: number; advance?: number; tax?: number; other?: number }
) => {
    const dim = daysInMonth(month);
    const { start, end } = monthRange(month);
    const from = emp.joiningDate > start ? emp.joiningDate : start;
    const to = emp.exitDate && emp.exitDate < end ? emp.exitDate : end;
    const employedDates = from <= to ? eachDate(from, to) : [];

    const a = {
        daysInMonth: dim,
        employedDays: employedDates.length,
        workingDays: 0,
        present: 0,
        late: 0,
        halfDay: 0,
        absent: 0,
        paidLeave: 0,
        unpaidLeave: 0,
        holidays: 0,
        weekends: 0,
        unmarked: 0,
        overtimeHours: 0,
    };

    for (const date of employedDates) {
        const rec = records.get(date);
        const isHoliday = holidaySet.has(date);
        const isWeekend = settings.weeklyOffDays.includes(weekdayOf(date));
        if (!rec) {
            if (isHoliday) a.holidays++;
            else if (isWeekend) a.weekends++;
            else a.unmarked++;
            continue;
        }
        a.overtimeHours += rec.overtimeHours || 0;
        switch (rec.status) {
            case 'present':
                a.present++;
                break;
            case 'late':
                a.present++;
                a.late++;
                break;
            case 'half_day':
                a.halfDay++;
                break;
            case 'absent':
                a.absent++;
                break;
            case 'holiday':
                a.holidays++;
                break;
            case 'weekend':
                a.weekends++;
                break;
            case 'leave': {
                const lv = rec.leave ? leaveById.get(String(rec.leave)) : null;
                const w = lv?.halfDay ? 0.5 : 1;
                if (lv?.halfDay) a.present += 0.5;
                if (lv && !paidLeaveTypes.has(lv.leaveType)) a.unpaidLeave += w;
                else a.paidLeave += w;
                break;
            }
        }
    }
    a.workingDays = a.employedDays - a.holidays - a.weekends;
    a.overtimeHours = Math.round(a.overtimeHours * 100) / 100;
    if (settings.unmarkedAsPresent) a.present += a.unmarked;

    const s = emp.salary || {};
    const gross = (s.basic || 0) + (s.houseRent || 0) + (s.medical || 0) + (s.transport || 0) + (s.otherAllowance || 0);
    const perDay = gross / dim;
    const hourly = settings.standardMonthlyHours > 0 ? (s.basic || 0) / settings.standardMonthlyHours : 0;

    const absentDays = a.absent + a.halfDay * 0.5 + (settings.unmarkedAsPresent ? 0 : a.unmarked);
    const lateDays = settings.latesPerDeduction > 0 ? Math.floor(a.late / settings.latesPerDeduction) : 0;

    const p: any = {
        attendance: a,
        earnings: {
            basic: taka(s.basic),
            houseRent: taka(s.houseRent),
            medical: taka(s.medical),
            transport: taka(s.transport),
            otherAllowance: taka(s.otherAllowance),
            overtimePay: taka(a.overtimeHours * hourly * (settings.overtimeMultiplier || 0)),
            bonus: taka(manual?.bonus || 0),
        },
        deductions: {
            proRata: taka(perDay * (dim - a.employedDays)),
            absent: taka(perDay * absentDays),
            late: taka(perDay * lateDays),
            unpaidLeave: taka(perDay * a.unpaidLeave),
            advance: taka(manual?.advance || 0),
            tax: taka(manual?.tax || 0),
            other: taka(manual?.other || 0),
        },
    };
    return recalcTotals(p);
};

const POPULATE_EMP = { path: 'employee', select: 'employeeId firstName lastName designation photo salaryMethod department', populate: { path: 'department', select: 'name' } };

const PayrollService = {
    async list(query: Record<string, any>) {
        const month = String(query.month || currentMonthBD());
        const filter: Record<string, any> = { month };
        if (query.status && query.status !== 'all') filter.status = query.status;
        if (query.employee) filter.employee = query.employee;

        const payrolls = await Payroll.find(filter).populate(POPULATE_EMP).sort({ 'snapshot.employeeId': 1 }).lean();

        const all = query.status && query.status !== 'all' ? await Payroll.find({ month }).select('status netPay grossEarnings totalDeductions').lean() : payrolls;
        const summary = all.reduce(
            (acc: any, p: any) => {
                acc.count++;
                acc.gross += p.grossEarnings;
                acc.deductions += p.totalDeductions;
                acc.net += p.netPay;
                if (p.status === 'paid') {
                    acc.paidCount++;
                    acc.paid += p.netPay;
                } else {
                    acc.draftCount++;
                    acc.due += p.netPay;
                }
                return acc;
            },
            { count: 0, gross: 0, deductions: 0, net: 0, paid: 0, due: 0, paidCount: 0, draftCount: 0 }
        );

        const { start, end } = monthRange(month);
        const eligible = await Employee.countDocuments({
            joiningDate: { $lte: end },
            $or: [{ exitDate: { $exists: false } }, { exitDate: null }, { exitDate: '' }, { exitDate: { $gte: start } }],
        });

        return { month, monthLabel: monthLabel(month), payrolls, summary: { ...summary, eligible, notGenerated: Math.max(eligible - summary.count, 0) } };
    },

    async getById(id: string) {
        if (!Types.ObjectId.isValid(id)) throw new AppError(400, 'Invalid payroll ID');
        const p = await Payroll.findById(id).populate(POPULATE_EMP).populate('expense', 'title amount').lean();
        if (!p) throw new AppError(404, 'Payroll not found');
        return p;
    },

    /** Create or refresh draft payslips for a month. Paid payslips are never touched. */
    async generate(payload: { month: string; employees?: string[] }, userId?: string) {
        const { month } = payload;
        if (month > currentMonthBD()) throw new AppError(400, 'Salary cannot be generated for a future month');

        const settings = await getSettings();
        const { start, end } = monthRange(month);
        const empFilter: Record<string, any> = {
            joiningDate: { $lte: end },
            $or: [{ exitDate: { $exists: false } }, { exitDate: null }, { exitDate: '' }, { exitDate: { $gte: start } }],
        };
        if (payload.employees?.length) empFilter._id = { $in: payload.employees };

        const employees = await Employee.find(empFilter).populate('department', 'name').lean();
        if (!employees.length) throw new AppError(400, 'No employees were on the payroll in this month');

        const empIds = employees.map((e) => e._id);
        const [records, holidays, existing] = await Promise.all([
            Attendance.find({ employee: { $in: empIds }, date: { $gte: start, $lte: end } }).lean(),
            Holiday.find({ date: { $gte: start, $lte: end } }).select('date').lean(),
            Payroll.find({ employee: { $in: empIds }, month }).lean(),
        ]);
        const leaveIds = [...new Set(records.filter((r) => r.leave).map((r) => String(r.leave)))];
        const leaves = leaveIds.length ? await Leave.find({ _id: { $in: leaveIds } }).select('leaveType halfDay').lean() : [];
        const leaveById = new Map(leaves.map((l) => [String(l._id), l]));
        const paidLeaveTypes = new Set(settings.leaveTypes.filter((t) => t.paid).map((t) => t.code));
        const holidaySet = new Set(holidays.map((h) => h.date));

        const recsByEmp = new Map<string, Map<string, any>>();
        records.forEach((r) => {
            const k = String(r.employee);
            if (!recsByEmp.has(k)) recsByEmp.set(k, new Map());
            recsByEmp.get(k)!.set(r.date, r);
        });
        const existingByEmp = new Map(existing.map((p) => [String(p.employee), p]));

        let created = 0;
        let updated = 0;
        let skippedPaid = 0;
        const yyyymm = month.replace('-', '');

        for (const emp of employees) {
            const prev = existingByEmp.get(String(emp._id));
            if (prev?.status === 'paid') {
                skippedPaid++;
                continue;
            }
            const calc = computePayroll(
                emp,
                month,
                settings,
                holidaySet,
                recsByEmp.get(String(emp._id)) || new Map(),
                leaveById,
                paidLeaveTypes,
                prev ? { bonus: prev.earnings?.bonus, advance: prev.deductions?.advance, tax: prev.deductions?.tax, other: prev.deductions?.other } : undefined
            );
            const doc = {
                ...calc,
                snapshot: {
                    name: `${emp.firstName} ${emp.lastName || ''}`.trim(),
                    employeeId: emp.employeeId,
                    designation: emp.designation,
                    department: (emp.department as any)?.name || '',
                },
                generatedBy: userId || null,
            };
            if (prev) {
                await Payroll.updateOne({ _id: prev._id }, { $set: doc });
                updated++;
            } else {
                await Payroll.create({
                    ...doc,
                    employee: emp._id,
                    month,
                    status: 'draft',
                    payslipNo: `PS-${yyyymm}-${emp.employeeId.replace(/\D/g, '').padStart(4, '0')}`,
                });
                created++;
            }
        }
        return { month, created, updated, skippedPaid };
    },

    /** Manual adjustments on a draft payslip: bonus, advance, tax, other, note. */
    async adjust(id: string, payload: { bonus?: number; advance?: number; tax?: number; other?: number; note?: string }) {
        const p = await Payroll.findById(id);
        if (!p) throw new AppError(404, 'Payroll not found');
        if (p.status === 'paid') throw new AppError(400, 'This salary is already paid. Undo the payment first to edit it.');
        if (payload.bonus !== undefined) p.earnings.bonus = taka(payload.bonus);
        if (payload.advance !== undefined) p.deductions.advance = taka(payload.advance);
        if (payload.tax !== undefined) p.deductions.tax = taka(payload.tax);
        if (payload.other !== undefined) p.deductions.other = taka(payload.other);
        if (payload.note !== undefined) p.note = payload.note;
        recalcTotals(p);
        await p.save();
        return p;
    },

    async markPaid(ids: string[], payload: { paymentMethod: string; referenceNo?: string; paidAt?: string }, userId?: string) {
        const payrolls = await Payroll.find({ _id: { $in: ids }, status: 'draft' });
        if (!payrolls.length) throw new AppError(400, 'No unpaid salary found to pay');
        const paidAt = payload.paidAt ? new Date(payload.paidAt) : new Date();

        for (const p of payrolls) {
            const expense = await Expense.create({
                type: 'staff',
                title: `Salary — ${p.snapshot.name} (${monthLabel(p.month)})`,
                amount: p.netPay,
                month: monthLabel(p.month),
                date: paidAt,
                category: 'Salary',
                staffName: p.snapshot.name,
                staffRole: p.snapshot.designation,
                paymentMethod: payload.paymentMethod,
                status: 'paid',
                referenceNo: payload.referenceNo || p.payslipNo,
                notes: `Auto-created from payroll ${p.payslipNo}`,
                createdBy: (userId as any) || undefined,
            });
            p.status = 'paid';
            p.paymentMethod = payload.paymentMethod;
            p.referenceNo = payload.referenceNo || '';
            p.paidAt = paidAt;
            p.expense = expense._id as any;
            await p.save();
        }
        return { paid: payrolls.length, amount: payrolls.reduce((s, p) => s + p.netPay, 0) };
    },

    async undoPayment(id: string) {
        const p = await Payroll.findById(id);
        if (!p) throw new AppError(404, 'Payroll not found');
        if (p.status !== 'paid') throw new AppError(400, 'This salary is not paid yet');
        if (p.expense) await Expense.findByIdAndDelete(p.expense);
        p.status = 'draft';
        p.expense = null;
        p.paidAt = undefined;
        p.paymentMethod = undefined;
        p.referenceNo = '';
        await p.save();
        return p;
    },

    async remove(id: string) {
        const p = await Payroll.findById(id);
        if (!p) throw new AppError(404, 'Payroll not found');
        if (p.status === 'paid') throw new AppError(400, 'A paid salary cannot be deleted. Undo the payment first.');
        await p.deleteOne();
        return p;
    },

    /** A4 payslip PDF. */
    async payslipPdf(id: string): Promise<{ buffer: Buffer; filename: string }> {
        const p: any = await Payroll.findById(id).populate('employee', 'employeeId phone salaryMethod bankName bankAccountNo mobileBankingNo joiningDate').lean();
        if (!p) throw new AppError(404, 'Payroll not found');
        const emp = p.employee || {};

        const buffer = await new Promise<Buffer>((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 40 });
            const chunks: Buffer[] = [];
            doc.on('data', (c) => chunks.push(c));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const L = 40;
            const W = doc.page.width - 80;
            const money = (n: number) => `BDT ${Math.round(n || 0).toLocaleString('en-US')}`;
            const brand = '#4F46E5';

            // Header band
            doc.rect(0, 0, doc.page.width, 92).fill(brand);
            // Text wordmark (the PNG logo is ~19 MB, too heavy to embed in every payslip).
            doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(20).text('MAXTOP MART', L, 28);
            doc.fillColor('#C7D2FE').font('Helvetica').fontSize(9).text('Human Resources · Salary Statement', L, 54);
            doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(22).text('PAYSLIP', L, 26, { width: W, align: 'right' });
            doc.font('Helvetica').fontSize(10).text(`${monthLabel(p.month)}  ·  ${p.payslipNo}`, L, 54, { width: W, align: 'right' });

            // Status badge
            const paid = p.status === 'paid';
            doc.roundedRect(L, 108, 70, 20, 10).fill(paid ? '#DCFCE7' : '#FEF3C7');
            doc.fillColor(paid ? '#166534' : '#92400E').font('Helvetica-Bold').fontSize(9).text(paid ? 'PAID' : 'UNPAID', L, 114, { width: 70, align: 'center' });

            // Employee block
            let y = 142;
            const info = (label: string, value: string, x: number, yy: number) => {
                doc.fillColor('#6B7280').font('Helvetica').fontSize(8.5).text(label.toUpperCase(), x, yy);
                doc.fillColor('#111827').font('Helvetica-Bold').fontSize(10.5).text(value || '—', x, yy + 11, { width: W / 3 - 10 });
            };
            const c2 = L + W / 3;
            const c3 = L + (2 * W) / 3;
            info('Employee', p.snapshot.name, L, y);
            info('Employee ID', p.snapshot.employeeId, c2, y);
            info('Designation', p.snapshot.designation, c3, y);
            y += 38;
            info('Department', p.snapshot.department || '—', L, y);
            info('Joining date', emp.joiningDate || '—', c2, y);
            const acct =
                emp.salaryMethod === 'bank'
                    ? `${emp.bankName || 'Bank'} ${emp.bankAccountNo || ''}`
                    : ['bkash', 'nagad', 'rocket'].includes(emp.salaryMethod)
                      ? `${emp.salaryMethod} ${emp.mobileBankingNo || ''}`
                      : 'Cash';
            info('Paid via', paid ? `${p.paymentMethod || ''}${p.referenceNo ? ` · ${p.referenceNo}` : ''}` : acct, c3, y);
            y += 46;

            // Attendance strip
            const at = p.attendance || {};
            doc.roundedRect(L, y, W, 46, 8).fill('#F3F4F6');
            const stats: [string, number][] = [
                ['Working days', at.workingDays],
                ['Present', at.present],
                ['Absent', at.absent],
                ['Late', at.late],
                ['Leave', (at.paidLeave || 0) + (at.unpaidLeave || 0)],
                ['Overtime h', at.overtimeHours],
            ];
            const sw = W / stats.length;
            stats.forEach(([label, val], i) => {
                doc.fillColor('#111827').font('Helvetica-Bold').fontSize(13).text(String(val ?? 0), L + i * sw, y + 9, { width: sw, align: 'center' });
                doc.fillColor('#6B7280').font('Helvetica').fontSize(8).text(label, L + i * sw, y + 28, { width: sw, align: 'center' });
            });
            y += 64;

            // Earnings & deductions tables side by side
            const colW = W / 2 - 8;
            const table = (title: string, rows: [string, number][], x: number, color: string) => {
                let ty = y;
                doc.rect(x, ty, colW, 24).fill(color);
                doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10).text(title, x + 10, ty + 7);
                ty += 24;
                rows.forEach(([label, val], i) => {
                    if (i % 2 === 0) doc.rect(x, ty, colW, 22).fill('#F9FAFB');
                    doc.fillColor('#374151').font('Helvetica').fontSize(9.5).text(label, x + 10, ty + 6.5);
                    doc.fillColor('#111827').font('Helvetica-Bold').text(money(val), x + 10, ty + 6.5, { width: colW - 20, align: 'right' });
                    ty += 22;
                });
                return ty;
            };
            const e = p.earnings || {};
            const d = p.deductions || {};
            const earnRows: [string, number][] = [
                ['Basic salary', e.basic],
                ['House rent', e.houseRent],
                ['Medical', e.medical],
                ['Transport', e.transport],
                ['Other allowance', e.otherAllowance],
                ['Overtime', e.overtimePay],
                ['Bonus', e.bonus],
            ];
            const dedRows: [string, number][] = (
                [
                    ['Not employed full month', d.proRata],
                    ['Absent days', d.absent],
                    ['Late attendance', d.late],
                    ['Unpaid leave', d.unpaidLeave],
                    ['Salary advance', d.advance],
                    ['Tax', d.tax],
                    ['Other', d.other],
                ] as [string, number][]
            ).filter(([, v], i) => v > 0 || i < 3);
            const endL = table('EARNINGS', earnRows, L, '#059669');
            const endR = table('DEDUCTIONS', dedRows, L + colW + 16, '#DC2626');
            y = Math.max(endL, endR) + 6;

            const totalRow = (label: string, val: number, x: number) => {
                doc.rect(x, y, colW, 26).fill('#E5E7EB');
                doc.fillColor('#111827').font('Helvetica-Bold').fontSize(10).text(label, x + 10, y + 8);
                doc.text(money(val), x + 10, y + 8, { width: colW - 20, align: 'right' });
            };
            totalRow('Gross earnings', p.grossEarnings, L);
            totalRow('Total deductions', p.totalDeductions, L + colW + 16);
            y += 44;

            // Net pay
            doc.roundedRect(L, y, W, 58, 10).fill(brand);
            doc.fillColor('#E0E7FF').font('Helvetica').fontSize(10).text('NET PAY', L + 18, y + 12);
            doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(22).text(money(p.netPay), L + 18, y + 26);
            if (paid && p.paidAt) {
                doc.fillColor('#E0E7FF').font('Helvetica').fontSize(9.5).text(`Paid on ${new Date(p.paidAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka' })}`, L, y + 24, { width: W - 18, align: 'right' });
            }
            y += 76;

            if (p.note) {
                doc.fillColor('#6B7280').font('Helvetica-Oblique').fontSize(9.5).text(`Note: ${p.note}`, L, y, { width: W });
                y += 24;
            }

            // Signatures
            const sy = Math.max(y + 40, doc.page.height - 130);
            doc.strokeColor('#9CA3AF').lineWidth(0.7);
            doc.moveTo(L, sy).lineTo(L + 160, sy).stroke();
            doc.moveTo(L + W - 160, sy).lineTo(L + W, sy).stroke();
            doc.fillColor('#6B7280').font('Helvetica').fontSize(9).text('Employee signature', L, sy + 6, { width: 160, align: 'center' });
            doc.text('Authorised signature', L + W - 160, sy + 6, { width: 160, align: 'center' });

            doc.fillColor('#9CA3AF').fontSize(8).text('Maxtop Mart · This is a computer-generated payslip.', L, doc.page.height - 60, { width: W, align: 'center' });
            doc.end();
        });

        return { buffer, filename: `${p.payslipNo}.pdf` };
    },
};

export type { IPayroll };
export default PayrollService;
