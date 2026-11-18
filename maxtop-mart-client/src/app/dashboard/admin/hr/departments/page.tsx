"use client";

import React, { useState } from "react";
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { LuBuilding2, LuPlus, LuPencil, LuTrash2, LuUsers, LuCrown } from 'react-icons/lu';
import { Department, useCreateDepartmentMutation, useDeleteDepartmentMutation, useGetDepartmentsQuery, useGetEmployeesQuery, useUpdateDepartmentMutation } from '@/redux/api/hrApi';
import { btn, ConfirmDialog, EmptyState, errMsg, Field, fmtMoney, fullName, inputCls, Modal, PageHeader, Skeleton } from '@/components/hr/HrUi';

const COLORS = ['from-indigo-500 to-violet-500', 'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500', 'from-sky-500 to-cyan-500', 'from-rose-500 to-pink-500', 'from-slate-600 to-slate-800'];

type DepProps = { open: boolean; onClose: () => void; dep: Department | null };

/** Mounted fresh each time it opens, so the form starts from the right values. */
function DepartmentModal(props: DepProps) {
    if (!props.open) return null;
    return <DepartmentForm key={props.dep?._id || 'new'} {...props} />;
}

function DepartmentForm({ open, onClose, dep }: DepProps) {
    const [name, setName] = useState(dep?.name || '');
    const [code, setCode] = useState(dep?.code || '');
    const [description, setDescription] = useState(dep?.description || '');
    const [head, setHead] = useState(dep?.head?._id || '');
    const { data: emps } = useGetEmployeesQuery({ status: 'current', department: dep?._id, limit: 200 }, { skip: !open || !dep });
    const [create, { isLoading: c }] = useCreateDepartmentMutation();
    const [update, { isLoading: u }] = useUpdateDepartmentMutation();

    const submit = async () => {
        if (name.trim().length < 2) return toast.error('Department name is required');
        const body = { name: name.trim(), code: code.trim(), description: description.trim(), ...(dep ? { head: head || null } : {}) };
        try {
            if (dep) await update({ id: dep._id, body }).unwrap();
            else await create(body).unwrap();
            toast.success(dep ? 'Department updated' : 'Department created');
            onClose();
        } catch (err) {
            toast.error(errMsg(err));
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="sm"
            title={dep ? `Edit ${dep.name}` : 'New department'}
            footer={
                <>
                    <button className={btn.secondary} onClick={onClose}>
                        Cancel
                    </button>
                    <button className={btn.primary} onClick={submit} disabled={c || u}>
                        {c || u ? 'Saving…' : dep ? 'Save' : 'Create'}
                    </button>
                </>
            }
        >
            <div className="space-y-4">
                <div className="grid grid-cols-[1fr_110px] gap-3">
                    <Field label="Name" required>
                        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Warehouse" autoFocus />
                    </Field>
                    <Field label="Short code">
                        <input className={`${inputCls} uppercase`} value={code} maxLength={12} onChange={(e) => setCode(e.target.value)} placeholder="WH" />
                    </Field>
                </div>
                <Field label="What does this team do?">
                    <textarea rows={2} className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} />
                </Field>
                {dep && (
                    <Field label="Department head" hint="Pick from employees in this department">
                        <select className={inputCls} value={head} onChange={(e) => setHead(e.target.value)}>
                            <option value="">No head assigned</option>
                            {emps?.data.employees.map((e) => (
                                <option key={e._id} value={e._id}>
                                    {e.fullName} — {e.designation}
                                </option>
                            ))}
                        </select>
                    </Field>
                )}
            </div>
        </Modal>
    );
}

