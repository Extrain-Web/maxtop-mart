"use client";

import React, { useState } from 'react';
import { LuSearch, LuRefreshCw, LuClock, LuCircleCheck, LuLayers, LuUserPlus } from 'react-icons/lu';
import {
    useGetAdminOrdersQuery,
    useUpdateOrderStatusMutation,
    useGetOrderStatsQuery,
    useDeleteOrderMutation,
    useBulkDeleteOrdersMutation,
} from '@/redux/api/orderApi';
import { toast } from 'react-hot-toast';
import AdminOrdersTable from '@/components/admin/AdminOrdersTable';
import OrderDetailsModal from '@/components/admin/OrderDetailsModal';
import CreateOrderModal from '@/components/admin/CreateOrderModal';
import { useBookCourierPackageMutation } from '@/redux/api/courierApi';
import { downloadInvoicePdf, downloadThermalLabelPdf } from '@/lib/downloadInvoice';

/**
 * Orders — the single hub for the start of the order lifecycle.
 *
 * Three views in one place:
 *   • All        — every order, for a complete overview (default)
 *   • Pending    — newly placed orders waiting to be Confirmed or Cancelled
 *   • Confirmed  — accepted orders being prepared for the courier
 *
 * The tab cards show live counts. Confirming a pending order moves it into
 * Confirmed (and, once courier integration is live, books it to the courier).
 */

type Tab = 'all' | 'pending' | 'confirmed';

