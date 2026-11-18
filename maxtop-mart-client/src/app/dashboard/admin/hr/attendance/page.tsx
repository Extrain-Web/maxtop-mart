"use client";

import React, { useMemo, useState } from "react";
import { toast } from 'react-hot-toast';
import { LuCalendarCheck, LuCheck, LuSave, LuLock, LuPartyPopper, LuSun, LuUserCheck, LuRotateCcw } from 'react-icons/lu';
import { AttendanceStatus, DailyAttendance, useGetDailyAttendanceQuery, useGetMonthlyAttendanceQuery, useMarkAttendanceMutation } from '@/redux/api/hrApi';
import {
    ATTENDANCE_META,
    AttendanceChip,
    btn,
    Card,
    currentMonth,
    DatePicker,
    EmptyState,
    errMsg,
    fmtDate,
    inputCls,
    MonthPicker,
    PageHeader,
    PersonCell,
    Skeleton,
    Tabs,
    todayStr,
    weekdayName,
} from '@/components/hr/HrUi';

type Row = { status: AttendanceStatus | ''; checkIn: string; checkOut: string; overtimeHours: string; note: string };

const QUICK: { id: AttendanceStatus; label: string; active: string }[] = [
    { id: 'present', label: 'Present', active: 'bg-emerald-600 text-white border-emerald-600' },
    { id: 'late', label: 'Late', active: 'bg-amber-500 text-white border-amber-500' },
    { id: 'half_day', label: 'Half', active: 'bg-orange-500 text-white border-orange-500' },
    { id: 'absent', label: 'Absent', active: 'bg-rose-600 text-white border-rose-600' },
];

const rowsFrom = (sheet?: DailyAttendance): Record<string, Row> => {
    const next: Record<string, Row> = {};
    sheet?.rows.forEach(({ employee, record }) => {
        next[employee._id] = {
            status: (record?.status as AttendanceStatus) || '',
            checkIn: record?.checkIn || '',
            checkOut: record?.checkOut || '',
            overtimeHours: record?.overtimeHours ? String(record.overtimeHours) : '',
            note: record?.note || '',
        };
    });
    return next;
};

