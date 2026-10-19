"use client";

import React from 'react';
import { LuEye, LuPackage, LuX, LuCheck, LuChevronLeft, LuChevronRight, LuTrash2, LuPrinter, LuFileText } from 'react-icons/lu';
import { getStatusConfig, paymentMethodLabel, paymentMethodBadge } from '@/lib/orderStatus';
import OrderItemsPreview from '@/components/shared/OrderItemsPreview';

/* Payment-method pill (bKash / COD / …) shared by both admin order lists. */
const PaymentMethodBadge = ({ method }: { method: string }) => {
    const key = (method || '').toLowerCase();
    const label = method ? paymentMethodLabel(method) : '—';
    const c = paymentMethodBadge[key] || { bg: '#f3f4f6', color: '#6b7280' };
    return (
        <span className="inline-flex items-center justify-center text-center whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: c.bg, color: c.color }}>
            {label}
        </span>
    );
};

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
};

interface AdminOrdersTableProps {
    orders: any[];
    isLoading: boolean;
    skeletonRows?: number;
    emptyText?: string;
    /** 'pending' shows Confirm/Cancel actions; 'confirmed' is read-only (View only). */
    variant: 'pending' | 'confirmed';
    onConfirm?: (id: string) => void;
    onCancel?: (id: string) => void;
    /** Open the order details modal instead of navigating to a page. */
    onView?: (id: string) => void;
    busyId?: string | null;
    /* Pagination (optional — rendered only when totalPages > 1) */
    page?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
    total?: number;
    /** Handlers for new features */
    onDelete?: (id: string) => void;
    onBulkDelete?: (ids: string[]) => void;
    onBulkPrintA4?: (ids: string[]) => void;
    onBulkPrintThermal?: (ids: string[]) => void;
}