export default function OrdersPage() {
    const [tab, setTab] = useState<Tab>('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [viewId, setViewId] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const limit = 12;

    const { data: ordersData, isLoading, refetch } = useGetAdminOrdersQuery({
        page,
        limit,
        status: tab === 'all' ? undefined : tab,
        search: search || undefined,
    });
    const { data: statsData } = useGetOrderStatsQuery({});
    const [updateStatus] = useUpdateOrderStatusMutation();
    const [bookCourier] = useBookCourierPackageMutation();
    const [deleteOrder] = useDeleteOrderMutation();
    const [bulkDelete] = useBulkDeleteOrdersMutation();

    const orders = ordersData?.data || [];
    const totalPages = ordersData?.meta?.totalPages || 1;
    const totalOrders = ordersData?.meta?.total || 0;

    const stats = statsData?.data || {};
    const allCount = stats.total ?? 0;
    const pendingCount = stats.pending ?? 0;
    const confirmedCount = stats.confirmed ?? 0;

    const switchTab = (next: Tab) => { setTab(next); setPage(1); };

    const act = async (id: string, status: 'confirmed' | 'cancelled') => {
        setBusyId(id);
        try {
            await updateStatus({ id, status }).unwrap();
            if (status === 'confirmed') {
                // Hand the parcel to the courier the moment it's confirmed.
                // Best-effort: if Steadfast isn't configured yet (or it's already
                // booked), the order still stays confirmed and shows under "To Ship".
                try { await bookCourier({ orderId: id }).unwrap(); } catch { /* courier not ready — ignore */ }
            }
            toast.success(status === 'confirmed' ? 'Order confirmed' : 'Order cancelled', {
                style: { borderRadius: '8px', background: 'var(--color-primary)', color: '#fff' },
            });
            refetch();
        } catch (err: any) {
            toast.error(err?.data?.message || 'Could not update the order');
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this order permanently?')) return;
        try {
            await deleteOrder(id).unwrap();
            toast.success('Order deleted');
            refetch();
        } catch {
            toast.error('Failed to delete order');
        }
    };

    const handleBulkDelete = async (ids: string[]) => {
        try {
            await bulkDelete(ids).unwrap();
            toast.success(`${ids.length} orders deleted`);
            refetch();
        } catch {
            toast.error('Failed to delete orders');
        }
    };

    const handleBulkPrintA4 = async (ids: string[]) => {
        toast.loading(`Preparing ${ids.length} A4 invoices…`, { id: 'bulk-print' });
        try {
            for (const id of ids) { await downloadInvoicePdf(id); await new Promise((r) => setTimeout(r, 400)); }
            toast.success('Invoices downloaded', { id: 'bulk-print' });
        } catch { toast.error('Failed to download some invoices', { id: 'bulk-print' }); }
    };

    const handleBulkPrintThermal = async (ids: string[]) => {
        toast.loading(`Preparing ${ids.length} thermal labels…`, { id: 'bulk-print' });
        try {
            for (const id of ids) { await downloadThermalLabelPdf(id); await new Promise((r) => setTimeout(r, 400)); }
            toast.success('Thermal labels downloaded', { id: 'bulk-print' });
        } catch { toast.error('Failed to download some labels', { id: 'bulk-print' }); }
    };

    const cards: { key: Tab; label: string; count: number; icon: React.ElementType; tint: string; ring: string }[] = [
        { key: 'all', label: 'All Orders', count: allCount, icon: LuLayers, tint: 'text-gray-700 bg-gray-100', ring: 'ring-gray-900' },
        { key: 'pending', label: 'Pending', count: pendingCount, icon: LuClock, tint: 'text-amber-700 bg-amber-100', ring: 'ring-amber-500' },
        { key: 'confirmed', label: 'Confirmed', count: confirmedCount, icon: LuCircleCheck, tint: 'text-green-700 bg-green-100', ring: 'ring-green-600' },
    ];

    const emptyText =
        tab === 'pending' ? "No pending orders — you're all caught up"
            : tab === 'confirmed' ? 'No confirmed orders yet'
                : 'No orders yet';

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Orders</h1>
                    <p className="text-[13px] text-gray-500">Confirm new orders and track what's being fulfilled</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => refetch()}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-md text-[13px] font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-all"
                    >
                        <LuRefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <button
                        onClick={() => setCreateOpen(true)}
                        className="px-3.5 py-2 rounded-md text-[13px] font-semibold text-white flex items-center gap-2 transition-all bg-primary hover:bg-primary-dark"
                    >
                        <LuUserPlus size={15} /> Create Order
                    </button>
                </div>
            </div>

            {/* Tab cards (double as the status filter) */}
            <div className="grid grid-cols-3 gap-3">
                {cards.map((c) => {
                    const active = tab === c.key;
                    return (
                        <button
                            key={c.key}
                            onClick={() => switchTab(c.key)}
                            className={`text-left bg-white rounded-lg border p-3.5 flex items-center gap-3 transition-all ${active ? `border-transparent ring-2 ${c.ring} shadow-sm` : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${c.tint}`}>
                                <c.icon size={18} />
                            </span>
                            <span className="min-w-0">
                                <span className="block text-xl font-bold text-gray-900 leading-none">{c.count}</span>
                                <span className="block text-xs text-gray-500 font-medium mt-1 truncate">{c.label}</span>
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            <div className="relative">
                <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                    type="text"
                    name="adminSearch"
                    autoComplete="off"
                    placeholder="Search by order number or customer…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-md focus:ring-1 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all outline-none text-sm"
                />
            </div>

            {/* Orders table — actions are status-driven (Confirm/Cancel on pending rows) */}
            <AdminOrdersTable
                orders={orders}
                isLoading={isLoading}
                skeletonRows={limit}
                emptyText={emptyText}
                variant={tab === 'pending' ? 'pending' : 'confirmed'}
                onConfirm={(id) => act(id, 'confirmed')}
                onCancel={(id) => act(id, 'cancelled')}
                onView={(id) => setViewId(id)}
                busyId={busyId}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                total={totalOrders}
                onDelete={handleDelete}
                onBulkDelete={handleBulkDelete}
                onBulkPrintA4={handleBulkPrintA4}
                onBulkPrintThermal={handleBulkPrintThermal}
            />

            <OrderDetailsModal orderId={viewId} onClose={() => setViewId(null)} onChanged={refetch} />
            <CreateOrderModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refetch} />
        </div>
    );
}