/* ═══════════════════════════ Daily sheet ═══════════════════════════ */
function DailySheet() {
    const [date, setDate] = useState(todayStr());
    const { data, isLoading, isFetching } = useGetDailyAttendanceQuery(date);
    const [markAttendance, { isLoading: saving }] = useMarkAttendanceMutation();
    const [rows, setRows] = useState<Record<string, Row>>({});
    const [dirty, setDirty] = useState<Set<string>>(new Set());

    const sheet = data?.data;

    // Load the saved values whenever the day (or server data) changes.
    const resetFromServer = () => {
        setRows(rowsFrom(sheet));
        setDirty(new Set());
    };
    const [loadedSheet, setLoadedSheet] = useState<DailyAttendance | undefined>(undefined);
    if (sheet !== loadedSheet) {
        // React's "adjust state when a prop changes" pattern (no effect needed).
        setLoadedSheet(sheet);
        resetFromServer();
    }

    const update = (id: string, patch: Partial<Row>) => {
        setRows((r) => ({ ...r, [id]: { ...r[id], ...patch } }));
        setDirty((d) => new Set(d).add(id));
    };

    const editable = useMemo(() => (sheet ? sheet.rows.filter((r) => !r.locked) : []), [sheet]);

    const markAllPresent = () => {
        if (!sheet) return;
        let n = 0;
        editable.forEach(({ employee }) => {
            if (!rows[employee._id]?.status) {
                update(employee._id, { status: 'present', checkIn: sheet.officeStart, checkOut: sheet.officeEnd });
                n++;
            }
        });
        toast.success(n ? `${n} unmarked employee(s) set to Present — review and save` : 'Everyone already has a status');
    };

    const markAllOff = (status: 'holiday' | 'weekend') => {
        editable.forEach(({ employee }) => update(employee._id, { status, checkIn: '', checkOut: '', overtimeHours: '' }));
    };

    const save = async () => {
        const records = [...dirty]
            .map((id) => ({ id, r: rows[id] }))
            .filter(({ r }) => r?.status)
            .map(({ id, r }) => ({
                employee: id,
                status: r.status as string,
                checkIn: r.checkIn || '',
                checkOut: r.checkOut || '',
                overtimeHours: Number(r.overtimeHours) || 0,
                note: r.note.trim(),
            }));
        if (!records.length) return toast.error('Pick a status for at least one employee');
        try {
            const res = await markAttendance({ date, records }).unwrap();
            toast.success(res.message + (res.data.skipped ? ` · ${res.data.skipped} locked row(s) skipped` : ''));
        } catch (err) {
            toast.error(errMsg(err, 'Could not save attendance'));
        }
    };

    const counts = useMemo(() => {
        const c: Record<string, number> = {};
        Object.values(rows).forEach((r) => {
            const k = r.status || 'unmarked';
            c[k] = (c[k] || 0) + 1;
        });
        return c;
    }, [rows]);

    return (
        <div className="space-y-4">
            <Card>
                <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <DatePicker value={date} onChange={setDate} max={todayStr()} />
                        <div className="text-sm text-gray-600">
                            <b className="text-gray-900">{weekdayName(date, 'long')}</b>, {fmtDate(date)}
                            {date === todayStr() && <span className="ml-2 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold">Today</span>}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button className={btn.secondary} onClick={markAllPresent} disabled={!editable.length}>
                            <LuUserCheck size={15} /> Mark rest present
                        </button>
                        {sheet?.holiday && (
                            <button className={btn.secondary} onClick={() => markAllOff('holiday')}>
                                <LuPartyPopper size={15} /> All on holiday
                            </button>
                        )}
                        {sheet?.isWeekend && (
                            <button className={btn.secondary} onClick={() => markAllOff('weekend')}>
                                <LuSun size={15} /> All weekly off
                            </button>
                        )}
                    </div>
                </div>
                {(sheet?.holiday || sheet?.isWeekend) && (
                    <div className={`mx-4 mb-4 px-4 py-2.5 rounded-xl text-sm font-medium ${sheet.holiday ? 'bg-violet-50 text-violet-700' : 'bg-gray-100 text-gray-600'}`}>
                        {sheet.holiday ? `🎉 ${sheet.holiday.name} — public holiday.` : '🌤 This is a weekly off day.'} You don&apos;t need to mark attendance unless someone worked (add overtime for them).
                    </div>
                )}
                <div className="px-4 pb-4 flex flex-wrap gap-2">
                    {['present', 'late', 'half_day', 'absent', 'leave', 'unmarked'].map((k) => (
                        <span key={k} className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${ATTENDANCE_META[k].cls}`}>
                            {ATTENDANCE_META[k].label}: {counts[k] || 0}
                        </span>
                    ))}
                    {sheet && (
                        <span className="px-2.5 py-1 text-xs text-gray-500">
                            Office {sheet.officeStart}–{sheet.officeEnd} · late after {sheet.graceMinutes} min grace
                        </span>
                    )}
                </div>
            </Card>

            <Card className={isFetching ? 'opacity-70 transition-opacity' : ''}>
                {isLoading ? (
                    <div className="p-4 space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-16" />
                        ))}
                    </div>
                ) : !sheet?.rows.length ? (
                    <EmptyState icon={<LuCalendarCheck size={26} />} title="No employees on this date" text="Add employees first, or pick a date after their joining date." />
                ) : (
                    <div className="divide-y divide-gray-50">
                        {sheet.rows.map(({ employee, locked, record }) => {
                            const r = rows[employee._id];
                            if (!r) return null;
                            const needsTime = r.status === 'present' || r.status === 'late' || r.status === 'half_day';
                            const off = r.status === 'holiday' || r.status === 'weekend';
                            return (
                                <div key={employee._id} className={`p-4 flex flex-col 2xl:flex-row 2xl:items-center gap-3 ${dirty.has(employee._id) ? 'bg-indigo-50/40' : ''}`}>
                                    <div className="2xl:w-60 shrink-0">
                                        <PersonCell name={employee.fullName} photo={employee.photo} sub={`${employee.employeeId} · ${employee.designation}`} href={`/dashboard/admin/hr/employees/${employee._id}`} />
                                    </div>
                                    {locked ? (
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            {record && <AttendanceChip status={record.status} />}
                                            <LuLock size={14} />
                                            {locked === 'paid' ? 'Salary for this month is already paid — attendance is locked' : 'Approved leave — change it from the Leave page'}
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-wrap items-center gap-x-4 gap-y-2">
                                            <div className="flex flex-nowrap gap-1.5">
                                                {QUICK.map((q) => (
                                                    <button
                                                        key={q.id}
                                                        onClick={() =>
                                                            update(employee._id, {
                                                                status: q.id,
                                                                ...(q.id === 'absent' ? { checkIn: '', checkOut: '', overtimeHours: '' } : !r.checkIn && sheet ? { checkIn: q.id === 'late' ? '' : sheet.officeStart } : {}),
                                                            })
                                                        }
                                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${r.status === q.id ? q.active : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                                                    >
                                                        {q.label}
                                                    </button>
                                                ))}
                                                {off && <AttendanceChip status={r.status} />}
                                            </div>
                                            {needsTime && (
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <input type="time" className={`${inputCls} !w-[128px] !py-1.5`} value={r.checkIn} onChange={(e) => update(employee._id, { checkIn: e.target.value })} title="Check-in" />
                                                    <span className="text-gray-300">→</span>
                                                    <input type="time" className={`${inputCls} !w-[128px] !py-1.5`} value={r.checkOut} onChange={(e) => update(employee._id, { checkOut: e.target.value })} title="Check-out" />
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={16}
                                                        step={0.5}
                                                        placeholder="OT h"
                                                        className={`${inputCls} !w-[84px] !py-1.5`}
                                                        value={r.overtimeHours}
                                                        onChange={(e) => update(employee._id, { overtimeHours: e.target.value })}
                                                        title="Overtime hours"
                                                    />
                                                </div>
                                            )}
                                            <input className={`${inputCls} !py-1.5 !w-auto flex-1 min-w-[160px] max-w-[260px]`} placeholder="Note (optional)" value={r.note} onChange={(e) => update(employee._id, { note: e.target.value })} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {dirty.size > 0 && (
                <div className="sticky bottom-4 z-20 flex justify-center">
                    <div className="flex items-center gap-3 bg-slate-900 text-white pl-5 pr-2 py-2 rounded-2xl shadow-2xl">
                        <span className="text-sm">
                            <b>{dirty.size}</b> unsaved change{dirty.size === 1 ? '' : 's'}
                        </span>
                        <button
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-300 hover:text-white"
                            onClick={resetFromServer}
                        >
                            <LuRotateCcw size={14} /> Discard
                        </button>
                        <button className={btn.success} onClick={save} disabled={saving}>
                            <LuSave size={15} /> {saving ? 'Saving…' : 'Save attendance'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════ Monthly report ═══════════════════════════ */
function MonthlyReport() {
    const [month, setMonth] = useState(currentMonth());
    const { data, isLoading, isFetching } = useGetMonthlyAttendanceQuery(month);
    const m = data?.data;
    const holidayNames = new Map(m?.holidays.map((h) => [h.date, h.name]));

    return (
        <Card>
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-50">
                <MonthPicker value={month} onChange={setMonth} max={currentMonth()} />
                <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                    {['present', 'late', 'half_day', 'absent', 'leave', 'holiday', 'weekend'].map((k) => (
                        <span key={k} className="inline-flex items-center gap-1.5 text-[11px] text-gray-600">
                            <span className={`w-5 h-5 rounded border text-[9px] font-bold flex items-center justify-center ${ATTENDANCE_META[k].cls}`}>{ATTENDANCE_META[k].short}</span>
                            {ATTENDANCE_META[k].label}
                        </span>
                    ))}
                </div>
            </div>
            {isLoading ? (
                <div className="p-4">
                    <Skeleton className="h-64" />
                </div>
            ) : !m?.rows.length ? (
                <EmptyState title="No employees in this month" />
            ) : (
                <div className={`overflow-x-auto ${isFetching ? 'opacity-60' : ''}`}>
                    <table className="text-left border-separate border-spacing-0">
                        <thead>
                            <tr>
                                <th className="sticky left-0 z-10 bg-white px-4 py-2 text-[11px] uppercase tracking-wider text-gray-400 font-semibold min-w-[200px] border-b border-gray-100">Employee</th>
                                {m.dates.map((d) => {
                                    const wk = m.weeklyOffDays.includes(new Date(d + 'T00:00:00Z').getUTCDay());
                                    return (
                                        <th key={d} title={holidayNames.get(d) || weekdayName(d, 'long')} className={`px-0.5 py-2 text-center border-b border-gray-100 ${holidayNames.has(d) ? 'text-violet-600' : wk ? 'text-gray-300' : 'text-gray-500'}`}>
                                            <div className="text-[10px] font-medium">{weekdayName(d).slice(0, 2)}</div>
                                            <div className="text-xs font-bold">{Number(d.slice(8))}</div>
                                        </th>
                                    );
                                })}
                                {['P', 'L', 'A', 'LV', 'OT'].map((h) => (
                                    <th key={h} className="px-2 py-2 text-center text-[11px] font-bold text-gray-500 border-b border-gray-100 bg-gray-50/70">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {m.rows.map(({ employee, days, summary }) => (
                                <tr key={employee._id} className="group">
                                    <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 px-4 py-1.5 border-b border-gray-50">
                                        <div className="text-sm font-semibold text-gray-900 truncate max-w-[190px]">{employee.fullName}</div>
                                        <div className="text-[11px] text-gray-400 font-mono">{employee.employeeId}</div>
                                    </td>
                                    {m.dates.map((d) => {
                                        const s = days[d];
                                        const meta = ATTENDANCE_META[s] || ATTENDANCE_META.unmarked;
                                        return (
                                            <td key={d} className="px-0.5 py-1.5 border-b border-gray-50 group-hover:bg-gray-50">
                                                <div title={`${fmtDate(d)} · ${meta.label || ''}`} className={`w-7 h-7 rounded-md border text-[10px] font-bold flex items-center justify-center ${meta.cls}`}>
                                                    {meta.short}
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td className="px-2 text-center text-sm font-bold text-emerald-700 border-b border-gray-50 bg-gray-50/40">{summary.present + summary.late}</td>
                                    <td className="px-2 text-center text-sm font-bold text-amber-600 border-b border-gray-50 bg-gray-50/40">{summary.late}</td>
                                    <td className="px-2 text-center text-sm font-bold text-rose-600 border-b border-gray-50 bg-gray-50/40">{summary.absent + summary.half_day * 0.5}</td>
                                    <td className="px-2 text-center text-sm font-bold text-sky-600 border-b border-gray-50 bg-gray-50/40">{summary.leave}</td>
                                    <td className="px-2 text-center text-sm font-bold text-gray-700 border-b border-gray-50 bg-gray-50/40">{summary.overtimeHours || ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
}

export default function AttendancePage() {
    const [tab, setTab] = useState<'daily' | 'monthly'>('daily');
    return (
        <div className="w-full max-w-[1400px] mx-auto space-y-5">
            <PageHeader
                icon={<LuCalendarCheck size={22} />}
                title="Attendance"
                subtitle="Mark who came in each day — late arrivals are detected from the check-in time"
                tone="emerald"
                actions={<Tabs tabs={[{ id: 'daily', label: 'Daily sheet' }, { id: 'monthly', label: 'Monthly report' }]} value={tab} onChange={setTab} />}
            />
            {tab === 'daily' ? <DailySheet /> : <MonthlyReport />}
            <p className="text-xs text-gray-400 flex items-center gap-1.5 px-1">
                <LuCheck size={13} /> Days you leave unmarked are counted as present when salary is calculated (you can change this in HR Settings).
            </p>
        </div>
    );
}
