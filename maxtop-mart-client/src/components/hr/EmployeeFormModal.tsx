"use client";

import React, { useMemo, useState } from "react";
import { toast } from 'react-hot-toast';
import { LuUser, LuBriefcase, LuBanknote, LuHeartPulse, LuWandSparkles } from 'react-icons/lu';
import { SingleImageUploader } from '@/components/ui/ImageUploader';
import { Employee, useCreateEmployeeMutation, useGetDepartmentsQuery, useUpdateEmployeeMutation } from '@/redux/api/hrApi';
import { btn, errMsg, Field, fmtMoney, inputCls, Modal, todayStr } from './HrUi';

type Form = {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    gender: string;
    dateOfBirth: string;
    bloodGroup: string;
    nid: string;
    photo: string;
    department: string;
    designation: string;
    employmentType: string;
    joiningDate: string;
    status: string;
    exitDate: string;
    exitReason: string;
    basic: string;
    houseRent: string;
    medical: string;
    transport: string;
    otherAllowance: string;
    salaryMethod: string;
    bankName: string;
    bankAccountNo: string;
    mobileBankingNo: string;
    presentAddress: string;
    permanentAddress: string;
    ecName: string;
    ecRelation: string;
    ecPhone: string;
    notes: string;
};

const blank = (): Form => ({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    gender: '',
    dateOfBirth: '',
    bloodGroup: '',
    nid: '',
    photo: '',
    department: '',
    designation: '',
    employmentType: 'full_time',
    joiningDate: todayStr(),
    status: 'active',
    exitDate: '',
    exitReason: '',
    basic: '',
    houseRent: '',
    medical: '',
    transport: '',
    otherAllowance: '',
    salaryMethod: 'cash',
    bankName: '',
    bankAccountNo: '',
    mobileBankingNo: '',
    presentAddress: '',
    permanentAddress: '',
    ecName: '',
    ecRelation: '',
    ecPhone: '',
    notes: '',
});

const fromEmployee = (e: Employee): Form => ({
    firstName: e.firstName || '',
    lastName: e.lastName || '',
    phone: e.phone || '',
    email: e.email || '',
    gender: e.gender || '',
    dateOfBirth: e.dateOfBirth || '',
    bloodGroup: e.bloodGroup || '',
    nid: e.nid || '',
    photo: e.photo || '',
    department: e.department?._id || '',
    designation: e.designation || '',
    employmentType: e.employmentType || 'full_time',
    joiningDate: e.joiningDate || '',
    status: e.status || 'active',
    exitDate: e.exitDate || '',
    exitReason: e.exitReason || '',
    basic: String(e.salary?.basic ?? ''),
    houseRent: String(e.salary?.houseRent ?? ''),
    medical: String(e.salary?.medical ?? ''),
    transport: String(e.salary?.transport ?? ''),
    otherAllowance: String(e.salary?.otherAllowance ?? ''),
    salaryMethod: e.salaryMethod || 'cash',
    bankName: e.bankName || '',
    bankAccountNo: e.bankAccountNo || '',
    mobileBankingNo: e.mobileBankingNo || '',
    presentAddress: e.presentAddress || '',
    permanentAddress: e.permanentAddress || '',
    ecName: e.emergencyContact?.name || '',
    ecRelation: e.emergencyContact?.relation || '',
    ecPhone: e.emergencyContact?.phone || '',
    notes: e.notes || '',
});

const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <section className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            <span className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">{icon}</span>
            {title}
        </div>
        {children}
    </section>
);

type Props = { open: boolean; onClose: () => void; employee?: Employee | null };

/** Mounted fresh each time it opens, so the form always starts from the right values. */
export default function EmployeeFormModal(props: Props) {
    if (!props.open) return null;
    return <EmployeeForm key={props.employee?._id || "new"} {...props} />;
}

