"use client";

import React from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import {
    LuUsersRound,
    LuUserCheck,
    LuPlane,
    LuHourglass,
    LuCalendarCheck,
    LuBanknote,
    LuUserPlus,
    LuCake,
    LuAward,
    LuPartyPopper,
    LuCheck,
    LuX,
    LuArrowRight,
    LuDoorOpen,
} from 'react-icons/lu';
import { RootState } from '@/redux/store';
import { useGetHrDashboardQuery, useGetHrSettingsQuery, useUpdateLeaveStatusMutation } from '@/redux/api/hrApi';
import { Avatar, btn, Card, EMPLOYMENT_LABEL, EmptyState, errMsg, fmtDate, fmtMoney, fullName, monthLabel, PageHeader, Skeleton, StatCard, weekdayName } from '@/components/hr/HrUi';

const BAR_COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-sky-500', 'bg-rose-500', 'bg-violet-500', 'bg-slate-500'];

export default function HrOverviewPage() {
    const user = useSelector((s: RootState) => s.auth.user) as { role?: string; permissions?: string[]; firstName?: string } | null;
    const isSuper = user?.role === 'superadmin';
    const canHr = isSuper || !!user?.permissions?.includes('manage_hr');
    const canPayroll = isSuper || !!user?.permissions?.includes('manage_payroll');

    const { data, isLoading } = useGetHrDashboardQuery(undefined, { pollingInterval: 60000 });
    const [updateLeave, { isLoading: deciding }] = useUpdateLeaveStatusMutation();
    const { data: settings } = useGetHrSettingsQuery();
    const leaveName = (code: string) => settings?.data.leaveTypes.find((t) => t.code === code)?.name || code;
    const d = data?.data;

    if (isLoading || !d) {
        return (
            <div className="max-w-[1400px] mx-auto space-y-4">
                <Skeleton className="h-24" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-28" />
                    ))}
                </div>
                <Skeleton className="h-72" />
            </div>
        );
    }

    const ta = d.todayAttendance;
    const total = d.headcount.total || 1;
    const segments = [
        { k: 'Present', v: ta.present - ta.late, c: 'bg-emerald-500' },
        { k: 'Late', v: ta.late, c: 'bg-amber-400' },
        { k: 'Half day', v: ta.halfDay, c: 'bg-orange-400' },
        { k: 'On leave', v: ta.onLeave, c: 'bg-sky-400' },
        { k: 'Absent', v: ta.absent, c: 'bg-rose-500' },
        { k: 'Not marked', v: ta.unmarked, c: 'bg-gray-200' },
    ];
    const trendMax = Math.max(...d.payrollTrend.map((t) => t.net), 1);
    const deptMax = Math.max(...d.headcount.byDepartment.map((x) => x.count), 1);

    const decide = async (id: string, status: 'approved' | 'rejected') => {
        try {
            await updateLeave({ id, status }).unwrap();
            toast.success(status === 'approved' ? 'Leave approved' : 'Leave rejected');
        } catch (err) {
            toast.error(errMsg(err));
        }
    };

    const dayNote = d.holidayToday ? `🎉 ${d.holidayToday}` : d.isWeekend ? '🌤 Weekly off day' : null;

    return (
        <div className="w-full max-w-[1400px] mx-auto space-y-5">
            <PageHeader
                icon={<LuUsersRound size={22} />}
                title="HR overview"
                subtitle={`${weekdayName(d.today, 'long')}, ${fmtDate(d.today)}${dayNote ? ` · ${dayNote}` : ''}`}
                actions={
                    <>
                        {canHr && (
                            <Link href="/dashboard/admin/hr/attendance" className={btn.secondary}>
                                <LuCalendarCheck size={15} /> Mark attendance
                            </Link>
                        )}
                        {canPayroll && (
                            <Link href="/dashboard/admin/hr/payroll" className={btn.secondary}>
                                <LuBanknote size={15} /> Payroll
                            </Link>
                        )}
                        {canHr && (
                            <Link href="/dashboard/admin/hr/employees" className={btn.primary}>
                                <LuUserPlus size={15} /> Employees
                            </Link>
                        )}
                    </>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard label="Team size" value={d.headcount.total} hint={`${d.headcount.probation} on probation · ${d.newJoiners.length} joined this month`} icon={<LuUsersRound size={16} />} />
                <StatCard label="In today" value={`${ta.present}`} hint={ta.unmarked ? `${ta.unmarked} not marked yet` : 'Attendance complete'} icon={<LuUserCheck size={16} />} tone="emerald" />
                <StatCard label="On leave today" value={ta.onLeave} hint={ta.absent ? `${ta.absent} absent` : 'No absentees'} icon={<LuPlane size={16} />} tone="sky" />
                <StatCard label="Leave requests" value={d.pendingLeaveCount} hint={d.pendingLeaveCount ? 'Waiting for your decision' : 'All caught up'} icon={<LuHourglass size={16} />} tone={d.pendingLeaveCount ? 'amber' : 'gray'} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                {/* Today's attendance */}
                <Card
                    className="xl:col-span-2"
                    title="Today's attendance"
                    action={
                        canHr && (
                            <Link href="/dashboard/admin/hr/attendance" className="text-xs font-semibold text-indigo-600 inline-flex items-center gap-1">
                                Open sheet <LuArrowRight size={13} />
                            </Link>
                        )
                    }
                >
                    <div className="p-5 space-y-4">
                        <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
                            {segments.map((s) =>
                                s.v > 0 ? <div key={s.k} className={`${s.c} h-full transition-all`} style={{ width: `${(s.v / total) * 100}%` }} title={`${s.k}: ${s.v}`} /> : null
                            )}
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                            {segments.map((s) => (
                                <div key={s.k}>
                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                        <span className={`w-2 h-2 rounded-full ${s.c}`} />
                                        {s.k}
                                    </div>
                                    <div className="text-xl font-black text-gray-900">{s.v}</div>
                                </div>
                            ))}
                        </div>
                        {d.onLeaveToday.length > 0 && (
                            <div className="pt-3 border-t border-gray-50">
                                <div className="text-xs font-semibold text-gray-500 mb-2">Away today</div>
                                <div className="flex flex-wrap gap-2">
                                    {d.onLeaveToday.map((l) => (
                                        <span key={l._id} className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-sky-50 text-sky-800 text-xs font-semibold">
                                            <Avatar name={fullName(l.employee)} photo={l.employee?.photo} size={22} />
                                            {fullName(l.employee)}
                                            <span className="text-sky-500 font-normal">until {fmtDate(l.endDate, false)}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Payroll this month */}
                <Card
                    title={`Payroll · ${monthLabel(d.month)}`}
                    action={
                        canPayroll && (
                            <Link href="/dashboard/admin/hr/payroll" className="text-xs font-semibold text-indigo-600 inline-flex items-center gap-1">
                                Open <LuArrowRight size={13} />
                            </Link>
                        )
                    }
                >
                    <div className="p-5 space-y-4">
                        <div>
                            <div className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">Monthly salary bill</div>
                            <div className="text-2xl font-black text-gray-900">{fmtMoney(d.monthlySalaryBudget)}</div>
                            <div className="text-xs text-gray-500">gross of current staff</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-emerald-50 px-3 py-2">
                                <div className="text-[11px] text-emerald-700 font-semibold">Paid</div>
                                <div className="text-base font-black text-emerald-800">{fmtMoney(d.payroll.paidAmount)}</div>
                            </div>
                            <div className="rounded-xl bg-amber-50 px-3 py-2">
                                <div className="text-[11px] text-amber-700 font-semibold">Unpaid</div>
                                <div className="text-base font-black text-amber-800">{fmtMoney(d.payroll.draftAmount)}</div>
                            </div>
                        </div>
                        {d.payroll.notGenerated > 0 && (
                            <div className="text-xs text-gray-500">{d.payroll.notGenerated} employee(s) not on this month&apos;s salary sheet yet.</div>
                        )}
                        <div>
                            <div className="text-[11px] uppercase tracking-wider font-semibold text-gray-400 mb-2">Last 6 months (net)</div>
                            <div className="flex items-end gap-2">
                                {d.payrollTrend.map((t) => (
                                    <div key={t.month} className="flex-1 flex flex-col items-center gap-1" title={`${monthLabel(t.month)}: ${fmtMoney(t.net)} (paid ${fmtMoney(t.paid)})`}>
                                        <div className="w-full h-20 flex items-end">
                                            <div className="w-full rounded-t-md bg-indigo-100 relative overflow-hidden" style={{ height: t.net ? Math.max((t.net / trendMax) * 80, 6) : 2 }}>
                                                <div className="absolute bottom-0 inset-x-0 bg-indigo-500" style={{ height: t.net ? `${(t.paid / t.net) * 100}%` : 0 }} />
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-gray-500">{monthLabel(t.month).slice(0, 3)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-3 mt-2 text-[10px] text-gray-500">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-indigo-500" /> Paid</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-indigo-100" /> Unpaid</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Pending leave */}
                <Card
                    title="Leave requests"
                    action={
                        <Link href="/dashboard/admin/hr/leaves" className="text-xs font-semibold text-indigo-600 inline-flex items-center gap-1">
                            All <LuArrowRight size={13} />
                        </Link>
                    }
                >
                    {d.pendingLeaves.length === 0 ? (
                        <EmptyState title="No pending requests" text="New leave requests will show up here." />
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {d.pendingLeaves.map((l) => (
                                <div key={l._id} className="px-5 py-3 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Avatar name={fullName(l.employee)} photo={l.employee?.photo} size={32} />
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold text-gray-900 truncate">{fullName(l.employee)}</div>
                                            <div className="text-[11px] text-gray-500">
                                                {l.days}d · {fmtDate(l.startDate, false)}
                                                {l.endDate !== l.startDate ? `–${fmtDate(l.endDate, false)}` : ''} · {leaveName(l.leaveType)}
                                            </div>
                                        </div>
                                    </div>
                                    {canHr && (
                                        <div className="flex gap-1 shrink-0">
                                            <button className={`${btn.icon} !text-emerald-600 hover:!bg-emerald-50`} disabled={deciding} onClick={() => decide(l._id, 'approved')} title="Approve">
                                                <LuCheck size={16} />
                                            </button>
                                            <button className={`${btn.icon} !text-rose-600 hover:!bg-rose-50`} disabled={deciding} onClick={() => decide(l._id, 'rejected')} title="Reject">
                                                <LuX size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Team by department */}
                <Card
                    title="Team by department"
                    action={
                        canHr && (
                            <Link href="/dashboard/admin/hr/departments" className="text-xs font-semibold text-indigo-600 inline-flex items-center gap-1">
                                Manage <LuArrowRight size={13} />
                            </Link>
                        )
                    }
                >
                    <div className="p-5 space-y-3">
                        {d.headcount.byDepartment.length === 0 && <div className="text-sm text-gray-400">No employees yet.</div>}
                        {d.headcount.byDepartment.map((x, i) => (
                            <div key={x.name}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-semibold text-gray-700">{x.name}</span>
                                    <span className="text-gray-500">{x.count}</span>
                                </div>
                                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                    <div className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`} style={{ width: `${(x.count / deptMax) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                        {Object.keys(d.headcount.byType).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-2">
                                {Object.entries(d.headcount.byType).map(([k, v]) => (
                                    <span key={k} className="px-2 py-0.5 rounded-md bg-gray-100 text-[11px] font-semibold text-gray-600">
                                        {EMPLOYMENT_LABEL[k] || k}: {v}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>

                {/* Coming up */}
                <Card title="Coming up">
                    <div className="p-5 space-y-3">
                        {d.birthdays.length + d.anniversaries.length + d.upcomingHolidays.length === 0 && <div className="text-sm text-gray-400">Nothing in the next 30 days.</div>}
                        {d.birthdays.map((b) => (
                            <div key={`b${b._id}`} className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
                                    <LuCake size={16} />
                                </span>
                                <div className="text-sm">
                                    <b className="text-gray-900">{b.name}</b>&apos;s birthday
                                    <div className="text-[11px] text-gray-500">{b.inDays === 0 ? 'Today 🎂' : `in ${b.inDays} day${b.inDays === 1 ? '' : 's'}`}</div>
                                </div>
                            </div>
                        ))}
                        {d.anniversaries.map((a) => (
                            <div key={`a${a._id}`} className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                    <LuAward size={16} />
                                </span>
                                <div className="text-sm">
                                    <b className="text-gray-900">{a.name}</b> · {a.years} year{a.years === 1 ? '' : 's'} with us
                                    <div className="text-[11px] text-gray-500">{a.inDays === 0 ? 'Today' : `in ${a.inDays} day${a.inDays === 1 ? '' : 's'}`}</div>
                                </div>
                            </div>
                        ))}
                        {d.upcomingHolidays.map((h) => (
                            <div key={h._id} className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                                    <LuPartyPopper size={16} />
                                </span>
                                <div className="text-sm">
                                    <b className="text-gray-900">{h.name}</b>
                                    <div className="text-[11px] text-gray-500">
                                        {weekdayName(h.date)}, {fmtDate(h.date)}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {d.exits.length > 0 && (
                            <div className="pt-3 border-t border-gray-50 space-y-2">
                                {d.exits.map((e) => (
                                    <div key={e._id} className="flex items-center gap-3 text-sm">
                                        <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center">
                                            <LuDoorOpen size={16} />
                                        </span>
                                        <div>
                                            <b className="text-gray-900">{fullName(e)}</b> · last day {fmtDate(e.exitDate, false)}
                                            <div className="text-[11px] text-gray-500 capitalize">{e.status}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
