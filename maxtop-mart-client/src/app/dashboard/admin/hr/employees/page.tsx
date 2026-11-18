"use client";

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { LuIdCard, LuUserPlus, LuSearch, LuPencil, LuTrash2, LuEye, LuUsers, LuUserCheck, LuHourglass, LuBanknote } from 'react-icons/lu';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { Employee, useDeleteEmployeeMutation, useGetDepartmentsQuery, useGetEmployeesQuery, useGetHrDashboardQuery } from '@/redux/api/hrApi';
import EmployeeFormModal from '@/components/hr/EmployeeFormModal';
import {
    btn,
    Card,
    ConfirmDialog,
    EMPLOYMENT_LABEL,
    EmptyState,
    errMsg,
    fmtDate,
    fmtMoney,
    inputCls,
    PageHeader,
    PersonCell,
    Skeleton,
    StatCard,
    StatusPill,
} from '@/components/hr/HrUi';

export default function EmployeesPage() {
    return (
        <Suspense fallback={null}>
            <EmployeesInner />
        </Suspense>
    );
}

function EmployeesInner() {
    const params = useSearchParams();
    const user = useSelector((s: RootState) => s.auth.user) as { role?: string; permissions?: string[] } | null;
    const canEdit = user?.role === 'superadmin' || !!user?.permissions?.includes('manage_hr');

    const [search, setSearch] = useState('');
    const [debounced, setDebounced] = useState('');
    const [status, setStatus] = useState('current');
    const [department, setDepartment] = useState(params.get('department') || 'all');
    const [type, setType] = useState('all');
    const [page, setPage] = useState(1);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Employee | null>(null);
    const [deleting, setDeleting] = useState<Employee | null>(null);

    useEffect(() => {
        const t = setTimeout(() => {
            setDebounced(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    const { data, isFetching, isLoading } = useGetEmployeesQuery({ search: debounced || undefined, status, department, employmentType: type, page, limit: 15 });
    const { data: depData } = useGetDepartmentsQuery();
    const { data: dash } = useGetHrDashboardQuery();
    const [deleteEmployee, { isLoading: removing }] = useDeleteEmployeeMutation();

    const employees = data?.data.employees || [];
    const meta = data?.data.meta;
    const d = dash?.data;

    const openAdd = () => {
        setEditing(null);
        setFormOpen(true);
    };
    const openEdit = (e: Employee) => {
        setEditing(e);
        setFormOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleting) return;
        try {
            await deleteEmployee(deleting._id).unwrap();
            toast.success(`${deleting.fullName} deleted`);
            setDeleting(null);
        } catch (err) {
            toast.error(errMsg(err));
            setDeleting(null);
        }
    };

    return (
        <div className="w-full max-w-[1400px] mx-auto space-y-5">
            <PageHeader
                icon={<LuIdCard size={22} />}
                title="Employees"
                subtitle="Everyone who works at Maxtop Mart — profiles, jobs and salary structure"
                actions={
                    canEdit && (
                        <button className={btn.primary} onClick={openAdd}>
                            <LuUserPlus size={16} /> Add employee
                        </button>
                    )
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard label="Current staff" value={d?.headcount.total ?? '—'} hint={`${d?.headcount.probation ?? 0} on probation`} icon={<LuUsers size={16} />} />
                <StatCard label="Present today" value={d?.todayAttendance.present ?? '—'} hint={`${d?.todayAttendance.unmarked ?? 0} not marked yet`} icon={<LuUserCheck size={16} />} tone="emerald" />
                <StatCard label="On leave today" value={d?.todayAttendance.onLeave ?? '—'} hint={`${d?.pendingLeaveCount ?? 0} requests waiting`} icon={<LuHourglass size={16} />} tone="sky" />
                <StatCard label="Monthly salary bill" value={d ? fmtMoney(d.monthlySalaryBudget) : '—'} hint="Gross of current staff" icon={<LuBanknote size={16} />} tone="amber" />
            </div>

            <Card>
                <div className="p-4 flex flex-col lg:flex-row gap-3 lg:items-center justify-between border-b border-gray-50">
                    <div className="relative flex-1 max-w-md">
                        <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input className={`${inputCls} pl-9`} placeholder="Search name, ID, phone, designation…" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 lg:flex">
                        <select className={inputCls} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                            <option value="current">Current staff</option>
                            <option value="active">Active</option>
                            <option value="probation">Probation</option>
                            <option value="resigned">Resigned</option>
                            <option value="terminated">Terminated</option>
                            <option value="all">Everyone</option>
                        </select>
                        <select className={inputCls} value={department} onChange={(e) => { setDepartment(e.target.value); setPage(1); }}>
                            <option value="all">All departments</option>
                            {depData?.data.map((dep) => (
                                <option key={dep._id} value={dep._id}>
                                    {dep.name}
                                </option>
                            ))}
                        </select>
                        <select className={inputCls} value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
                            <option value="all">All types</option>
                            {Object.entries(EMPLOYMENT_LABEL).map(([k, v]) => (
                                <option key={k} value={k}>
                                    {v}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-4 space-y-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-14" />
                        ))}
                    </div>
                ) : employees.length === 0 ? (
                    <EmptyState
                        icon={<LuUsers size={26} />}
                        title={debounced || status !== 'current' || department !== 'all' ? 'No employee matches these filters' : 'No employees yet'}
                        text={debounced ? 'Try a different name, phone or ID.' : 'Add your first team member to start tracking attendance, leave and salary.'}
                        action={
                            canEdit &&
                            !debounced && (
                                <button className={btn.primary} onClick={openAdd}>
                                    <LuUserPlus size={16} /> Add employee
                                </button>
                            )
                        }
                    />
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className={`hidden md:block overflow-x-auto transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[11px] uppercase tracking-wider text-gray-400 bg-gray-50/70">
                                        <th className="px-5 py-3 font-semibold">Employee</th>
                                        <th className="px-4 py-3 font-semibold">Department</th>
                                        <th className="px-4 py-3 font-semibold">Phone</th>
                                        <th className="px-4 py-3 font-semibold">Joined</th>
                                        <th className="px-4 py-3 font-semibold text-right">Gross / month</th>
                                        <th className="px-4 py-3 font-semibold">Status</th>
                                        <th className="px-4 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {employees.map((e) => (
                                        <tr key={e._id} className="hover:bg-gray-50/60">
                                            <td className="px-5 py-3">
                                                <PersonCell
                                                    name={e.fullName}
                                                    photo={e.photo}
                                                    href={`/dashboard/admin/hr/employees/${e._id}`}
                                                    sub={
                                                        <>
                                                            <span className="font-mono">{e.employeeId}</span> · {e.designation}
                                                        </>
                                                    }
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {e.department?.name || <span className="text-gray-400">—</span>}
                                                <div className="text-[11px] text-gray-400">{EMPLOYMENT_LABEL[e.employmentType]}</div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 font-mono">{e.phone}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{fmtDate(e.joiningDate)}</td>
                                            <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{fmtMoney(e.grossSalary)}</td>
                                            <td className="px-4 py-3">
                                                <StatusPill status={e.status} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-1">
                                                    <Link href={`/dashboard/admin/hr/employees/${e._id}`} className={btn.icon} title="View profile">
                                                        <LuEye size={16} />
                                                    </Link>
                                                    {canEdit && (
                                                        <>
                                                            <button className={btn.icon} onClick={() => openEdit(e)} title="Edit">
                                                                <LuPencil size={15} />
                                                            </button>
                                                            <button className={`${btn.icon} hover:!text-rose-600 hover:!bg-rose-50`} onClick={() => setDeleting(e)} title="Delete">
                                                                <LuTrash2 size={15} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-gray-50">
                            {employees.map((e) => (
                                <div key={e._id} className="p-4 flex items-start justify-between gap-3">
                                    <PersonCell name={e.fullName} photo={e.photo} href={`/dashboard/admin/hr/employees/${e._id}`} sub={`${e.employeeId} · ${e.designation}`} />
                                    <div className="text-right shrink-0">
                                        <div className="text-sm font-bold text-gray-900">{fmtMoney(e.grossSalary)}</div>
                                        <StatusPill status={e.status} className="mt-1" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {meta && meta.totalPages > 1 && (
                            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50 text-sm">
                                <span className="text-gray-500">
                                    Page {meta.page} of {meta.totalPages} · {meta.total} employees
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
                    </>
                )}
            </Card>

            <EmployeeFormModal open={formOpen} onClose={() => setFormOpen(false)} employee={editing} />
            <ConfirmDialog
                open={!!deleting}
                title="Delete employee?"
                confirmLabel="Delete permanently"
                loading={removing}
                onClose={() => setDeleting(null)}
                onConfirm={confirmDelete}
                message={
                    <>
                        <b>{deleting?.fullName}</b> and all of their attendance and leave records will be removed. If they have already received a salary, change their
                        status to <b>Resigned</b> instead — salary history can&apos;t be deleted.
                    </>
                }
            />
        </div>
    );
}
