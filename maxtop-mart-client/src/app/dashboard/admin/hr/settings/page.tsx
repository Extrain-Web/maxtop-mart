"use client";

import React, { useState } from "react";
import { toast } from 'react-hot-toast';
import { LuCalendarCog, LuSave, LuPlus, LuTrash2, LuClock, LuCalculator, LuPlane, LuPartyPopper, LuSparkles } from 'react-icons/lu';
import { HrSettings, LeaveType, useCreateHolidayMutation, useDeleteHolidayMutation, useGetHolidaysQuery, useGetHrSettingsQuery, useUpdateHrSettingsMutation } from '@/redux/api/hrApi';
import { btn, Card, EmptyState, errMsg, Field, fmtDate, inputCls, PageHeader, Skeleton, todayStr, weekdayName, WEEKDAYS } from '@/components/hr/HrUi';

// Fixed-date public holidays in Bangladesh. Eid, Puja etc. follow the lunar
// calendar — add those by hand each year.
const FIXED_BD_HOLIDAYS = [
    ['02-21', 'International Mother Language Day'],
    ['03-26', 'Independence Day'],
    ['04-14', 'Pohela Boishakh (Bangla New Year)'],
    ['05-01', 'May Day'],
    ['12-16', 'Victory Day'],
    ['12-25', 'Christmas Day'],
];

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition shrink-0 ${checked ? 'bg-indigo-600' : 'bg-gray-300'}`}
    >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition ${checked ? 'translate-x-5' : ''}`} />
    </button>
);

