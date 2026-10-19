'use client';

import { useState } from 'react';
import {
    LuSearch, LuRefreshCw, LuFileText, LuFileSpreadsheet, LuRotateCcw,
    LuChevronLeft, LuChevronRight, LuTrash2,
} from 'react-icons/lu';
import { useGetReturnOrdersQuery, useBulkDeleteOrdersMutation } from '@/redux/api/orderApi';
import { downloadReturnsReport } from '@/lib/downloadInvoice';
import { getStatusConfig, paymentMethodLabel } from '@/lib/orderStatus';
import OrderDetailsModal from '@/components/admin/OrderDetailsModal';
import toast from 'react-hot-toast';
import { useAppSelector } from '@/redux/hooks';

/**
 * Returns & Refunds — orders that failed at / came back from the courier
 * (cancelled, returned or refunded). No request-approval cards here: it's a
 * clean, filterable list you can export as a professional CSV or PDF report.
 */
const TABS = [
    { key: 'all', label: 'All' },
    { key: 'returned', label: 'Returned' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'refunded', label: 'Refunded' },
];

const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const humanize = (s: string) => (s || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();

export default function AdminReturnsPage() {
    const [tab, setTab] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [viewId, setViewId] = useState<string | null>(null);
    const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const limit = 15;

    const user = useAppSelector((state) => state.auth.user);
    const isSuperAdmin = user?.role === 'superadmin';
    const [bulkDelete, { isLoading: isDeleting }] = useBulkDeleteOrdersMutation();

    const { data, isLoading, isFetching, refetch } = useGetReturnOrdersQuery({
        status: tab === 'all' ? undefined : tab,
        search: search || undefined,
        page,
        limit,
    });

    const rows: any[] = data?.data || [];
    const meta = data?.meta || { total: 0, page: 1, limit, totalPages: 1 };
    const counts = (data as any)?.counts || { all: 0, returned: 0, cancelled: 0, refunded: 0 };

    const doExport = async (format: 'csv' | 'pdf') => {
        setExporting(format);
        try {
            await downloadReturnsReport(format, { status: tab, search });
            toast.success(`${format.toUpperCase()} report downloaded`);
        } catch {
            toast.error(`Could not generate the ${format.toUpperCase()} report`);
        } finally {
            setExporting(null);
        }
    };

    const countFor = (key: string) => (key === 'all' ? counts.all : counts[key] ?? 0);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedIds(new Set(rows.map((r: any) => r.orderId)));
        else setSelectedIds(new Set());
    };

    const handleSelect = (id: string, checked: boolean) => {
        const newSet = new Set(selectedIds);
        if (checked) newSet.add(id);
        else newSet.delete(id);
        setSelectedIds(newSet);
    };

    const handleDeleteSelected = async () => {
        if (!isSuperAdmin) {
            toast.error('Only Super Admins can delete orders.');
            return;
        }
        if (!confirm(`Are you sure you want to completely delete ${selectedIds.size} orders from the database? This action cannot be undone.`)) return;

        try {
            // Find _id from orderId (the API returns _id usually, but let's check what rows map to)
            // Wait, rows mapped to r.orderId, but the backend bulkDelete expects _id!
            // Let's use the actual _id for the mutation.
            const idsToDelete = rows.filter(r => selectedIds.has(r.orderId)).map(r => r._id);
            await bulkDelete(idsToDelete).unwrap();
            toast.success(`${selectedIds.size} orders completely deleted.`);
            setSelectedIds(new Set());
            refetch();
        } catch {
            toast.error('Failed to delete orders.');
        }
    };

    const allSelected = rows.length > 0 && selectedIds.size === rows.length;
    const isIndeterminate = selectedIds.size > 0 && selectedIds.size < rows.length;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-lg bg-primary-lightest flex items-center justify-center">
                        <LuRotateCcw className="text-[var(--color-primary)]" size={18} />
                    </span>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Returns &amp; Refunds</h1>
                        <p className="text-[13px] text-gray-500">Orders returned, cancelled or refunded via the courier</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => doExport('csv')}
                        disabled={exporting !== null || rows.length === 0}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-md text-[13px] font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                    >
                        <LuFileSpreadsheet size={15} className="text-emerald-600" /> {exporting === 'csv' ? 'Exporting…' : 'CSV'}
                    </button>
                    <button
                        onClick={() => doExport('pdf')}
                        disabled={exporting !== null || rows.length === 0}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-md text-[13px] font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                    >
                        <LuFileText size={15} className="text-red-500" /> {exporting === 'pdf' ? 'Exporting…' : 'PDF'}
                    </button>
                    <button
                        onClick={() => refetch()}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-md text-[13px] font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                        <LuRefreshCw size={15} className={isFetching ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>
            </div>

            {/* Action Bar (When items are selected) */}
            {selectedIds.size > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-center justify-between animate-fade-in-up">
                    <p className="text-sm font-semibold text-rose-800">{selectedIds.size} order(s) selected</p>
                    {isSuperAdmin ? (
                        <button
                            onClick={handleDeleteSelected}
                            disabled={isDeleting}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded shadow-sm disabled:opacity-50"
                        >
                            <LuTrash2 size={14} />
                            {isDeleting ? 'Deleting...' : 'Delete Completely'}
                        </button>
                    ) : (
                        <p className="text-xs text-rose-600 font-medium bg-rose-100 px-2 py-1 rounded">Only Super Admins can delete orders</p>
                    )}
                </div>
            )}

            {/* Filter tabs + search */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="flex flex-wrap gap-1.5">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => { setTab(t.key); setPage(1); }}
                            className={`px-3.5 py-1.5 rounded-md text-[13px] font-semibold transition-all ${tab === t.key
                                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {t.label}
                            <span className={`ml-1.5 text-xs ${tab === t.key ? 'text-white/80' : 'text-gray-400'}`}>({countFor(t.key)})</span>
                        </button>
                    ))}
                </div>
                <div className="flex-1 relative lg:max-w-sm lg:ml-auto">
                    <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search order, customer, phone, tracking…"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-md focus:border-[var(--color-primary)] outline-none text-sm"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 w-10">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500 cursor-pointer"
                                    />
                                </th>
                                {['Order', 'Customer', 'Items', 'Amount', 'Status', 'Courier', 'Date'].map((h) => (
                                    <th key={h} className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                                <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">View</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                [...Array(6)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {[...Array(9)].map((__, j) => (<td key={j} className="px-4 py-3.5"><div className="h-4 bg-gray-100 rounded w-20" /></td>))}
                                    </tr>
                                ))
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center">
                                        <LuRotateCcw size={44} className="mx-auto text-gray-200 mb-3" />
                                        <p className="text-gray-500">No returns or refunds in this view</p>
                                    </td>
                                </tr>
                            ) : (
                                rows.map((r) => {
                                    const cfg = getStatusConfig(r.status);
                                    return (
                                        <tr key={r.orderId} className={`hover:bg-gray-50/50 ${selectedIds.has(r.orderId) ? 'bg-rose-50/30' : ''}`}>
                                            <td className="px-4 py-3.5">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(r.orderId)}
                                                    onChange={(e) => handleSelect(r.orderId, e.target.checked)}
                                                    className="w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-4 py-3.5"><p className="font-semibold text-[var(--color-primary)]">{r.orderId}</p></td>
                                            <td className="px-4 py-3.5">
                                                <p className="font-medium text-gray-800 text-sm">{r.customer}</p>
                                                <p className="text-xs text-gray-400">{r.phone}</p>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <p className="text-sm text-gray-700 truncate max-w-[220px]" title={r.itemsText}>{r.itemsText || '—'}</p>
                                                <p className="text-[11px] text-gray-400">{r.itemCount} item{r.itemCount > 1 ? 's' : ''}</p>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <p className="font-bold text-gray-800">৳{Number(r.total).toLocaleString()}</p>
                                                <p className="text-[11px] text-gray-400">{paymentMethodLabel(r.paymentMethod)}</p>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>{cfg.label}</span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {r.courierStatus
                                                    ? <p className="text-xs text-gray-600">{humanize(r.courierStatus)}</p>
                                                    : <span className="text-[11px] text-gray-300">—</span>}
                                            </td>
                                            <td className="px-4 py-3.5"><p className="text-sm text-gray-500">{fmtDate(r.date)}</p></td>
                                            <td className="px-4 py-3.5 text-right">
                                                <button
                                                    onClick={() => setViewId(r.orderId)}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile cards */}
                <div className="lg:hidden divide-y divide-gray-100">
                    {isLoading ? (
                        [...Array(5)].map((_, i) => (<div key={i} className="p-4 animate-pulse"><div className="h-20 bg-gray-100 rounded-lg" /></div>))
                    ) : rows.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <LuRotateCcw size={40} className="mx-auto text-gray-200 mb-3" />
                            <p className="text-gray-500">No returns or refunds in this view</p>
                        </div>
                    ) : (
                        rows.map((r) => {
                            const cfg = getStatusConfig(r.status);
                            return (
                                <div key={r.orderId} className={`p-4 space-y-2.5 relative ${selectedIds.has(r.orderId) ? 'bg-rose-50/30' : ''}`}>
                                    <div className="absolute top-4 left-4 z-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(r.orderId)}
                                            onChange={(e) => handleSelect(r.orderId, e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-300 text-rose-500 focus:ring-rose-500 cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between gap-2 pl-8">
                                        <p className="font-semibold text-[var(--color-primary)]">{r.orderId}</p>
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>{cfg.label}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-medium text-gray-800 text-sm truncate">{r.customer}</p>
                                            <p className="text-xs text-gray-400 truncate">{r.phone} · {fmtDate(r.date)}</p>
                                        </div>
                                        <p className="font-bold text-gray-800 shrink-0">৳{Number(r.total).toLocaleString()}</p>
                                    </div>
                                    {r.courierStatus && <p className="text-xs text-gray-500">Courier: {humanize(r.courierStatus)}</p>}
                                    <button
                                        onClick={() => setViewId(r.orderId)}
                                        className="w-full mt-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20"
                                    >
                                        View details
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Pagination */}
                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                    <p className="text-[13px] text-gray-500">
                        Showing <span className="text-gray-900 font-medium">{rows.length}</span> of <span className="text-gray-900 font-medium">{meta.total}</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setPage((x) => Math.max(1, x - 1))} disabled={page === 1} className="p-1.5 border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"><LuChevronLeft size={16} /></button>
                        <span className="text-[13px] text-gray-600 px-1">{page} / {meta.totalPages}</span>
                        <button onClick={() => setPage((x) => Math.min(meta.totalPages, x + 1))} disabled={page >= meta.totalPages} className="p-1.5 border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"><LuChevronRight size={16} /></button>
                    </div>
                </div>
            </div>

            <OrderDetailsModal orderId={viewId} onClose={() => setViewId(null)} onChanged={refetch} />
        </div>
    );
}