const AdminOrdersTable: React.FC<AdminOrdersTableProps> = ({
    orders, isLoading, skeletonRows = 8, emptyText = 'No orders here yet',
    variant, onConfirm, onCancel, onView, busyId,
    page = 1, totalPages = 1, onPageChange, total = 0,
    onDelete, onBulkDelete, onBulkPrintA4, onBulkPrintThermal,
}) => {
    const isPending = variant === 'pending';
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

    // Reset selection when page changes
    React.useEffect(() => {
        setSelectedIds(new Set());
    }, [page, orders]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedIds(new Set(orders.map((o: any) => o._id)));
        else setSelectedIds(new Set());
    };

    const handleSelect = (id: string, checked: boolean) => {
        const newSet = new Set(selectedIds);
        if (checked) newSet.add(id);
        else newSet.delete(id);
        setSelectedIds(newSet);
    };

    const allSelected = orders.length > 0 && selectedIds.size === orders.length;
    const isIndeterminate = selectedIds.size > 0 && selectedIds.size < orders.length;

    const RowActions = ({ order }: { order: any }) => {
        const busy = busyId === order._id;
        // Actions are status-driven so the same table works for the All / Pending
        // / Confirmed tabs: only a still-pending order can be confirmed/cancelled.
        const canAct = order.status === 'pending';
        return (
            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                {canAct && onConfirm && (
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => onConfirm(order._id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-all"
                        title="Confirm order"
                    >
                        <LuCheck size={14} /> Confirm
                    </button>
                )}
                {canAct && onCancel && (
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => onCancel(order._id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-all"
                        title="Cancel order"
                    >
                        <LuX size={14} /> Cancel
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => onView?.(order._id)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 transition-all"
                    title="View details"
                >
                    <LuEye size={14} /> View
                </button>
                {onDelete && (
                    <button
                        type="button"
                        onClick={() => onDelete(order._id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all"
                        title="Delete order"
                    >
                        <LuTrash2 size={14} /> Delete
                    </button>
                )}
            </div>
        );
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const sc = getStatusConfig(status);
        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${sc.badgeBg} ${sc.badgeText}`}>
                {sc.label}
            </span>
        );
    };

    return (
        <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
            {/* Desktop / tablet: table */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-4 py-4 w-12 text-center">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={(input) => { if (input) input.indeterminate = isIndeterminate; }}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                                />
                            </th>
                            {['Order', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date'].map((h) => (
                                <th key={h} className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            [...Array(skeletonRows)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    {[...Array(8)].map((__, j) => (
                                        <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-20" /></td>
                                    ))}
                                </tr>
                            ))
                        ) : orders.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-6 py-12 text-center">
                                    <LuPackage size={48} className="mx-auto text-gray-200 mb-4" />
                                    <p className="text-gray-500">{emptyText}</p>
                                </td>
                            </tr>
                        ) : (
                            orders.map((order: any) => (
                                <tr key={order._id} className={`hover:bg-gray-50/50 transition-colors ${selectedIds.has(order._id) ? 'bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10' : ''}`}>
                                    <td className="px-4 py-4 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(order._id)}
                                            onChange={(e) => handleSelect(order._id, e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-[var(--color-primary)]">{order.orderId || order.orderNumber}</p>
                                        {order.transactionId && (
                                            <p className="text-[10px] text-gray-400 font-mono mt-1 truncate max-w-[110px]" title={order.transactionId}>TxID: {order.transactionId}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-gray-800">{order.user?.firstName} {order.user?.lastName}</p>
                                        <p className="text-xs text-gray-400">{order.user?.email}</p>
                                    </td>
                                    <td className="px-6 py-4"><OrderItemsPreview items={order.items} totalCount={order.items?.length} /></td>
                                    <td className="px-6 py-4"><p className="font-bold text-gray-800">৳{order.total?.toLocaleString()}</p></td>
                                    <td className="px-6 py-4"><PaymentMethodBadge method={order.paymentMethod} /></td>
                                    <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                                    <td className="px-6 py-4"><p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p></td>
                                    <td className="px-6 py-4"><RowActions order={order} /></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile: cards */}
            <div className="lg:hidden divide-y divide-gray-100">
                {isLoading ? (
                    [...Array(5)].map((_, i) => (
                        <div key={i} className="p-4 animate-pulse"><div className="h-24 bg-gray-100 rounded-lg" /></div>
                    ))
                ) : orders.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <LuPackage size={44} className="mx-auto text-gray-200 mb-3" />
                        <p className="text-gray-500">{emptyText}</p>
                    </div>
                ) : (
                    orders.map((order: any) => (
                        <div key={order._id} className={`p-4 space-y-3 relative ${selectedIds.has(order._id) ? 'bg-[var(--color-primary)]/5' : ''}`}>
                            <div className="absolute top-4 left-4 z-10">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has(order._id)}
                                    onChange={(e) => handleSelect(order._id, e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                                />
                            </div>
                            <div className="flex items-start justify-between gap-2 pl-8">
                                <div className="min-w-0">
                                    <p className="font-semibold text-[var(--color-primary)]">{order.orderId || order.orderNumber}</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
                                </div>
                                <PaymentMethodBadge method={order.paymentMethod} />
                            </div>
                            <OrderItemsPreview items={order.items} totalCount={order.items?.length} />
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-medium text-gray-800 text-sm truncate">{order.user?.firstName} {order.user?.lastName}</p>
                                    <p className="text-xs text-gray-400 truncate">{order.user?.email}</p>
                                </div>
                                <p className="font-bold text-gray-800 shrink-0">৳{order.total?.toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2"><StatusBadge status={order.status} /></div>
                            <div className="pt-1"><RowActions order={order} /></div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                    <p className="text-sm text-gray-500 font-medium">
                        Showing <span className="text-gray-900">{orders.length}</span> of <span className="text-gray-900">{total}</span> orders
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onPageChange?.(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="p-2 border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <LuChevronLeft size={18} />
                        </button>
                        <div className="flex items-center gap-1">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => onPageChange?.(i + 1)}
                                    className={`w-8 h-8 rounded-md text-sm font-medium transition-all ${page === i + 1 ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                            className="p-2 border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <LuChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Bulk Action Bar */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-gray-100 px-6 py-3 flex items-center gap-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="flex items-center gap-2 border-r border-gray-200 pr-6">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold">
                            {selectedIds.size}
                        </span>
                        <span className="text-sm font-semibold text-gray-700 hidden sm:block">Selected</span>
                        <button onClick={() => setSelectedIds(new Set())} className="ml-2 p-1 text-gray-400 hover:text-gray-700 transition" title="Clear selection">
                            <LuX size={16} />
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        {onBulkPrintA4 && (
                            <button
                                onClick={() => onBulkPrintA4(Array.from(selectedIds))}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                <LuFileText size={16} className="text-[var(--color-primary)]" />
                                <span className="hidden sm:inline">A4 Invoice</span>
                            </button>
                        )}
                        {onBulkPrintThermal && (
                            <button
                                onClick={() => onBulkPrintThermal(Array.from(selectedIds))}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                <LuPrinter size={16} className="text-green-600" />
                                <span className="hidden sm:inline">Thermal Label</span>
                            </button>
                        )}
                        {onBulkDelete && (
                            <button
                                onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} orders?`)) {
                                        onBulkDelete(Array.from(selectedIds));
                                        setSelectedIds(new Set());
                                    }
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LuTrash2 size={16} />
                                <span className="hidden sm:inline">Delete</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrdersTable;