function HolidaysCard() {
    const [year, setYear] = useState(Number(todayStr().slice(0, 4)));
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const { data, isLoading } = useGetHolidaysQuery(year);
    const [create, { isLoading: adding }] = useCreateHolidayMutation();
    const [remove] = useDeleteHolidayMutation();
    const holidays = data?.data || [];
    const have = new Set(holidays.map((h) => h.date));
    const missingFixed = FIXED_BD_HOLIDAYS.filter(([md]) => !have.has(`${year}-${md}`));

    const add = async (n: string, d: string) => {
        if (!n.trim() || !d) return toast.error('Enter a name and a date');
        try {
            await create({ name: n.trim(), date: d }).unwrap();
            return true;
        } catch (err) {
            toast.error(errMsg(err));
            return false;
        }
    };

    const addFixed = async () => {
        let n = 0;
        for (const [md, label] of missingFixed) if (await add(label, `${year}-${md}`)) n++;
        if (n) toast.success(`${n} holiday(s) added for ${year}`);
    };

    return (
        <Card
            title={
                <span className="flex items-center gap-2">
                    <LuPartyPopper size={16} className="text-violet-500" /> Holidays
                </span>
            }
            action={
                <select className={`${inputCls} !w-auto !py-1`} value={year} onChange={(e) => setYear(Number(e.target.value))}>
                    {[year - 1, year, year + 1].map((y) => (
                        <option key={y}>{y}</option>
                    ))}
                </select>
            }
        >
            <div className="p-5 space-y-4">
                <p className="text-xs text-gray-500">Holidays are not counted as working days — nobody is marked absent and leave taken across them isn&apos;t charged.</p>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input className={inputCls} placeholder="Holiday name (e.g. Eid-ul-Fitr)" value={name} onChange={(e) => setName(e.target.value)} />
                    <input type="date" className={`${inputCls} sm:!w-44`} value={date} onChange={(e) => setDate(e.target.value)} />
                    <button
                        className={btn.primary}
                        disabled={adding}
                        onClick={async () => {
                            if (await add(name, date)) {
                                toast.success('Holiday added');
                                setName('');
                                setDate('');
                            }
                        }}
                    >
                        <LuPlus size={15} /> Add
                    </button>
                </div>
                {missingFixed.length > 0 && (
                    <button onClick={addFixed} className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                        <LuSparkles size={14} /> Add {missingFixed.length} fixed Bangladesh public holiday(s) for {year}
                    </button>
                )}
                {isLoading ? (
                    <Skeleton className="h-24" />
                ) : holidays.length === 0 ? (
                    <EmptyState title={`No holidays for ${year}`} text="Add Eid, Puja and other holidays your shop observes." />
                ) : (
                    <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl">
                        {holidays.map((h) => (
                            <div key={h._id} className="flex items-center justify-between px-4 py-2.5">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 text-center">
                                        <div className="text-[10px] font-bold uppercase text-violet-500">{fmtDate(h.date, false).split(' ')[1]}</div>
                                        <div className="text-lg font-black text-gray-900 leading-none">{Number(h.date.slice(8))}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-gray-800">{h.name}</div>
                                        <div className="text-[11px] text-gray-400">{weekdayName(h.date, 'long')}</div>
                                    </div>
                                </div>
                                <button
                                    className={`${btn.icon} hover:!text-rose-600 hover:!bg-rose-50`}
                                    onClick={() => remove(h._id).unwrap().then(() => toast.success('Holiday removed')).catch((e) => toast.error(errMsg(e)))}
                                    title="Remove"
                                >
                                    <LuTrash2 size={15} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
}

export default function HrSettingsPage() {
    const { data, isLoading } = useGetHrSettingsQuery();
    const [save, { isLoading: saving }] = useUpdateHrSettingsMutation();
    const [s, setS] = useState<HrSettings | null>(null);
    const [loaded, setLoaded] = useState<HrSettings | undefined>(undefined);
    if (data?.data && data.data !== loaded) {
        // Copy fresh server settings into the editable form (no effect needed).
        setLoaded(data.data);
        setS(JSON.parse(JSON.stringify(data.data)));
    }

    const set = <K extends keyof HrSettings>(k: K, v: HrSettings[K]) => setS((p) => (p ? { ...p, [k]: v } : p));
    const setType = (i: number, patch: Partial<LeaveType>) => s && set('leaveTypes', s.leaveTypes.map((t, j) => (j === i ? { ...t, ...patch } : t)));

    const submit = async () => {
        if (!s) return;
        const leaveTypes = s.leaveTypes.map((t) => ({
            ...t,
            name: t.name.trim(),
            code: (t.code || t.name).trim().toLowerCase().replace(/[^a-z]+/g, '_').replace(/^_|_$/g, '').slice(0, 20),
            daysPerYear: Number(t.daysPerYear) || 0,
        }));
        try {
            await save({
                weeklyOffDays: s.weeklyOffDays,
                officeStart: s.officeStart,
                officeEnd: s.officeEnd,
                graceMinutes: Number(s.graceMinutes) || 0,
                latesPerDeduction: Number(s.latesPerDeduction) || 0,
                overtimeMultiplier: Number(s.overtimeMultiplier) || 0,
                standardMonthlyHours: Number(s.standardMonthlyHours) || 208,
                unmarkedAsPresent: s.unmarkedAsPresent,
                leaveTypes,
            }).unwrap();
            toast.success('HR settings saved');
        } catch (err) {
            toast.error(errMsg(err));
        }
    };

    return (
        <div className="w-full max-w-[1200px] mx-auto space-y-5">
            <PageHeader
                icon={<LuCalendarCog size={22} />}
                title="HR settings"
                subtitle="Office hours, salary rules, leave types and holidays"
                actions={
                    <button className={btn.primary} onClick={submit} disabled={saving || !s}>
                        <LuSave size={16} /> {saving ? 'Saving…' : 'Save settings'}
                    </button>
                }
            />

            {isLoading || !s ? (
                <Skeleton className="h-96" />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <Card
                        title={
                            <span className="flex items-center gap-2">
                                <LuClock size={16} className="text-indigo-500" /> Work schedule
                            </span>
                        }
                    >
                        <div className="p-5 space-y-4">
                            <Field label="Weekly off days">
                                <div className="flex flex-wrap gap-2">
                                    {WEEKDAYS.map((d, i) => {
                                        const on = s.weeklyOffDays.includes(i);
                                        return (
                                            <button
                                                key={d}
                                                type="button"
                                                onClick={() => set('weeklyOffDays', on ? s.weeklyOffDays.filter((x) => x !== i) : [...s.weeklyOffDays, i].sort())}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${on ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'}`}
                                            >
                                                {d.slice(0, 3)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </Field>
                            <div className="grid grid-cols-3 gap-3">
                                <Field label="Office starts">
                                    <input type="time" className={inputCls} value={s.officeStart} onChange={(e) => set('officeStart', e.target.value)} />
                                </Field>
                                <Field label="Office ends">
                                    <input type="time" className={inputCls} value={s.officeEnd} onChange={(e) => set('officeEnd', e.target.value)} />
                                </Field>
                                <Field label="Grace (min)">
                                    <input type="number" min={0} className={inputCls} value={s.graceMinutes} onChange={(e) => set('graceMinutes', e.target.value as unknown as number)} />
                                </Field>
                            </div>
                            <p className="text-xs text-gray-500">
                                Check-in after <b>{s.officeStart}</b> + {s.graceMinutes || 0} min is marked <b>Late</b> automatically.
                            </p>
                        </div>
                    </Card>

                    <Card
                        title={
                            <span className="flex items-center gap-2">
                                <LuCalculator size={16} className="text-amber-500" /> Salary rules
                            </span>
                        }
                    >
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                                <Field label="Lates = 1 day cut" hint="0 = never cut">
                                    <input type="number" min={0} className={inputCls} value={s.latesPerDeduction} onChange={(e) => set('latesPerDeduction', e.target.value as unknown as number)} />
                                </Field>
                                <Field label="Overtime rate ×" hint="× basic hourly">
                                    <input type="number" min={0} step={0.5} className={inputCls} value={s.overtimeMultiplier} onChange={(e) => set('overtimeMultiplier', e.target.value as unknown as number)} />
                                </Field>
                                <Field label="Hours / month" hint="basic ÷ this">
                                    <input type="number" min={1} className={inputCls} value={s.standardMonthlyHours} onChange={(e) => set('standardMonthlyHours', e.target.value as unknown as number)} />
                                </Field>
                            </div>
                            <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 p-3">
                                <div>
                                    <div className="text-sm font-semibold text-gray-800">Count unmarked days as present</div>
                                    <div className="text-xs text-gray-500">Handy if you only record absences. Turn off to treat unmarked working days as absent.</div>
                                </div>
                                <Toggle checked={s.unmarkedAsPresent} onChange={(v) => set('unmarkedAsPresent', v)} />
                            </div>
                            <p className="text-xs text-gray-500">
                                Bangladesh labour law pays overtime at 2× the basic hourly rate (basic ÷ 208 hours). Change it only if your policy differs.
                            </p>
                        </div>
                    </Card>

                    <Card
                        className="lg:col-span-2"
                        title={
                            <span className="flex items-center gap-2">
                                <LuPlane size={16} className="text-sky-500" /> Leave types
                            </span>
                        }
                        action={
                            <button
                                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                                onClick={() => set('leaveTypes', [...s.leaveTypes, { code: '', name: '', daysPerYear: 0, paid: true }])}
                            >
                                <LuPlus size={14} /> Add type
                            </button>
                        }
                    >
                        <div className="p-5 space-y-2">
                            <div className="hidden sm:grid grid-cols-[1fr_120px_110px_40px] gap-3 text-[11px] uppercase tracking-wider font-semibold text-gray-400 px-1">
                                <span>Name</span>
                                <span>Days / year</span>
                                <span>Paid?</span>
                                <span />
                            </div>
                            {s.leaveTypes.map((t, i) => (
                                <div key={i} className="grid grid-cols-[1fr_90px_auto_40px] sm:grid-cols-[1fr_120px_110px_40px] gap-3 items-center">
                                    <input className={inputCls} value={t.name} placeholder="e.g. Maternity Leave" onChange={(e) => setType(i, { name: e.target.value })} />
                                    <input type="number" min={0} className={inputCls} value={t.daysPerYear} onChange={(e) => setType(i, { daysPerYear: e.target.value as unknown as number })} title="0 = no yearly limit" />
                                    <div className="flex items-center gap-2">
                                        <Toggle checked={t.paid} onChange={(v) => setType(i, { paid: v })} />
                                        <span className="text-xs text-gray-500 hidden sm:inline">{t.paid ? 'Paid' : 'Unpaid'}</span>
                                    </div>
                                    <button
                                        className={`${btn.icon} hover:!text-rose-600 hover:!bg-rose-50`}
                                        disabled={s.leaveTypes.length <= 1}
                                        onClick={() => set('leaveTypes', s.leaveTypes.filter((_, j) => j !== i))}
                                        title="Remove"
                                    >
                                        <LuTrash2 size={15} />
                                    </button>
                                </div>
                            ))}
                            <p className="text-xs text-gray-500 pt-2">
                                Days / year = 0 means no limit. Unpaid leave is cut from salary at the per-day rate. Don&apos;t remove a type that is already in use.
                            </p>
                        </div>
                    </Card>

                    <div className="lg:col-span-2">
                        <HolidaysCard />
                    </div>
                </div>
            )}
        </div>
    );
}