function EmployeeForm({ open, onClose, employee }: Props) {
    const [f, setF] = useState<Form>(() => (employee ? fromEmployee(employee) : blank()));
    const { data: depData } = useGetDepartmentsQuery();
    const [createEmployee, { isLoading: creating }] = useCreateEmployeeMutation();
    const [updateEmployee, { isLoading: updating }] = useUpdateEmployeeMutation();
    const editing = !!employee;

    const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
    const num = (v: string) => Math.max(Number(v) || 0, 0);
    const gross = useMemo(() => num(f.basic) + num(f.houseRent) + num(f.medical) + num(f.transport) + num(f.otherAllowance), [f]);

    /** Common Bangladesh split: basic 60%, house rent 30%, medical 5%, transport 5%. */
    const autoSplit = () => {
        const g = Number(window.prompt('Total monthly gross salary (৳)?', gross ? String(gross) : ''));
        if (!g || g <= 0) return;
        const basic = Math.round(g * 0.6);
        const houseRent = Math.round(g * 0.3);
        const medical = Math.round(g * 0.05);
        setF((p) => ({ ...p, basic: String(basic), houseRent: String(houseRent), medical: String(medical), transport: String(g - basic - houseRent - medical), otherAllowance: '0' }));
    };

    const leaving = f.status === 'resigned' || f.status === 'terminated';

    const submit = async () => {
        if (!f.firstName.trim()) return toast.error('First name is required');
        if (!f.phone.trim()) return toast.error('Phone number is required');
        if (!f.designation.trim()) return toast.error('Designation is required');
        if (!f.joiningDate) return toast.error('Joining date is required');
        if (num(f.basic) <= 0) return toast.error('Please enter the basic salary');

        const body: Record<string, unknown> = {
            firstName: f.firstName.trim(),
            lastName: f.lastName.trim(),
            phone: f.phone.trim(),
            email: f.email.trim(),
            gender: f.gender || undefined,
            dateOfBirth: f.dateOfBirth,
            bloodGroup: f.bloodGroup,
            nid: f.nid.trim(),
            photo: f.photo,
            department: f.department || null,
            designation: f.designation.trim(),
            employmentType: f.employmentType,
            joiningDate: f.joiningDate,
            status: f.status,
            exitDate: leaving ? f.exitDate : '',
            exitReason: leaving ? f.exitReason.trim() : '',
            salary: { basic: num(f.basic), houseRent: num(f.houseRent), medical: num(f.medical), transport: num(f.transport), otherAllowance: num(f.otherAllowance) },
            salaryMethod: f.salaryMethod,
            bankName: f.bankName.trim(),
            bankAccountNo: f.bankAccountNo.trim(),
            mobileBankingNo: f.mobileBankingNo.trim(),
            presentAddress: f.presentAddress.trim(),
            permanentAddress: f.permanentAddress.trim(),
            emergencyContact: { name: f.ecName.trim(), relation: f.ecRelation.trim(), phone: f.ecPhone.trim() },
            notes: f.notes.trim(),
        };
        try {
            if (editing) {
                await updateEmployee({ id: employee!._id, body }).unwrap();
                toast.success('Employee updated');
            } else {
                const res = await createEmployee(body).unwrap();
                toast.success(`${res.data.fullName} added as ${res.data.employeeId}`);
            }
            onClose();
        } catch (err) {
            toast.error(errMsg(err, 'Could not save employee'));
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="lg"
            title={editing ? `Edit ${employee?.fullName}` : 'Add new employee'}
            subtitle={editing ? `${employee?.employeeId} · fields marked * are required` : 'An employee ID (MM-EMP-xxxx) is created automatically'}
            footer={
                <>
                    <button className={btn.secondary} onClick={onClose}>
                        Cancel
                    </button>
                    <button className={btn.primary} onClick={submit} disabled={creating || updating}>
                        {creating || updating ? 'Saving…' : editing ? 'Save changes' : 'Add employee'}
                    </button>
                </>
            }
        >
            <div className="space-y-7">
                <Section icon={<LuUser size={13} />} title="Personal information">
                    <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-4">
                        <SingleImageUploader label="Photo" value={f.photo} onChange={(url) => setF((p) => ({ ...p, photo: url }))} folder="employee" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field label="First name" required>
                                <input className={inputCls} value={f.firstName} onChange={set('firstName')} placeholder="e.g. Rahim" />
                            </Field>
                            <Field label="Last name">
                                <input className={inputCls} value={f.lastName} onChange={set('lastName')} placeholder="e.g. Uddin" />
                            </Field>
                            <Field label="Phone" required>
                                <input className={inputCls} value={f.phone} onChange={set('phone')} placeholder="01XXXXXXXXX" inputMode="tel" />
                            </Field>
                            <Field label="Email">
                                <input className={inputCls} value={f.email} onChange={set('email')} placeholder="name@example.com" type="email" />
                            </Field>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <Field label="Gender">
                            <select className={inputCls} value={f.gender} onChange={set('gender')}>
                                <option value="">—</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </Field>
                        <Field label="Date of birth">
                            <input type="date" className={inputCls} value={f.dateOfBirth} onChange={set('dateOfBirth')} max={todayStr()} />
                        </Field>
                        <Field label="Blood group">
                            <select className={inputCls} value={f.bloodGroup} onChange={set('bloodGroup')}>
                                <option value="">—</option>
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => (
                                    <option key={b}>{b}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="NID number">
                            <input className={inputCls} value={f.nid} onChange={set('nid')} />
                        </Field>
                    </div>
                </Section>

                <Section icon={<LuBriefcase size={13} />} title="Job details">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <Field label="Designation" required>
                            <input className={inputCls} value={f.designation} onChange={set('designation')} placeholder="e.g. Delivery Rider" list="hr-designations" />
                            <datalist id="hr-designations">
                                {['Store Manager', 'Sales Executive', 'Customer Support Executive', 'Warehouse Lead', 'Picker & Packer', 'Delivery Rider', 'Digital Marketing Executive', 'Accountant', 'Content Writer', 'Photographer'].map((d) => (
                                    <option key={d} value={d} />
                                ))}
                            </datalist>
                        </Field>
                        <Field label="Department">
                            <select className={inputCls} value={f.department} onChange={set('department')}>
                                <option value="">No department</option>
                                {depData?.data.map((d) => (
                                    <option key={d._id} value={d._id}>
                                        {d.name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Employment type">
                            <select className={inputCls} value={f.employmentType} onChange={set('employmentType')}>
                                <option value="full_time">Full-time</option>
                                <option value="part_time">Part-time</option>
                                <option value="contract">Contract</option>
                                <option value="intern">Intern</option>
                            </select>
                        </Field>
                        <Field label="Joining date" required>
                            <input type="date" className={inputCls} value={f.joiningDate} onChange={set('joiningDate')} />
                        </Field>
                        <Field label="Status">
                            <select className={inputCls} value={f.status} onChange={set('status')}>
                                <option value="active">Active</option>
                                <option value="probation">On probation</option>
                                <option value="resigned">Resigned</option>
                                <option value="terminated">Terminated</option>
                            </select>
                        </Field>
                        {leaving && (
                            <Field label="Last working day" hint="Salary stops after this date">
                                <input type="date" className={inputCls} value={f.exitDate} onChange={set('exitDate')} min={f.joiningDate} />
                            </Field>
                        )}
                    </div>
                    {leaving && (
                        <Field label="Reason for leaving">
                            <input className={inputCls} value={f.exitReason} onChange={set('exitReason')} placeholder="Optional" />
                        </Field>
                    )}
                </Section>

                <Section icon={<LuBanknote size={13} />} title="Monthly salary">
                    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            {(
                                [
                                    ['basic', 'Basic *'],
                                    ['houseRent', 'House rent'],
                                    ['medical', 'Medical'],
                                    ['transport', 'Transport'],
                                    ['otherAllowance', 'Other'],
                                ] as [keyof Form, string][]
                            ).map(([k, label]) => (
                                <Field key={k} label={label.replace(' *', '')} required={label.endsWith('*')}>
                                    <input type="number" min={0} className={inputCls} value={f[k]} onChange={set(k)} placeholder="0" />
                                </Field>
                            ))}
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <button type="button" onClick={autoSplit} className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                                <LuWandSparkles size={14} /> Split a gross amount automatically
                            </button>
                            <div className="text-sm text-gray-600">
                                Gross per month: <span className="font-black text-gray-900 text-base">{fmtMoney(gross)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Field label="Salary paid by">
                            <select className={inputCls} value={f.salaryMethod} onChange={set('salaryMethod')}>
                                <option value="cash">Cash</option>
                                <option value="bank">Bank transfer</option>
                                <option value="bkash">bKash</option>
                                <option value="nagad">Nagad</option>
                                <option value="rocket">Rocket</option>
                            </select>
                        </Field>
                        {f.salaryMethod === 'bank' && (
                            <>
                                <Field label="Bank name">
                                    <input className={inputCls} value={f.bankName} onChange={set('bankName')} placeholder="e.g. DBBL, Mirpur" />
                                </Field>
                                <Field label="Account number">
                                    <input className={inputCls} value={f.bankAccountNo} onChange={set('bankAccountNo')} />
                                </Field>
                            </>
                        )}
                        {['bkash', 'nagad', 'rocket'].includes(f.salaryMethod) && (
                            <Field label="Wallet number">
                                <input className={inputCls} value={f.mobileBankingNo} onChange={set('mobileBankingNo')} placeholder="01XXXXXXXXX" />
                            </Field>
                        )}
                    </div>
                </Section>

                <Section icon={<LuHeartPulse size={13} />} title="Address & emergency contact">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Present address">
                            <textarea rows={2} className={inputCls} value={f.presentAddress} onChange={set('presentAddress')} />
                        </Field>
                        <Field label="Permanent address">
                            <textarea rows={2} className={inputCls} value={f.permanentAddress} onChange={set('permanentAddress')} />
                        </Field>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Field label="Emergency contact name">
                            <input className={inputCls} value={f.ecName} onChange={set('ecName')} />
                        </Field>
                        <Field label="Relation">
                            <input className={inputCls} value={f.ecRelation} onChange={set('ecRelation')} placeholder="e.g. Father" />
                        </Field>
                        <Field label="Phone">
                            <input className={inputCls} value={f.ecPhone} onChange={set('ecPhone')} />
                        </Field>
                    </div>
                    <Field label="Internal notes">
                        <textarea rows={2} className={inputCls} value={f.notes} onChange={set('notes')} placeholder="Only visible to HR" />
                    </Field>
                </Section>
            </div>
        </Modal>
    );
}
