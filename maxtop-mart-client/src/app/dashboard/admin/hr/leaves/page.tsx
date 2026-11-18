"use client";

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { LuPlane, LuPlus, LuCheck, LuX, LuTrash2, LuBan, LuRotateCcw, LuCalendarDays } from 'react-icons/lu';
import { Leave, LeaveStatus, useDeleteLeaveMutation, useGetHrSettingsQuery, useGetLeavesQuery, useUpdateLeaveStatusMutation } from '@/redux/api/hrApi';
import LeaveFormModal from '@/components/hr/LeaveFormModal';
import { btn, Card, ConfirmDialog, EmptyState, errMsg, fmtDate, fullName, inputCls, PageHeader, PersonCell, Skeleton, StatusPill, Tabs } from '@/components/hr/HrUi';

type Action = { leave: Leave; to: LeaveStatus } | null;

const ACTION_COPY: Record<string, { title: string; label: string; tone: 'danger' | 'primary' | 'success' }> = {
    approved: { title: 'Approve leave?', label: 'Approve', tone: 'success' },
    rejected: { title: 'Reject leave?', label: 'Reject', tone: 'danger' },
    cancelled: { title: 'Cancel leave?', label: 'Cancel leave', tone: 'danger' },
    pending: { title: 'Reopen as pending?', label: 'Reopen', tone: 'primary' },
};

