"use client";

import React, { useState } from 'react';
import {
    LuSearch, LuRefreshCw, LuTruck, LuEye,
    LuChevronLeft, LuChevronRight, LuBanknote,
} from 'react-icons/lu';
import {
    useGetCourierPackagesQuery,
    useGetCourierBalanceQuery,
    type ICourierPackage,
} from '@/redux/api/courierApi';
import { getStatusConfig, paymentMethodLabel } from '@/lib/orderStatus';
import OrderItemsPreview from '@/components/shared/OrderItemsPreview';
import CourierTrackingModal from '@/components/admin/CourierTrackingModal';

/**
 * Courier / Shipments — a READ-ONLY monitoring board.
 *
 * Orders are booked to the courier automatically when an admin Confirms them
 * (in Orders), so there is no manual select/booking here. This page just lets
 * you watch where every parcel is: filter by state, search, and open a
 * shipment to see the live tracking stepper. The Steadfast balance and each
 * order's courier status are polled so they stay current on their own.
 */
const STATE_TABS = [
    { key: 'all', label: 'All' },
    { key: 'to_ship', label: 'To Ship' },        // confirmed, not yet handed to courier
    { key: 'shipped', label: 'Shipped' },         // booked & in transit
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
];

export default function CourierShipmentsPage() {
    const [state, setState] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [viewId, setViewId] = useState<string | null>(null);
    const limit = 20;

    const { data, isLoading, isFetching, refetch } = useGetCourierPackagesQuery(
        { state: state !== 'all' ? state : undefined, search: search || undefined, page, limit },
        { pollingInterval: 60000 },
    );
    const { data: balanceData } = useGetCourierBalanceQuery(undefined, { pollingInterval: 60000 });

    const rows: ICourierPackage[] = data?.data || [];
    const meta = data?.meta || { total: 0, page: 1, limit, totalPages: 1 };
    const balance = balanceData?.data?.current_balance;

    const CourierCell = ({ p }: { p: ICourierPackage }) =>
        p.booked ? (
            <div className="leading-tight">
                <p className="font-mono text-xs font-bold text-gray-700">{p.trackingNumber || '—'}</p>
                {p.courierStatus && <p className="text-[11px] text-gray-400">{p.courierStatus}</p>}
            </div>
        ) : (
            <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded">Not booked</span>
        );

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-lg bg-primary-lightest flex items-center justify-center">
                        <LuTruck className="text-[var(--color-primary)]" size={18} />
                    </span>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Courier / Shipments</h1>
                        <p className="text-[13px] text-gray-500">Live view of every parcel — booked automatically on confirm</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 rounded-md bg-emerald-50 border border-emerald-100 flex items-center gap-2">
                        <LuBanknote className="text-emerald-600" size={15} />
                        <div className="leading-tight">
                            <p className="text-[9px] text-emerald-700/70 font-semibold uppercase tracking-wide">Steadfast Balance</p>
                            <p className="text-sm font-bold text-emerald-700">
                                {typeof balance === 'number' ? `৳${balance.toLocaleString()}` : '—'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => refetch()}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-md text-[13px] font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                        <LuRefreshCw size={15} className={isFetching ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>
            </div>

            {/* Filters: state tabs + search */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="flex flex-wrap gap-1.5">
                    {STATE_TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => { setState(t.key); setPage(1); }}
                            className={`px-3.5 py-1.5 rounded-md text-[13px] font-semibold transition-all ${state === t.key
                                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {t.label}
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
                {/* Desktop / tablet */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                {['Order', 'Product', 'Customer', 'Amount', 'Status', 'Courier'].map((h) => (
                                    <th key={h} className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                                <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">View</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                [...Array(8)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {[...Array(7)].map((__, j) => (
                                            <td key={j} className="px-4 py-3.5"><div className="h-4 bg-gray-100 rounded w-20" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <LuTruck size={44} className="mx-auto text-gray-200 mb-3" />
                                        <p className="text-gray-500">No packages in this view</p>
                                    </td>
                                </tr>
                            ) : (
                                rows.map((p) => {
                                    const cfg = getStatusConfig(p.status);
                                    return (
                                        <tr key={p.orderId} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3.5">
                                                <p className="font-semibold text-[var(--color-primary)]">{p.orderNo}</p>
                                                <p className="text-[11px] text-gray-400">{p.itemCount} item{p.itemCount > 1 ? 's' : ''}</p>
                                            </td>
                                            <td className="px-4 py-3.5"><OrderItemsPreview items={p.items} totalCount={p.itemCount} /></td>
                                            <td className="px-4 py-3.5">
                                                <p className="font-medium text-gray-800 text-sm">{p.customer}</p>
                                                <p className="text-xs text-gray-400">{p.phone}{p.city ? ` · ${p.city}` : ''}</p>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <p className="font-bold text-gray-800">৳{p.subtotal?.toLocaleString()}</p>
                                                {p.codAmount > 0
                                                    ? <p className="text-[11px] font-semibold text-emerald-600">COD ৳{p.codAmount.toLocaleString()}</p>
                                                    : <p className="text-[11px] text-gray-400">{paymentMethodLabel(p.paymentMethod)} · paid</p>}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5"><CourierCell p={p} /></td>
                                            <td className="px-4 py-3.5 text-right">
                                                <button
                                                    onClick={() => setViewId(p.orderId)}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20"
                                                    title="View tracking"
                                                >
                                                    <LuEye size={14} /> View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile: cards */}
                <div className="lg:hidden divide-y divide-gray-100">
                    {isLoading ? (
                        [...Array(6)].map((_, i) => (
                            <div key={i} className="p-4 animate-pulse"><div className="h-24 bg-gray-100 rounded-lg" /></div>
                        ))
                    ) : rows.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <LuTruck size={44} className="mx-auto text-gray-200 mb-3" />
                            <p className="text-gray-500">No packages in this view</p>
                        </div>
                    ) : (
                        rows.map((p) => {
                            const cfg = getStatusConfig(p.status);
                            return (
                                <div key={p.orderId} className="p-4 space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-[var(--color-primary)]">{p.orderNo}</p>
                                            <p className="text-[11px] text-gray-400">{p.itemCount} item{p.itemCount > 1 ? 's' : ''}</p>
                                        </div>
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
                                            {cfg.label}
                                        </span>
                                    </div>
                                    <OrderItemsPreview items={p.items} totalCount={p.itemCount} />
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-medium text-gray-800 text-sm truncate">{p.customer}</p>
                                            <p className="text-xs text-gray-400 truncate">{p.phone}{p.city ? ` · ${p.city}` : ''}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-bold text-gray-800">৳{p.subtotal?.toLocaleString()}</p>
                                            {p.codAmount > 0
                                                ? <p className="text-[11px] font-semibold text-emerald-600">COD ৳{p.codAmount.toLocaleString()}</p>
                                                : <p className="text-[11px] text-gray-400">{paymentMethodLabel(p.paymentMethod)} · paid</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 pt-1">
                                        <CourierCell p={p} />
                                        <button
                                            onClick={() => setViewId(p.orderId)}
                                            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 shrink-0"
                                        >
                                            <LuEye size={14} /> View
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Pagination */}
                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                    <p className="text-[13px] text-gray-500">
                        Showing <span className="text-gray-900 font-medium">{rows.length}</span> of <span className="text-gray-900 font-medium">{meta.total}</span> packages
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((x) => Math.max(1, x - 1))}
                            disabled={page === 1}
                            className="p-1.5 border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            <LuChevronLeft size={16} />
                        </button>
                        <span className="text-[13px] text-gray-600 px-1">{page} / {meta.totalPages}</span>
                        <button
                            onClick={() => setPage((x) => Math.min(meta.totalPages, x + 1))}
                            disabled={page >= meta.totalPages}
                            className="p-1.5 border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            <LuChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <CourierTrackingModal orderId={viewId} onClose={() => setViewId(null)} />
        </div>
    );
}
