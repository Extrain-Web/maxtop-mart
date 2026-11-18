"use client";

import React, { useEffect } from 'react';
import { LuX, LuChevronLeft, LuChevronRight, LuCircleAlert, LuInbox } from 'react-icons/lu';
import { resolveImageUrl } from '@/components/shared/SmartImage';

// ─────────────────────────────────────────────────────────────────────────────
//  Shared building blocks for the HR pages — one look across the module.
// ─────────────────────────────────────────────────────────────────────────────

/* ── formatting ─────────────────────────────────────────────────────────── */
export const fmtMoney = (n?: number | null) => `৳${Math.round(n || 0).toLocaleString('en-IN')}`;

export const fmtDate = (d?: string | null, withYear = true) => {
    if (!d) return '—';
    const [y, m, day] = d.slice(0, 10).split('-').map(Number);
    if (!y || !m || !day) return d;
    return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        ...(withYear ? { year: 'numeric' } : {}),
        timeZone: 'UTC',
    });
};

export const monthLabel = (m: string) => {
    const [y, mm] = m.split('-').map(Number);
    return new Date(Date.UTC(y, mm - 1, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
};

const BD = 'Asia/Dhaka';
export const todayStr = () =>
    new Intl.DateTimeFormat('en-CA', { timeZone: BD, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const currentMonth = () => todayStr().slice(0, 7);

export const shiftMonth = (m: string, delta: number) => {
    const [y, mm] = m.split('-').map(Number);
    const d = new Date(Date.UTC(y, mm - 1 + delta, 1));
    return d.toISOString().slice(0, 7);
};
export const shiftDate = (d: string, delta: number) => {
    const [y, m, day] = d.split('-').map(Number);
    const x = new Date(Date.UTC(y, m - 1, day + delta));
    return x.toISOString().slice(0, 10);
};
export const weekdayName = (d: string, style: 'short' | 'long' = 'short') => {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString('en-US', { weekday: style, timeZone: 'UTC' });
};
export const fullName = (e?: { firstName?: string; lastName?: string } | null) =>
    e ? `${e.firstName || ''} ${e.lastName || ''}`.trim() : '';

/** Readable message from an RTK Query error. */
export const errMsg = (err: unknown, fallback = 'Something went wrong') => {
    const e = err as { data?: { message?: string; errorMessages?: { message?: string }[] } };
    return e?.data?.errorMessages?.[0]?.message || e?.data?.message || fallback;
};

/* ── constants ──────────────────────────────────────────────────────────── */
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const EMPLOYMENT_LABEL: Record<string, string> = {
    full_time: 'Full-time',
    part_time: 'Part-time',
    contract: 'Contract',
    intern: 'Intern',
};
export const SALARY_METHOD_LABEL: Record<string, string> = {
    cash: 'Cash',
    bank: 'Bank transfer',
    bkash: 'bKash',
    nagad: 'Nagad',
    rocket: 'Rocket',
};

export const ATTENDANCE_META: Record<string, { label: string; short: string; cls: string; dot: string }> = {
    present: { label: 'Present', short: 'P', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    late: { label: 'Late', short: 'L', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    half_day: { label: 'Half day', short: 'H', cls: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
    absent: { label: 'Absent', short: 'A', cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
    leave: { label: 'On leave', short: 'LV', cls: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
    holiday: { label: 'Holiday', short: 'HD', cls: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
    weekend: { label: 'Weekly off', short: 'W', cls: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' },
    unmarked: { label: 'Not marked', short: '·', cls: 'bg-white text-gray-300 border-dashed border-gray-200', dot: 'bg-gray-300' },
    future: { label: '', short: '', cls: 'bg-white text-gray-200 border-gray-100', dot: 'bg-gray-200' },
    na: { label: 'Not employed', short: '', cls: 'bg-gray-50 text-gray-200 border-gray-100', dot: 'bg-gray-200' },
};

const STATUS_PILL: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    probation: 'bg-amber-50 text-amber-700 ring-amber-200',
    resigned: 'bg-gray-100 text-gray-600 ring-gray-200',
    terminated: 'bg-rose-50 text-rose-700 ring-rose-200',
    pending: 'bg-amber-50 text-amber-700 ring-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
    cancelled: 'bg-gray-100 text-gray-500 ring-gray-200',
    draft: 'bg-amber-50 text-amber-700 ring-amber-200',
    paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};
const PILL_LABEL: Record<string, string> = { draft: 'Unpaid' };

export const StatusPill = ({ status, className = '' }: { status: string; className?: string }) => (
    <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 ring-inset capitalize whitespace-nowrap ${
            STATUS_PILL[status] || 'bg-gray-100 text-gray-600 ring-gray-200'
        } ${className}`}
    >
        {PILL_LABEL[status] || status.replace('_', ' ')}
    </span>
);

export const AttendanceChip = ({ status }: { status: string }) => {
    const m = ATTENDANCE_META[status] || ATTENDANCE_META.unmarked;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${m.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
            {m.label}
        </span>
    );
};

/* ── layout pieces ──────────────────────────────────────────────────────── */
export const inputCls =
    'w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 disabled:bg-gray-50 disabled:text-gray-400';

export const btn = {
    primary:
        'inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed',
    secondary:
        'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition disabled:opacity-60',
    danger:
        'inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition disabled:opacity-60',
    success:
        'inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed',
    icon: 'inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition disabled:opacity-40',
};

export const PageHeader = ({
    icon,
    title,
    subtitle,
    actions,
    tone = 'indigo',
}: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    tone?: 'indigo' | 'emerald' | 'sky' | 'amber' | 'violet' | 'rose';
}) => {
    const tones: Record<string, string> = {
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        sky: 'bg-sky-50 text-sky-600',
        amber: 'bg-amber-50 text-amber-600',
        violet: 'bg-violet-50 text-violet-600',
        rose: 'bg-rose-50 text-rose-600',
    };
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
                <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${tones[tone]}`}>{icon}</div>
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">{title}</h1>
                    {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{subtitle}</p>}
                </div>
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
};

export const Card = ({ children, className = '', title, action }: { children: React.ReactNode; className?: string; title?: React.ReactNode; action?: React.ReactNode }) => (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>
        {title && (
            <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-gray-50">
                <h3 className="text-sm font-bold text-gray-800">{title}</h3>
                {action}
            </div>
        )}
        {children}
    </div>
);

const TONES: Record<string, { bg: string; icon: string; text: string }> = {
    indigo: { bg: 'from-indigo-50 to-blue-50/40 border-indigo-100', icon: 'text-indigo-600', text: 'text-indigo-700' },
    emerald: { bg: 'from-emerald-50 to-teal-50/40 border-emerald-100', icon: 'text-emerald-600', text: 'text-emerald-700' },
    amber: { bg: 'from-amber-50 to-orange-50/40 border-amber-100', icon: 'text-amber-600', text: 'text-amber-700' },
    rose: { bg: 'from-rose-50 to-pink-50/40 border-rose-100', icon: 'text-rose-600', text: 'text-rose-700' },
    sky: { bg: 'from-sky-50 to-cyan-50/40 border-sky-100', icon: 'text-sky-600', text: 'text-sky-700' },
    violet: { bg: 'from-violet-50 to-purple-50/40 border-violet-100', icon: 'text-violet-600', text: 'text-violet-700' },
    gray: { bg: 'from-gray-50 to-slate-50/40 border-gray-200', icon: 'text-gray-600', text: 'text-gray-600' },
};

export const StatCard = ({
    label,
    value,
    hint,
    icon,
    tone = 'indigo',
}: {
    label: string;
    value: React.ReactNode;
    hint?: React.ReactNode;
    icon: React.ReactNode;
    tone?: keyof typeof TONES;
}) => {
    const t = TONES[tone];
    return (
        <div className={`bg-gradient-to-br ${t.bg} border p-4 sm:p-5 rounded-2xl shadow-sm`}>
            <div className="flex justify-between items-start gap-2 mb-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${t.text}`}>{label}</span>
                <div className={`w-8 h-8 shrink-0 rounded-lg bg-white flex items-center justify-center shadow-sm ${t.icon}`}>{icon}</div>
            </div>
            <div className="text-2xl font-black text-gray-900 tracking-tight">{value}</div>
            {hint && <div className={`text-xs font-medium mt-1 ${t.text}`}>{hint}</div>}
        </div>
    );
};

export const Avatar = ({ name, photo, size = 36 }: { name: string; photo?: string; size?: number }) => {
    const initials = name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase())
        .join('');
    const palette = ['bg-indigo-100 text-indigo-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-sky-100 text-sky-700', 'bg-rose-100 text-rose-700', 'bg-violet-100 text-violet-700'];
    const color = palette[(name.charCodeAt(0) || 0) % palette.length];
    if (photo) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={resolveImageUrl(photo)} alt={name} style={{ width: size, height: size }} className="rounded-full object-cover shrink-0 ring-2 ring-white" />;
    }
    return (
        <div style={{ width: size, height: size, fontSize: size * 0.36 }} className={`rounded-full shrink-0 flex items-center justify-center font-bold ring-2 ring-white ${color}`}>
            {initials || '?'}
        </div>
    );
};

export const PersonCell = ({ name, sub, photo, href }: { name: string; sub?: React.ReactNode; photo?: string; href?: string }) => {
    const inner = (
        <div className="flex items-center gap-3 min-w-0">
            <Avatar name={name} photo={photo} />
            <div className="min-w-0">
                <div className={`text-sm font-semibold text-gray-900 truncate ${href ? 'group-hover:text-indigo-600' : ''}`}>{name}</div>
                {sub && <div className="text-xs text-gray-500 truncate">{sub}</div>}
            </div>
        </div>
    );
    return href ? (
        <a href={href} className="group block">
            {inner}
        </a>
    ) : (
        inner
    );
};

export const Field = ({ label, required, hint, children, className = '' }: { label: string; required?: boolean; hint?: string; children: React.ReactNode; className?: string }) => (
    <label className={`block ${className}`}>
        <span className="block text-xs font-semibold text-gray-700 mb-1.5">
            {label} {required && <span className="text-rose-500">*</span>}
        </span>
        {children}
        {hint && <span className="block text-[11px] text-gray-400 mt-1">{hint}</span>}
    </label>
);

export const Modal = ({
    open,
    onClose,
    title,
    subtitle,
    children,
    footer,
    size = 'md',
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}) => {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [open, onClose]);
    if (!open) return null;
    const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };
    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={onClose} />
            <div className={`relative w-full ${widths[size]} bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92vh]`} role="dialog" aria-modal="true">
                <div className="flex items-start justify-between gap-4 px-5 sm:px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
                    </div>
                    <button onClick={onClose} className={btn.icon} aria-label="Close">
                        <LuX size={18} />
                    </button>
                </div>
                <div className="px-5 sm:px-6 py-5 overflow-y-auto">{children}</div>
                {footer && <div className="px-5 sm:px-6 py-3.5 border-t border-gray-100 bg-gray-50/60 sm:rounded-b-2xl flex flex-wrap justify-end gap-2">{footer}</div>}
            </div>
        </div>
    );
};

export const ConfirmDialog = ({
    open,
    title,
    message,
    confirmLabel = 'Confirm',
    tone = 'danger',
    loading,
    onConfirm,
    onClose,
    children,
}: {
    open: boolean;
    title: string;
    message?: React.ReactNode;
    confirmLabel?: string;
    tone?: 'danger' | 'primary' | 'success';
    loading?: boolean;
    onConfirm: () => void;
    onClose: () => void;
    children?: React.ReactNode;
}) => (
    <Modal
        open={open}
        onClose={onClose}
        title={title}
        size="sm"
        footer={
            <>
                <button className={btn.secondary} onClick={onClose} disabled={loading}>
                    Cancel
                </button>
                <button className={btn[tone]} onClick={onConfirm} disabled={loading}>
                    {loading ? 'Please wait…' : confirmLabel}
                </button>
            </>
        }
    >
        <div className="flex gap-3">
            <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${tone === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                <LuCircleAlert size={20} />
            </div>
            <div className="text-sm text-gray-600 leading-relaxed pt-1.5 flex-1">
                {message}
                {children}
            </div>
        </div>
    </Modal>
);

export const EmptyState = ({ icon, title, text, action }: { icon?: React.ReactNode; title: string; text?: string; action?: React.ReactNode }) => (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
        <div className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mb-3">{icon || <LuInbox size={26} />}</div>
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        {text && <p className="text-xs text-gray-500 mt-1 max-w-sm">{text}</p>}
        {action && <div className="mt-4">{action}</div>}
    </div>
);

export const Skeleton = ({ className = '' }: { className?: string }) => <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />;

export const MonthPicker = ({ value, onChange, max }: { value: string; onChange: (m: string) => void; max?: string }) => (
    <div className="inline-flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
        <button className="px-2.5 py-2 text-gray-500 hover:bg-gray-50" onClick={() => onChange(shiftMonth(value, -1))} aria-label="Previous month">
            <LuChevronLeft size={16} />
        </button>
        <input
            type="month"
            value={value}
            max={max}
            onChange={(e) => e.target.value && onChange(e.target.value)}
            className="px-1 py-1.5 text-sm font-semibold text-gray-800 outline-none bg-transparent w-[150px] text-center"
        />
        <button
            className="px-2.5 py-2 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
            onClick={() => onChange(shiftMonth(value, 1))}
            disabled={!!max && shiftMonth(value, 1) > max}
            aria-label="Next month"
        >
            <LuChevronRight size={16} />
        </button>
    </div>
);

export const DatePicker = ({ value, onChange, max }: { value: string; onChange: (d: string) => void; max?: string }) => (
    <div className="inline-flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
        <button className="px-2.5 py-2 text-gray-500 hover:bg-gray-50" onClick={() => onChange(shiftDate(value, -1))} aria-label="Previous day">
            <LuChevronLeft size={16} />
        </button>
        <input
            type="date"
            value={value}
            max={max}
            onChange={(e) => e.target.value && onChange(e.target.value)}
            className="px-1 py-1.5 text-sm font-semibold text-gray-800 outline-none bg-transparent w-[140px] text-center"
        />
        <button
            className="px-2.5 py-2 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
            onClick={() => onChange(shiftDate(value, 1))}
            disabled={!!max && shiftDate(value, 1) > max}
            aria-label="Next day"
        >
            <LuChevronRight size={16} />
        </button>
    </div>
);

export const Tabs = <T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void }) => (
    <div className="inline-flex p-1 bg-gray-100 rounded-xl gap-1 overflow-x-auto max-w-full">
        {tabs.map((t) => (
            <button
                key={t.id}
                onClick={() => onChange(t.id)}
                className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition ${
                    value === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
            >
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${value === t.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'}`}>{t.count}</span>
                )}
            </button>
        ))}
    </div>
);