export default function LeavesPage() {
    const [tab, setTab] = useState<'pending' | 'approved' | 'all'>('pending');
    const [month, setMonth] = useState('');
    const [type, setType] = useState('all');
    const [page, setPage] = useState(1);
    const [addOpen, setAddOpen] = useState(false);
    const [action, setAction] = useState<Action>(null);
    const [note, setNote] = useState('');
    const [deleting, setDeleting] = useState<Leave | null>(null);

    const { data, isLoading, isFetching } = useGetLeavesQuery({ status: tab, month: month || undefined, leaveType: type, page, limit: 20 });
    const { data: settings } = useGetHrSettingsQuery();
    const [updateStatus, { isLoading: updating }] = useUpdateLeaveStatusMutation();
    const [deleteLeave, { isLoading: removing }] = useDeleteLeaveMutation();

    const typeName = (code: string) => settings?.data.leaveTypes.find((t) => t.code === code)?.name || code;
    const leaves = data?.data.leaves || [];
    const meta = data?.data.meta;

    const runAction = async () => {
        if (!action) return;
        try {
            await updateStatus({ id: action.leave._id, status: action.to, reviewNote: note.trim() || undefined }).unwrap();
            toast.success(`Leave ${action.to === 'pending' ? 'reopened' : action.to}`);
            setAction(null);
            setNote('');
        } catch (err) {
            toast.error(errMsg(err));
        }
    };

    const runDelete = async () => {
        if (!deleting) return;
        try {
            await deleteLeave(deleting._id).unwrap();
            toast.success('Leave request deleted');
        } catch (err) {
            toast.error(errMsg(err));
        }
        setDeleting(null);
    };

    const open = (leave: Leave, to: LeaveStatus) => {
        setNote('');
        setAction({ leave, to });
    };

    return (
        <div className="w-full max-w-[1200px] mx-auto space-y-5">
            <PageHeader
                icon={<LuPlane size={22} />}
                title="Leave management"
                subtitle="Approve requests, track balances — approved days show up in attendance automatically"
                tone="sky"
                actions={
                    <button className={btn.primary} onClick={() => setAddOpen(true)}>
                        <LuPlus size={16} /> Add leave
                    </button>
                }
            />

            <Card>
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-50">
                    <Tabs
                        tabs={[
                            { id: 'pending', label: 'Waiting', count: data?.data.pendingCount },
                            { id: 'approved', label: 'Approved' },
                            { id: 'all', label: 'All' },
                        ]}
                        value={tab}
                        onChange={(v) => {
                            setTab(v);
                            setPage(1);
                        }}
                    />
                    <div className="flex gap-2">
                        <input type="month" className={`${inputCls} !w-auto`} value={month} onChange={(e) => { setMonth(e.target.value); setPage(1); }} title="Filter by month" />
                        <select className={`${inputCls} !w-auto`} value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
                            <option value="all">All types</option>
                            {settings?.data.leaveTypes.map((t) => (
                                <option key={t.code} value={t.code}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-4 space-y-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-20" />
                        ))}
                    </div>
                ) : leaves.length === 0 ? (
                    <EmptyState
                        icon={<LuCalendarDays size={26} />}
                        title={tab === 'pending' ? 'No leave requests waiting' : 'No leave found'}
                        text={tab === 'pending' ? 'You are all caught up.' : 'Try another month or type.'}
                    />
                ) : (
                    <div className={`divide-y divide-gray-50 ${isFetching ? 'opacity-60' : ''}`}>
                        {leaves.map((l) => {
                            const name = fullName(l.employee);
                            return (
                                <div key={l._id} className="p-4 sm:px-5 flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 min-w-0">
                                        <div className="sm:w-60 shrink-0">
                                            <PersonCell
                                                name={name}
                                                photo={l.employee?.photo}
                                                href={l.employee ? `/dashboard/admin/hr/employees/${l.employee._id}` : undefined}
                                                sub={`${l.employee?.employeeId || ''} · ${l.employee?.designation || ''}`}
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-bold text-gray-900">{typeName(l.leaveType)}</span>
                                                <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-bold">
                                                    {l.days} day{l.days === 1 ? '' : 's'}
                                                </span>
                                                <StatusPill status={l.status} />
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5">
                                                {fmtDate(l.startDate)}
                                                {l.endDate !== l.startDate && ` → ${fmtDate(l.endDate)}`}
                                                {l.halfDay && ' · half day'}
                                            </div>
                                            {l.reason && <div className="text-xs text-gray-600 mt-1 italic">“{l.reason}”</div>}
                                            {l.reviewNote && (
                                                <div className="text-[11px] text-gray-400 mt-1">
                                                    Note{l.reviewedBy ? ` by ${l.reviewedBy.firstName}` : ''}: {l.reviewNote}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 lg:justify-end shrink-0">
                                        {l.status === 'pending' && (
                                            <>
                                                <button className={btn.success} onClick={() => open(l, 'approved')}>
                                                    <LuCheck size={15} /> Approve
                                                </button>
                                                <button className={btn.secondary} onClick={() => open(l, 'rejected')}>
                                                    <LuX size={15} /> Reject
                                                </button>
                                            </>
                                        )}
                                        {l.status === 'approved' && (
                                            <button className={btn.secondary} onClick={() => open(l, 'cancelled')}>
                                                <LuBan size={15} /> Cancel
                                            </button>
                                        )}
                                        {(l.status === 'rejected' || l.status === 'cancelled') && (
                                            <button className={btn.secondary} onClick={() => open(l, 'pending')}>
                                                <LuRotateCcw size={15} /> Reopen
                                            </button>
                                        )}
                                        {l.status !== 'approved' && (
                                            <button className={`${btn.icon} hover:!text-rose-600 hover:!bg-rose-50`} onClick={() => setDeleting(l)} title="Delete">
                                                <LuTrash2 size={15} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {meta && meta.totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50 text-sm">
                        <span className="text-gray-500">
                            Page {meta.page} of {meta.totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button className={btn.secondary} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                                Previous
                            </button>
                            <button className={btn.secondary} disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </Card>

            <LeaveFormModal open={addOpen} onClose={() => setAddOpen(false)} />

            <ConfirmDialog
                open={!!action}
                title={action ? ACTION_COPY[action.to].title : ''}
                confirmLabel={action ? ACTION_COPY[action.to].label : ''}
                tone={action ? ACTION_COPY[action.to].tone : 'primary'}
                loading={updating}
                onClose={() => setAction(null)}
                onConfirm={runAction}
                message={
                    action && (
                        <>
                            <b>{fullName(action.leave.employee)}</b> · {typeName(action.leave.leaveType)} · {action.leave.days} day(s), {fmtDate(action.leave.startDate)}
                            {action.leave.endDate !== action.leave.startDate && ` → ${fmtDate(action.leave.endDate)}`}.
                            {action.to === 'approved' && ' These days will be marked “On leave” in attendance.'}
                            {action.to === 'cancelled' && ' The “On leave” attendance for these days will be removed.'}
                        </>
                    )
                }
            >
                <textarea rows={2} className={`${inputCls} mt-3`} placeholder="Note to keep with this decision (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
            </ConfirmDialog>

            <ConfirmDialog
                open={!!deleting}
                title="Delete leave request?"
                confirmLabel="Delete"
                loading={removing}
                onClose={() => setDeleting(null)}
                onConfirm={runDelete}
                message={<>This request from <b>{fullName(deleting?.employee)}</b> will be removed permanently.</>}
            />
        </div>
    );
}
