"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import {
    LuArrowLeft,
    LuPencil,
    LuPhone,
    LuMail,
    LuMapPin,
    LuBriefcase,
    LuCalendarDays,
    LuIdCard,
    LuHeartPulse,
    LuBanknote,
    LuFileDown,
    LuPlane,
    LuLandmark,
    LuSmartphone,
} from 'react-icons/lu';
import { RootState } from '@/redux/store';
import { useGetEmployeeQuery } from '@/redux/api/hrApi';
import EmployeeFormModal from '@/components/hr/EmployeeFormModal';
import LeaveFormModal from '@/components/hr/LeaveFormModal';
import { downloadPayslip } from '@/lib/downloadPayslip';
import {
    ATTENDANCE_META,
    AttendanceChip,
    Avatar,
    btn,
    Card,
    EMPLOYMENT_LABEL,
    EmptyState,
    fmtDate,
    fmtMoney,
    monthLabel,
    SALARY_METHOD_LABEL,
    Skeleton,
    StatusPill,
    Tabs,
} from '@/components/hr/HrUi';

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: React.ReactNode }) => (
    <div className="flex items-start gap-3 py-2.5">
        <span className="w-8 h-8 shrink-0 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center">{icon}</span>
        <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">{label}</div>
            <div className="text-sm font-medium text-gray-800 break-words">{value || <span className="text-gray-300">Not added</span>}</div>
        </div>
    </div>
);

const yearsOfService = (joining: string, until?: string) => {
    const end = until ? new Date(until) : new Date();
    const start = new Date(joining);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (months < 1) return 'Joined recently';
    const y = Math.floor(months / 12);
    const m = months % 12;
    return [y ? `${y} yr` : '', m ? `${m} mo` : ''].filter(Boolean).join(' ');
};