export default function DepartmentsPage() {
    const { data, isLoading } = useGetDepartmentsQuery();
    const [remove, { isLoading: removing }] = useDeleteDepartmentMutation();
    const [modal, setModal] = useState<{ open: boolean; dep: Department | null }>({ open: false, dep: null });
    const [deleting, setDeleting] = useState<Department | null>(null);
    const deps = data?.data || [];
    const totalStaff = deps.reduce((s, d) => s + d.employeeCount, 0);
    const totalSalary = deps.reduce((s, d) => s + d.monthlySalary, 0);

    const runDelete = async () => {
        if (!deleting) return;
        try {
            await remove(deleting._id).unwrap();
            toast.success('Department deleted');
        } catch (err) {
            toast.error(errMsg(err));
        }
        setDeleting(null);
    };

    return (
        <div className="w-full max-w-[1200px] mx-auto space-y-5">
            <PageHeader
                icon={<LuBuilding2 size={22} />}
                title="Departments"
                subtitle={deps.length ? `${deps.length} teams · ${totalStaff} people · ${fmtMoney(totalSalary)} monthly salary` : 'Group your team — warehouse, delivery, support, marketing…'}
                tone="violet"
                actions={
                    <button className={btn.primary} onClick={() => setModal({ open: true, dep: null })}>
                        <LuPlus size={16} /> New department
                    </button>
                }
            />

            {isLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-44" />
                    ))}
                </div>
            ) : deps.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100">
                    <EmptyState
                        icon={<LuBuilding2 size={26} />}
                        title="No departments yet"
                        text="Typical e-commerce teams: Warehouse & Fulfilment, Delivery, Customer Support, Marketing, Accounts."
                        action={
                            <button className={btn.primary} onClick={() => setModal({ open: true, dep: null })}>
                                <LuPlus size={16} /> Create the first one
                            </button>
                        }
                    />
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {deps.map((d, i) => (
                        <div key={d._id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                            <div className={`h-1.5 bg-gradient-to-r ${COLORS[i % COLORS.length]}`} />
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-base font-bold text-gray-900 truncate">{d.name}</h3>
                                            {d.code && <span className="px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-bold text-gray-600">{d.code}</span>}
                                        </div>
                                        {d.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{d.description}</p>}
                                    </div>
                                    <div className="flex opacity-60 group-hover:opacity-100 transition">
                                        <button className={btn.icon} onClick={() => setModal({ open: true, dep: d })} title="Edit">
                                            <LuPencil size={15} />
                                        </button>
                                        <button className={`${btn.icon} hover:!text-rose-600 hover:!bg-rose-50`} onClick={() => setDeleting(d)} title="Delete">
                                            <LuTrash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-xs text-gray-600">
                                    <LuCrown size={14} className="text-amber-500" />
                                    {d.head ? (
                                        <span>
                                            <b>{fullName(d.head)}</b> · {d.head.designation}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">No head assigned</span>
                                    )}
                                </div>
                                <div className="mt-auto pt-4 grid grid-cols-2 gap-3">
                                    <Link href={`/dashboard/admin/hr/employees?department=${d._id}`} className="rounded-xl bg-gray-50 px-3 py-2 hover:bg-indigo-50 transition">
                                        <div className="text-lg font-black text-gray-900 flex items-center gap-1.5">
                                            <LuUsers size={15} className="text-gray-400" /> {d.employeeCount}
                                        </div>
                                        <div className="text-[11px] text-gray-500">people</div>
                                    </Link>
                                    <div className="rounded-xl bg-gray-50 px-3 py-2">
                                        <div className="text-lg font-black text-gray-900">{fmtMoney(d.monthlySalary)}</div>
                                        <div className="text-[11px] text-gray-500">salary / month</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <DepartmentModal open={modal.open} dep={modal.dep} onClose={() => setModal({ open: false, dep: null })} />
            <ConfirmDialog
                open={!!deleting}
                title="Delete department?"
                confirmLabel="Delete"
                loading={removing}
                onClose={() => setDeleting(null)}
                onConfirm={runDelete}
                message={
                    deleting?.employeeCount ? (
                        <>
                            <b>{deleting.name}</b> still has {deleting.employeeCount} employee(s). Move them to another department first.
                        </>
                    ) : (
                        <>
                            <b>{deleting?.name}</b> will be deleted.
                        </>
                    )
                }
            />
        </div>
    );
}
