"use client";

import React, { useMemo, useState } from "react";
import { toast } from 'react-hot-toast';
import {
    LuBanknote,
    LuCalculator,
    LuWallet,
    LuCircleCheck,
    LuHourglass,
    LuUsers,
    LuFileDown,
    LuEye,
    LuUndo2,
    LuTrash2,
    LuInfo,
    LuSend,
} from 'react-icons/lu';
import {
    Payroll,
    useAdjustPayrollMutation,
    useDeletePayrollMutation,
    useGeneratePayrollMutation,
    useGetPayrollQuery,
    usePayPayrollMutation,
    useUndoPayrollMutation,
} from '@/redux/api/hrApi';
import { downloadPayslip } from '@/lib/downloadPayslip';
import {
    btn,
    Card,
    ConfirmDialog,
    currentMonth,
    EmptyState,
    errMsg,
    Field,
    fmtDate,
    fmtMoney,
    inputCls,
    Modal,
    MonthPicker,
    monthLabel,
    PageHeader,
    PersonCell,
    SALARY_METHOD_LABEL,
    Skeleton,
    StatCard,
    StatusPill,
    Tabs,
    todayStr,
} from '@/components/hr/HrUi';

const PAY_METHODS = ['Cash', 'Bank Transfer', 'bKash', 'Nagad', 'Rocket'];

const Line = ({ label, value, muted, negative }: { label: string; value: number; muted?: boolean; negative?: boolean }) =>
    muted && !value ? null : (
        <div className="flex justify-between text-sm py-1">
            <span className="text-gray-500">{label}</span>
            <span className={`font-semibold ${negative ? 'text-rose-600' : 'text-gray-800'}`}>
                {negative && value ? '−' : ''}
                {fmtMoney(value)}
            </span>
        </div>
    );

/* ── Payslip details + adjustments ───────────────────────────────────── */
function PayslipModal({ payroll, onClose }: { payroll: Payroll | null; onClose: () => void }) {
    if (!payroll) return null;
    return <PayslipDetails key={payroll._id} payroll={payroll} onClose={onClose} />;
}