export default function EmployeeProfilePage() {
    const { id } = useParams<{ id: string }>();
    const user = useSelector((s: RootState) => s.auth.user) as { role?: string; permissions?: string[] } | null;
    const isSuper = user?.role === 'superadmin';
    const canEdit = isSuper || !!user?.permissions?.includes('manage_hr');
    const canPayroll = isSuper || !!user?.permissions?.includes('manage_payroll');

    const { data, isLoading, error } = useGetEmployeeQuery(id);
    const [tab, setTab] = useState<'overview' | 'attendance' | 'leave' | 'salary'>('overview');
    const [editOpen, setEditOpen] = useState(false);
    const [leaveOpen, setLeaveOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="max-w-[1200px] mx-auto space-y-4">
                <Skeleton className="h-40" />
                <Skeleton className="h-80" />
            </div>
        );
    }
    if (error || !data) {
        return (
            <Card className="max-w-[1200px] mx-auto">
                <EmptyState title="Employee not found" text="This profile may have been deleted." action={<Link href="/dashboard/admin/hr/employees" className={btn.secondary}>Back to employees</Link>} />
            </Card>
        );
    }

    const { employee: e, leaveBalance, attendance, recentLeaves, payrolls } = data.data;
    const s = e.salary;
    const leaving = e.status === 'resigned' || e.status === 'terminated';

    const tabs = [
        { id: 'overview' as const, label: 'Overview' },
        { id: 'attendance' as const, label: 'Attendance' },
        { id: 'leave' as const, label: 'Leave' },
        ...(canPayroll ? [{ id: 'salary' as const, label: 'Salary history', count: payrolls.length }] : []),
    ];

    return (
        <div className="w-full max-w-[1200px] mx-auto space-y-5">
            <Link href="/dashboard/admin/hr/employees" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900">
                <LuArrowLeft size={16} /> All employees
            </Link>

            {/* Profile header */}
            <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="h-24 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500" />
                <div className="px-5 sm:px-7 pb-5 -mt-10 flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
                    <div className="flex items-end gap-4">
                        <Avatar name={e.fullName} photo={e.photo} size={88} />
                        <div className="pb-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">{e.fullName}</h1>
                                <StatusPill status={e.status} />
                            </div>
                            <p className="text-sm text-gray-500">
                                {e.designation}
                                {e.department?.name ? ` · ${e.department.name}` : ''} · <span className="font-mono">{e.employeeId}</span>
                            </p>
                        </div>
                    </div>
                    {canEdit && (
                        <div className="flex gap-2">
                            {!leaving && (
                                <button className={btn.secondary} onClick={() => setLeaveOpen(true)}>
                                    <LuPlane size={15} /> Add leave
                                </button>
                            )}
                            <button className={btn.primary} onClick={() => setEditOpen(true)}>
                                <LuPencil size={15} /> Edit profile
                            </button>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-gray-100 divide-x divide-gray-100">
                    {[
                        ['Gross salary', fmtMoney(e.grossSalary)],
                        ['Service', yearsOfService(e.joiningDate, e.exitDate)],
                        ['Joined', fmtDate(e.joiningDate)],
                        ['Type', EMPLOYMENT_LABEL[e.employmentType]],
                    ].map(([k, v]) => (
                        <div key={k} className="px-5 py-3">
                            <div className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">{k}</div>
                            <div className="text-sm sm:text-base font-bold text-gray-900">{v}</div>
                        </div>
                    ))}
                </div>
            </div>

            <Tabs tabs={tabs} value={tab} onChange={setTab} />

            {tab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <Card title="Contact & personal" className="lg:col-span-1">
                        <div className="px-5 py-2 divide-y divide-gray-50">
                            <InfoRow icon={<LuPhone size={15} />} label="Phone" value={<a href={`tel:${e.phone}`} className="hover:text-indigo-600">{e.phone}</a>} />
                            <InfoRow icon={<LuMail size={15} />} label="Email" value={e.email} />
                            <InfoRow icon={<LuCalendarDays size={15} />} label="Date of birth" value={e.dateOfBirth ? fmtDate(e.dateOfBirth) : undefined} />
                            <InfoRow icon={<LuIdCard size={15} />} label="NID" value={e.nid} />
                            <InfoRow icon={<LuHeartPulse size={15} />} label="Blood group / gender" value={[e.bloodGroup, e.gender].filter(Boolean).join(' · ') || undefined} />
                            <InfoRow icon={<LuMapPin size={15} />} label="Present address" value={e.presentAddress} />
                            <InfoRow icon={<LuMapPin size={15} />} label="Permanent address" value={e.permanentAddress} />
                        </div>
                    </Card>

                    <div className="lg:col-span-2 space-y-5">
                        <Card title="Salary structure" action={<span className="text-xs text-gray-400">per month</span>}>
                            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    {(
                                        [
                                            ['Basic', s.basic],
                                            ['House rent', s.houseRent],
                                            ['Medical', s.medical],
                                            ['Transport', s.transport],
                                            ['Other allowance', s.otherAllowance],
                                        ] as [string, number][]
                                    ).map(([k, v]) => (
                                        <div key={k} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">{k}</span>
                                            <span className="font-semibold text-gray-800">{fmtMoney(v)}</span>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-dashed border-gray-200">
                                        <span className="text-sm font-bold text-gray-700">Gross</span>
                                        <span className="text-lg font-black text-indigo-700">{fmtMoney(e.grossSalary)}</span>
                                    </div>
                                </div>
                                <div className="rounded-xl bg-gray-50 p-4 space-y-1">
                                    <div className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">Paid by</div>
                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                                        {e.salaryMethod === 'bank' ? <LuLandmark size={16} /> : e.salaryMethod === 'cash' ? <LuBanknote size={16} /> : <LuSmartphone size={16} />}
                                        {SALARY_METHOD_LABEL[e.salaryMethod]}
                                    </div>
                                    {e.salaryMethod === 'bank' && (
                                        <div className="text-sm text-gray-600">
                                            {e.bankName || 'Bank not set'} · <span className="font-mono">{e.bankAccountNo || '—'}</span>
                                        </div>
                                    )}
                                    {['bkash', 'nagad', 'rocket'].includes(e.salaryMethod) && <div className="text-sm text-gray-600 font-mono">{e.mobileBankingNo || 'Number not set'}</div>}
                                </div>
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <Card title="Job">
                                <div className="px-5 py-2 divide-y divide-gray-50">
                                    <InfoRow icon={<LuBriefcase size={15} />} label="Designation" value={e.designation} />
                                    <InfoRow icon={<LuCalendarDays size={15} />} label="Joining date" value={fmtDate(e.joiningDate)} />
                                    {leaving && <InfoRow icon={<LuCalendarDays size={15} />} label="Last working day" value={`${fmtDate(e.exitDate)}${e.exitReason ? ` — ${e.exitReason}` : ''}`} />}
                                </div>
                            </Card>
                            <Card title="Emergency contact">
                                <div className="px-5 py-2 divide-y divide-gray-50">
                                    <InfoRow icon={<LuHeartPulse size={15} />} label={e.emergencyContact?.relation || 'Contact'} value={e.emergencyContact?.name} />
                                    <InfoRow icon={<LuPhone size={15} />} label="Phone" value={e.emergencyContact?.phone} />
                                </div>
                            </Card>
                        </div>
                        {e.notes && (
                            <Card title="Notes">
                                <p className="p-5 text-sm text-gray-600 whitespace-pre-line">{e.notes}</p>
                            </Card>
                        )}
                    </div>
                </div>
            )}

            {tab === 'attendance' && (
                <Card title={`Attendance — ${monthLabel(attendance.month)}`} action={<Link href="/dashboard/admin/hr/attendance" className="text-xs font-semibold text-indigo-600">Open attendance →</Link>}>
                    <div className="p-5 space-y-5">
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(attendance.summary).length === 0 && <span className="text-sm text-gray-400">Nothing marked this month yet.</span>}
                            {Object.entries(attendance.summary).map(([k, v]) => (
                                <span key={k} className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${ATTENDANCE_META[k]?.cls}`}>
                                    {ATTENDANCE_META[k]?.label}: {v}
                                </span>
                            ))}
                        </div>
                        {attendance.records.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="text-[11px] uppercase tracking-wider text-gray-400">
                                            <th className="py-2 pr-4 font-semibold">Date</th>
                                            <th className="py-2 pr-4 font-semibold">Status</th>
                                            <th className="py-2 pr-4 font-semibold">In</th>
                                            <th className="py-2 pr-4 font-semibold">Out</th>
                                            <th className="py-2 pr-4 font-semibold">Hours</th>
                                            <th className="py-2 font-semibold">Note</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {[...attendance.records].reverse().map((r) => (
                                            <tr key={r._id}>
                                                <td className="py-2 pr-4 font-medium text-gray-800 whitespace-nowrap">{fmtDate(r.date, false)}</td>
                                                <td className="py-2 pr-4">
                                                    <AttendanceChip status={r.status} />
                                                </td>
                                                <td className="py-2 pr-4 font-mono text-gray-600">{r.checkIn || '—'}</td>
                                                <td className="py-2 pr-4 font-mono text-gray-600">{r.checkOut || '—'}</td>
                                                <td className="py-2 pr-4 text-gray-600">
                                                    {r.workHours ? `${r.workHours}h` : '—'}
                                                    {r.overtimeHours ? <span className="ml-1 text-emerald-600 font-semibold">+{r.overtimeHours} OT</span> : null}
                                                </td>
                                                <td className="py-2 text-gray-500">{r.note || ''}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {tab === 'leave' && (
                <div className="space-y-5">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {leaveBalance.map((b) => (
                            <div key={b.code} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                                <div className="text-xs font-bold text-gray-500">{b.name}</div>
                                {b.quota ? (
                                    <>
                                        <div className="mt-1 text-2xl font-black text-gray-900">
                                            {b.remaining}
                                            <span className="text-sm font-semibold text-gray-400"> / {b.quota} left</span>
                                        </div>
                                        <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min((b.used / b.quota) * 100, 100)}%` }} />
                                        </div>
                                    </>
                                ) : (
                                    <div className="mt-1 text-2xl font-black text-gray-900">
                                        {b.used}
                                        <span className="text-sm font-semibold text-gray-400"> days used</span>
                                    </div>
                                )}
                                {b.pending > 0 && <div className="text-[11px] text-amber-600 font-semibold mt-1.5">{b.pending} day(s) waiting for approval</div>}
                            </div>
                        ))}
                    </div>
                    <Card title="Recent leave">
                        {recentLeaves.length === 0 ? (
                            <EmptyState title="No leave taken yet" />
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {recentLeaves.map((l) => (
                                    <div key={l._id} className="px-5 py-3 flex items-center justify-between gap-3">
                                        <div>
                                            <div className="text-sm font-semibold text-gray-800">
                                                {leaveBalance.find((b) => b.code === l.leaveType)?.name || l.leaveType} · {l.days} day{l.days === 1 ? '' : 's'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {fmtDate(l.startDate)}
                                                {l.endDate !== l.startDate ? ` → ${fmtDate(l.endDate)}` : ''}
                                                {l.reason ? ` · ${l.reason}` : ''}
                                            </div>
                                        </div>
                                        <StatusPill status={l.status} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {tab === 'salary' && canPayroll && (
                <Card title="Salary history" action={<Link href="/dashboard/admin/hr/payroll" className="text-xs font-semibold text-indigo-600">Open payroll →</Link>}>
                    {payrolls.length === 0 ? (
                        <EmptyState icon={<LuBanknote size={26} />} title="No salary generated yet" text="Generate the monthly salary sheet from the Payroll page." />
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {payrolls.map((p) => (
                                <div key={p._id} className="px-5 py-3 flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-bold text-gray-900">{monthLabel(p.month)}</div>
                                        <div className="text-xs text-gray-500">
                                            Gross {fmtMoney(p.grossEarnings)} − deductions {fmtMoney(p.totalDeductions)}
                                            {p.paidAt ? ` · paid ${fmtDate(p.paidAt.slice(0, 10))}` : ''}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className="text-sm font-black text-gray-900">{fmtMoney(p.netPay)}</div>
                                            <StatusPill status={p.status} />
                                        </div>
                                        <button
                                            className={btn.icon}
                                            title="Download payslip"
                                            onClick={() => downloadPayslip(p._id, p.payslipNo).catch((err) => toast.error(err.message))}
                                        >
                                            <LuFileDown size={17} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            <EmployeeFormModal open={editOpen} onClose={() => setEditOpen(false)} employee={e} />
            <LeaveFormModal open={leaveOpen} onClose={() => setLeaveOpen(false)} employeeId={e._id} />
        </div>
    );
}
