"use client";

import React, { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useCreateLeaveMutation, useGetEmployeesQuery, useGetHrSettingsQuery, useGetLeaveBalanceQuery } from '@/redux/api/hrApi';
import { btn, errMsg, Field, inputCls, Modal, todayStr } from './HrUi';

type Props = { open: boolean; onClose: () => void; employeeId?: string };

/** Mounted fresh each time it opens, so the form always starts clean. */
export default function LeaveFormModal(props: Props) {
    if (!props.open) return null;
    return <LeaveForm {...props} />;
}

function LeaveForm({ onClose, employeeId }: Props) {
    const [employee, setEmployee] = useState(employeeId || '');
    const [leaveType, setLeaveType] = useState('casual');
    const [startDate, setStartDate] = useState(todayStr());
    const [rawEndDate, setEndDate] = useState(todayStr());
    const [halfDay, setHalfDay] = useState(false);
    const [reason, setReason] = useState('');
    const [approveNow, setApproveNow] = useState(true);

    // Half-day leave is always a single day; the end can never be before the start.
    const endDate = halfDay || rawEndDate < startDate ? startDate : rawEndDate;

    const { data: settings } = useGetHrSettingsQuery();
    const { data: emps } = useGetEmployeesQuery({ status: 'current', limit: 200 }, { skip: !!employeeId });
    const { data: balance } = useGetLeaveBalanceQuery({ employeeId: employee, year: Number(startDate.slice(0, 4)) }, { skip: !employee });
    const [createLeave, { isLoading }] = useCreateLeaveMutation();

    const calendarDays = useMemo(() => {
        const a = new Date(startDate);
        const b = new Date(endDate);
        return Math.max(Math.round((b.getTime() - a.getTime()) / 86400000) + 1, 0);
    }, [startDate, endDate]);

    const selected = balance?.data.find((b) => b.code === leaveType);

    const submit = async () => {
        if (!employee) return toast.error('Choose an employee');
        try {
            const res = await createLeave({ employee, leaveType, startDate, endDate, halfDay, reason: reason.trim(), status: approveNow ? 'approved' : 'pending' }).unwrap();
            toast.success(`${res.message} (${res.data.days} working day${res.data.days === 1 ? '' : 's'})`);
            onClose();
        } catch (err) {
            toast.error(errMsg(err, 'Could not add leave'));
        }
    };

    return (
        <Modal
            open
            onClose={onClose}
            title="Add leave"
            subtitle="Weekly off days and holidays inside the range are not counted"
            footer={
                <>
                    <button className={btn.secondary} onClick={onClose}>
                        Cancel
                    </button>
                    <button className={btn.primary} onClick={submit} disabled={isLoading}>
                        {isLoading ? 'Saving…' : approveNow ? 'Add & approve' : 'Add as pending'}
                    </button>
                </>
            }
        >
            <div className="space-y-4">
                {!employeeId && (
                    <Field label="Employee" required>
                        <select className={inputCls} value={employee} onChange={(e) => setEmployee(e.target.value)}>
                            <option value="">Select employee…</option>
                            {emps?.data.employees.map((e) => (
                                <option key={e._id} value={e._id}>
                                    {e.fullName} — {e.employeeId}
                                </option>
                            ))}
                        </select>
                    </Field>
                )}
                <Field label="Leave type" required>
                    <div className="grid grid-cols-2 gap-2">
                        {settings?.data.leaveTypes.map((t) => {
                            const b = balance?.data.find((x) => x.code === t.code);
                            const active = leaveType === t.code;
                            return (
                                <button
                                    type="button"
                                    key={t.code}
                                    onClick={() => setLeaveType(t.code)}
                                    className={`text-left px-3 py-2.5 rounded-xl border transition ${active ? 'border-indigo-400 bg-indigo-50 ring-4 ring-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <div className={`text-sm font-semibold ${active ? 'text-indigo-700' : 'text-gray-800'}`}>{t.name}</div>
                                    <div className="text-[11px] text-gray-500">
                                        {!t.paid ? 'Salary is cut' : b && b.quota ? `${b.remaining} of ${b.quota} days left` : `${t.daysPerYear || '∞'} days / year`}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="From" required>
                        <input type="date" className={inputCls} value={startDate} onChange={(e) => e.target.value && setStartDate(e.target.value)} />
                    </Field>
                    <Field label="To" required>
                        <input type="date" className={inputCls} value={endDate} min={startDate} disabled={halfDay} onChange={(e) => e.target.value && setEndDate(e.target.value)} />
                    </Field>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                    <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={halfDay} onChange={(e) => setHalfDay(e.target.checked)} />
                    Half-day leave
                </label>
                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                    {halfDay ? '0.5 day' : `${calendarDays} calendar day${calendarDays === 1 ? '' : 's'}`} selected
                    {selected && selected.quota > 0 && selected.remaining !== null && !halfDay && calendarDays > selected.remaining && (
                        <span className="text-amber-600 font-semibold"> · only {selected.remaining} {selected.name.toLowerCase()} day(s) left</span>
                    )}
                </div>
                <Field label="Reason">
                    <textarea rows={2} className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Family wedding" />
                </Field>
                <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer select-none rounded-xl border border-gray-100 p-3">
                    <input type="checkbox" className="w-4 h-4 mt-0.5 accent-indigo-600" checked={approveNow} onChange={(e) => setApproveNow(e.target.checked)} />
                    <span>
                        <b>Approve now</b>
                        <span className="block text-xs text-gray-500">Attendance for these days is filled in as “On leave” automatically. Untick to keep it as a pending request.</span>
                    </span>
                </label>
            </div>
        </Modal>
    );
}