function PayslipDetails({ payroll, onClose }: { payroll: Payroll; onClose: () => void }) {
    const [adjust, { isLoading }] = useAdjustPayrollMutation();
    const [form, setForm] = useState(() => ({
        bonus: String(payroll.earnings.bonus || ''),
        advance: String(payroll.deductions.advance || ''),
        tax: String(payroll.deductions.tax || ''),
        other: String(payroll.deductions.other || ''),
        note: payroll.note || '',
    }));
    const p = payroll;
    const editable = p.status === 'draft';
    const a = p.attendance;

    const save = async () => {
        try {
            await adjust({
                id: p._id,
                bonus: Number(form.bonus) || 0,
                advance: Number(form.advance) || 0,
                tax: Number(form.tax) || 0,
                other: Number(form.other) || 0,
                note: form.note.trim(),
            }).unwrap();
            toast.success('Payslip updated');
            onClose();
        } catch (err) {
            toast.error(errMsg(err));
        }
    };

    return (
        <Modal
            open
            onClose={onClose}
            size="lg"
            title={`${p.snapshot.name} — ${monthLabel(p.month)}`}
            subtitle={`${p.payslipNo} · ${p.snapshot.employeeId} · ${p.snapshot.designation}`}
            footer={
                <>
                    <button className={btn.secondary} onClick={() => downloadPayslip(p._id, p.payslipNo).catch((e) => toast.error(e.message))}>
                        <LuFileDown size={15} /> Payslip PDF
                    </button>
                    {editable ? (
                        <button className={btn.primary} onClick={save} disabled={isLoading}>
                            {isLoading ? 'Saving…' : 'Save adjustments'}
                        </button>
                    ) : (
                        <button className={btn.primary} onClick={onClose}>
                            Close
                        </button>
                    )}
                </>
            }
        >
            <div className="space-y-5">
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {(
                        [
                            ['Working', a.workingDays],
                            ['Present', a.present],
                            ['Absent', a.absent + a.halfDay * 0.5],
                            ['Late', a.late],
                            ['Leave', a.paidLeave + a.unpaidLeave],
                            ['OT hrs', a.overtimeHours],
                        ] as [string, number][]
                    ).map(([k, v]) => (
                        <div key={k} className="rounded-xl bg-gray-50 py-2.5 text-center">
                            <div className="text-lg font-black text-gray-900">{v}</div>
                            <div className="text-[11px] text-gray-500">{k}</div>
                        </div>
                    ))}
                </div>
                {(a.unmarked > 0 || a.employedDays < a.daysInMonth) && (
                    <div className="flex gap-2 text-xs text-gray-600 bg-sky-50 border border-sky-100 rounded-xl px-3 py-2">
                        <LuInfo size={15} className="text-sky-600 shrink-0 mt-0.5" />
                        <span>
                            {a.employedDays < a.daysInMonth && `Employed ${a.employedDays} of ${a.daysInMonth} days this month, so salary is pro-rated. `}
                            {a.unmarked > 0 && `${a.unmarked} working day(s) were not marked in attendance.`}
                        </span>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="rounded-xl border border-emerald-100 p-4">
                        <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">Earnings</div>
                        <Line label="Basic" value={p.earnings.basic} />
                        <Line label="House rent" value={p.earnings.houseRent} />
                        <Line label="Medical" value={p.earnings.medical} muted />
                        <Line label="Transport" value={p.earnings.transport} muted />
                        <Line label="Other allowance" value={p.earnings.otherAllowance} muted />
                        <Line label={`Overtime (${a.overtimeHours}h)`} value={p.earnings.overtimePay} muted />
                        <Line label="Bonus" value={p.earnings.bonus} muted />
                        <div className="flex justify-between text-sm pt-2 mt-2 border-t border-dashed font-bold">
                            <span>Gross</span>
                            <span>{fmtMoney(p.grossEarnings)}</span>
                        </div>
                    </div>
                    <div className="rounded-xl border border-rose-100 p-4">
                        <div className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-2">Deductions</div>
                        <Line label="Not employed full month" value={p.deductions.proRata} muted negative />
                        <Line label="Absent days" value={p.deductions.absent} negative />
                        <Line label="Late attendance" value={p.deductions.late} negative />
                        <Line label="Unpaid leave" value={p.deductions.unpaidLeave} muted negative />
                        <Line label="Salary advance" value={p.deductions.advance} muted negative />
                        <Line label="Tax" value={p.deductions.tax} muted negative />
                        <Line label="Other" value={p.deductions.other} muted negative />
                        <div className="flex justify-between text-sm pt-2 mt-2 border-t border-dashed font-bold text-rose-700">
                            <span>Total</span>
                            <span>
                                {p.totalDeductions ? '−' : ''}
                                {fmtMoney(p.totalDeductions)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-4">
                    <div>
                        <div className="text-xs uppercase tracking-wider text-indigo-100">Net pay</div>
                        <div className="text-2xl font-black">{fmtMoney(p.netPay)}</div>
                    </div>
                    <div className="text-right text-xs text-indigo-100">
                        <StatusPill status={p.status} />
                        {p.paidAt && <div className="mt-1">Paid {fmtDate(p.paidAt.slice(0, 10))} via {p.paymentMethod}</div>}
                    </div>
                </div>

                {editable && (
                    <div className="space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Adjustments for this month</div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <Field label="Bonus (+)">
                                <input type="number" min={0} className={inputCls} value={form.bonus} onChange={(e) => setForm({ ...form, bonus: e.target.value })} />
                            </Field>
                            <Field label="Advance (−)">
                                <input type="number" min={0} className={inputCls} value={form.advance} onChange={(e) => setForm({ ...form, advance: e.target.value })} />
                            </Field>
                            <Field label="Tax (−)">
                                <input type="number" min={0} className={inputCls} value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} />
                            </Field>
                            <Field label="Other cut (−)">
                                <input type="number" min={0} className={inputCls} value={form.other} onChange={(e) => setForm({ ...form, other: e.target.value })} />
                            </Field>
                        </div>
                        <Field label="Note on payslip">
                            <input className={inputCls} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Eid bonus" />
                        </Field>
                    </div>
                )}
            </div>
        </Modal>
    );
}

/* ── Pay modal ───────────────────────────────────────────────────────── */
type PayProps = { items: Payroll[]; onClose: () => void; onDone: () => void };

function PayModal(props: PayProps) {
    if (!props.items.length) return null;
    return <PayForm {...props} />;
}

/** Default to the employee's own salary method when paying one person. */
const defaultMethod = (items: Payroll[]) => {
    if (items.length !== 1) return 'Cash';
    const m = items[0].employee?.salaryMethod;
    const label = m === 'bank' ? 'Bank Transfer' : m ? SALARY_METHOD_LABEL[m] : 'Cash';
    return PAY_METHODS.includes(label) ? label : 'Cash';
};

function PayForm({ items, onClose, onDone }: PayProps) {
    const [pay, { isLoading }] = usePayPayrollMutation();
    const [method, setMethod] = useState(() => defaultMethod(items));
    const [ref, setRef] = useState('');
    const [date, setDate] = useState(todayStr());
    const total = items.reduce((s, p) => s + p.netPay, 0);

    const submit = async () => {
        try {
            const res = await pay({ ids: items.map((p) => p._id), paymentMethod: method, referenceNo: ref.trim() || undefined, paidAt: date }).unwrap();
            toast.success(`${res.data.paid} salary payment(s) recorded · ${fmtMoney(res.data.amount)} added to Expenses`);
            onDone();
        } catch (err) {
            toast.error(errMsg(err));
        }
    };

    return (
        <Modal
            open={items.length > 0}
            onClose={onClose}
            size="sm"
            title={items.length === 1 ? `Pay ${items[0].snapshot.name}` : `Pay ${items.length} employees`}
            subtitle="Each payment is also recorded under Expenses → Staff"
            footer={
                <>
                    <button className={btn.secondary} onClick={onClose}>
                        Cancel
                    </button>
                    <button className={btn.success} onClick={submit} disabled={isLoading}>
                        <LuSend size={15} /> {isLoading ? 'Recording…' : `Confirm ${fmtMoney(total)}`}
                    </button>
                </>
            }
        >
            <div className="space-y-4">
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-emerald-800">Total to pay</span>
                    <span className="text-2xl font-black text-emerald-800">{fmtMoney(total)}</span>
                </div>
                <Field label="Paid by">
                    <div className="flex flex-wrap gap-2">
                        {PAY_METHODS.map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setMethod(m)}
                                className={`px-3 py-1.5 text-sm font-semibold rounded-lg border ${method === m ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Payment date">
                        <input type="date" className={inputCls} value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} />
                    </Field>
                    <Field label="Transaction / ref no.">
                        <input className={inputCls} value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Optional" />
                    </Field>
                </div>
            </div>
        </Modal>
    );
}

/* ── Page ────────────────────────────────────────────────────────────── */
export default function PayrollPage() {
    const [month, setMonth] = useState(currentMonth());
    const [status, setStatus] = useState<'all' | 'draft' | 'paid'>('all');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [viewingId, setViewingId] = useState<string | null>(null);
    const [paying, setPaying] = useState<Payroll[]>([]);
    const [undoing, setUndoing] = useState<Payroll | null>(null);
    const [deleting, setDeleting] = useState<Payroll | null>(null);

    const { data, isLoading, isFetching } = useGetPayrollQuery({ month, status });
    const [generate, { isLoading: generating }] = useGeneratePayrollMutation();
    const [undo, { isLoading: undoingBusy }] = useUndoPayrollMutation();
    const [remove, { isLoading: removing }] = useDeletePayrollMutation();

    const sheet = data?.data;
    const list = useMemo(() => sheet?.payrolls || [], [sheet]);
    const s = sheet?.summary;

    // Always show the freshest copy of the open payslip.
    const viewing = viewingId ? list.find((p) => p._id === viewingId) || null : null;
    const changeMonth = (m: string) => {
        setMonth(m);
        setSelected(new Set());
    };
    const changeStatus = (v: 'all' | 'draft' | 'paid') => {
        setStatus(v);
        setSelected(new Set());
    };

    const drafts = list.filter((p) => p.status === 'draft');
    const allSelected = drafts.length > 0 && drafts.every((p) => selected.has(p._id));
    const toggle = (id: string) =>
        setSelected((prev) => {
            const n = new Set(prev);
            if (n.has(id)) n.delete(id);
            else n.add(id);
            return n;
        });

    const runGenerate = async () => {
        try {
            const res = await generate({ month }).unwrap();
            const d = res.data;
            toast.success(`Salary sheet ready: ${d.created} new, ${d.updated} recalculated${d.skippedPaid ? `, ${d.skippedPaid} already paid (untouched)` : ''}`);
        } catch (err) {
            toast.error(errMsg(err));
        }
    };

    const runUndo = async () => {
        if (!undoing) return;
        try {
            await undo(undoing._id).unwrap();
            toast.success('Payment undone — the expense entry was removed');
        } catch (err) {
            toast.error(errMsg(err));
        }
        setUndoing(null);
    };
    const runDelete = async () => {
        if (!deleting) return;
        try {
            await remove(deleting._id).unwrap();
            toast.success('Payslip removed');
        } catch (err) {
            toast.error(errMsg(err));
        }
        setDeleting(null);
    };

    const isFuture = month > currentMonth();

    return (
        <div className="w-full max-w-[1400px] mx-auto space-y-5">
            <PageHeader
                icon={<LuBanknote size={22} />}
                title="Payroll"
                subtitle="Monthly salary from attendance, leave and overtime — pay and download payslips"
                tone="amber"
                actions={
                    <>
                        <MonthPicker value={month} onChange={changeMonth} max={currentMonth()} />
                        <button className={btn.primary} onClick={runGenerate} disabled={generating || isFuture}>
                            <LuCalculator size={16} /> {generating ? 'Calculating…' : s?.count ? 'Recalculate sheet' : 'Generate salary sheet'}
                        </button>
                    </>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard label="Net salary" value={fmtMoney(s?.net)} hint={`${monthLabel(month)}`} icon={<LuWallet size={16} />} />
                <StatCard label="Paid" value={fmtMoney(s?.paid)} hint={`${s?.paidCount || 0} employee(s)`} icon={<LuCircleCheck size={16} />} tone="emerald" />
                <StatCard label="Still to pay" value={fmtMoney(s?.due)} hint={`${s?.draftCount || 0} employee(s)`} icon={<LuHourglass size={16} />} tone="amber" />
                <StatCard label="On payroll" value={`${s?.count || 0} / ${s?.eligible || 0}`} hint={s?.notGenerated ? `${s.notGenerated} not generated yet` : 'Everyone included'} icon={<LuUsers size={16} />} tone={s?.notGenerated ? 'rose' : 'sky'} />
            </div>

            {month === currentMonth() && list.length > 0 && (
                <div className="flex gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
                    <LuInfo size={17} className="shrink-0 mt-0.5" />
                    <span>
                        {monthLabel(month)} isn&apos;t over yet — the remaining days are counted as present. Click <b>Recalculate sheet</b> after the last day to include the
                        final attendance before paying.
                    </span>
                </div>
            )}

            <Card>
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-50">
                    <Tabs
                        tabs={[
                            { id: 'all', label: 'All' },
                            { id: 'draft', label: 'Unpaid', count: s?.draftCount },
                            { id: 'paid', label: 'Paid' },
                        ]}
                        value={status}
                        onChange={changeStatus}
                    />
                    {selected.size > 0 && (
                        <button className={btn.success} onClick={() => setPaying(list.filter((p) => selected.has(p._id)))}>
                            <LuSend size={15} /> Pay {selected.size} selected · {fmtMoney(list.filter((p) => selected.has(p._id)).reduce((a, p) => a + p.netPay, 0))}
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <div className="p-4 space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-14" />
                        ))}
                    </div>
                ) : list.length === 0 ? (
                    <EmptyState
                        icon={<LuCalculator size={26} />}
                        title={status === 'all' ? `No salary sheet for ${monthLabel(month)} yet` : 'Nothing here'}
                        text={status === 'all' ? 'Generate it to calculate everyone’s salary from attendance, leave and overtime. You can recalculate any time before paying.' : undefined}
                        action={
                            status === 'all' && (
                                <button className={btn.primary} onClick={runGenerate} disabled={generating || isFuture}>
                                    <LuCalculator size={16} /> Generate salary sheet
                                </button>
                            )
                        }
                    />
                ) : (
                    <div className={`overflow-x-auto ${isFetching ? 'opacity-60' : ''}`}>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[11px] uppercase tracking-wider text-gray-400 bg-gray-50/70">
                                    <th className="pl-5 pr-2 py-3 w-8">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 accent-indigo-600"
                                            checked={allSelected}
                                            disabled={!drafts.length}
                                            onChange={() => setSelected(allSelected ? new Set() : new Set(drafts.map((p) => p._id)))}
                                            title="Select all unpaid"
                                        />
                                    </th>
                                    <th className="px-3 py-3 font-semibold">Employee</th>
                                    <th className="px-3 py-3 font-semibold">Attendance</th>
                                    <th className="px-3 py-3 font-semibold text-right">Gross</th>
                                    <th className="px-3 py-3 font-semibold text-right">Deductions</th>
                                    <th className="px-3 py-3 font-semibold text-right">Net pay</th>
                                    <th className="px-3 py-3 font-semibold">Status</th>
                                    <th className="px-3 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {list.map((p) => (
                                    <tr key={p._id} className={`hover:bg-gray-50/60 ${selected.has(p._id) ? 'bg-indigo-50/40' : ''}`}>
                                        <td className="pl-5 pr-2 py-3">
                                            {p.status === 'draft' && <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={selected.has(p._id)} onChange={() => toggle(p._id)} />}
                                        </td>
                                        <td className="px-3 py-3 min-w-[220px]">
                                            <PersonCell name={p.snapshot.name} photo={p.employee?.photo} sub={`${p.snapshot.employeeId} · ${p.snapshot.designation}`} />
                                        </td>
                                        <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">
                                            <span className="text-emerald-700 font-semibold">{p.attendance.present}P</span>
                                            {' · '}
                                            <span className={p.attendance.absent + p.attendance.halfDay ? 'text-rose-600 font-semibold' : ''}>{p.attendance.absent + p.attendance.halfDay * 0.5}A</span>
                                            {' · '}
                                            <span className={p.attendance.late ? 'text-amber-600 font-semibold' : ''}>{p.attendance.late}L</span>
                                            {p.attendance.overtimeHours > 0 && <span className="text-indigo-600 font-semibold"> · {p.attendance.overtimeHours}h OT</span>}
                                        </td>
                                        <td className="px-3 py-3 text-sm text-gray-700 text-right">{fmtMoney(p.grossEarnings)}</td>
                                        <td className="px-3 py-3 text-sm text-rose-600 text-right">{p.totalDeductions ? `−${fmtMoney(p.totalDeductions)}` : '—'}</td>
                                        <td className="px-3 py-3 text-sm font-black text-gray-900 text-right">{fmtMoney(p.netPay)}</td>
                                        <td className="px-3 py-3">
                                            <StatusPill status={p.status} />
                                            {p.paidAt && <div className="text-[10px] text-gray-400 mt-0.5">{p.paymentMethod}</div>}
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex justify-end gap-1">
                                                <button className={btn.icon} title="Details & adjust" onClick={() => setViewingId(p._id)}>
                                                    <LuEye size={16} />
                                                </button>
                                                <button className={btn.icon} title="Download payslip" onClick={() => downloadPayslip(p._id, p.payslipNo).catch((e) => toast.error(e.message))}>
                                                    <LuFileDown size={16} />
                                                </button>
                                                {p.status === 'draft' ? (
                                                    <>
                                                        <button className={`${btn.icon} !text-emerald-600 hover:!bg-emerald-50`} title="Pay" onClick={() => setPaying([p])}>
                                                            <LuSend size={15} />
                                                        </button>
                                                        <button className={`${btn.icon} hover:!text-rose-600 hover:!bg-rose-50`} title="Remove from sheet" onClick={() => setDeleting(p)}>
                                                            <LuTrash2 size={15} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button className={btn.icon} title="Undo payment" onClick={() => setUndoing(p)}>
                                                        <LuUndo2 size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {status === 'all' && s && (
                                <tfoot>
                                    <tr className="bg-gray-50/80 text-sm font-bold">
                                        <td />
                                        <td className="px-3 py-3 text-gray-700" colSpan={2}>
                                            Total · {s.count} employee(s)
                                        </td>
                                        <td className="px-3 py-3 text-right text-gray-700">{fmtMoney(s.gross)}</td>
                                        <td className="px-3 py-3 text-right text-rose-600">−{fmtMoney(s.deductions)}</td>
                                        <td className="px-3 py-3 text-right text-gray-900">{fmtMoney(s.net)}</td>
                                        <td colSpan={2} />
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                )}
            </Card>

            <div className="flex gap-2 text-xs text-gray-500 px-1">
                <LuInfo size={14} className="shrink-0 mt-0.5" />
                <span>
                    Per-day salary = gross ÷ days in month. Absent and unpaid-leave days are cut at that rate; every few late arrivals cost one day (set in HR Settings).
                    Overtime is paid on the basic hourly rate. Recalculating keeps your bonus / advance adjustments; paid payslips are never changed.
                </span>
            </div>

            <PayslipModal payroll={viewing} onClose={() => setViewingId(null)} />
            <PayModal
                items={paying}
                onClose={() => setPaying([])}
                onDone={() => {
                    setPaying([]);
                    setSelected(new Set());
                }}
            />
            <ConfirmDialog
                open={!!undoing}
                title="Undo this payment?"
                confirmLabel="Undo payment"
                loading={undoingBusy}
                onClose={() => setUndoing(null)}
                onConfirm={runUndo}
                message={
                    <>
                        <b>{undoing?.snapshot.name}</b>&apos;s salary goes back to unpaid and the matching entry is removed from Expenses. Use this only if the payment was recorded by mistake.
                    </>
                }
            />
            <ConfirmDialog
                open={!!deleting}
                title="Remove from salary sheet?"
                confirmLabel="Remove"
                loading={removing}
                onClose={() => setDeleting(null)}
                onConfirm={runDelete}
                message={
                    <>
                        <b>{deleting?.snapshot.name}</b> will be removed from {monthLabel(month)}. Recalculating the sheet will add them back.
                    </>
                }
            />
        </div>
    );
}
