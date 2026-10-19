"use client";

import React, { useEffect } from 'react';
import { LuX, LuTruck, LuUser, LuPhone, LuMapPin, LuBanknote } from 'react-icons/lu';
import { useGetAdminOrderByIdQuery } from '@/redux/api/orderApi';
import OrderProgressTracker from '@/components/orders/OrderProgressTracker';
import { getStatusConfig, paymentMethodLabel } from '@/lib/orderStatus';

/**
 * CourierTrackingModal — the read-only shipment view opened from the
 * Courier / Shipments board. It shows the same animated order-tracking
 * stepper the customer sees, driven live by the order's timeline +
 * courier status (the backend cron syncs Steadfast). No details page,
 * fully responsive.
 */
interface Props {
    orderId: string | null;
    onClose: () => void;
}

const CourierTrackingModal: React.FC<Props> = ({ orderId, onClose }) => {
    // Poll while open so a courier-side status change surfaces without a manual refresh.
    const { data, isLoading } = useGetAdminOrderByIdQuery(orderId, {
        skip: !orderId,
        pollingInterval: orderId ? 30000 : 0,
    });

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (orderId) document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [orderId, onClose]);

    if (!orderId) return null;

    const order: any = data?.data || null;
    const cfg = order ? getStatusConfig(order.status) : null;
    const ship = order?.shippingAddress || {};
    const customerName = `${order?.user?.firstName || ''} ${order?.user?.lastName || ''}`.trim() || ship.fullName || '—';
    const isCOD = (order?.paymentMethod || '').toLowerCase() === 'cod';
    const codAmount = isCOD ? order?.total : 0;
    const addr = [ship.address, ship.area, ship.city, ship.postalCode].filter(Boolean).join(', ');

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div className="relative bg-gray-50 w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-white border-b border-gray-100">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-9 h-9 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] shrink-0">
                            <LuTruck size={18} />
                        </span>
                        <div className="min-w-0">
                            <p className="font-bold text-gray-900 leading-tight truncate">
                                {order?.orderId || order?.orderNumber || 'Shipment'}
                            </p>
                            <p className="text-xs text-gray-400">Shipment tracking</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {cfg && (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
                                {cfg.label}
                            </span>
                        )}
                        <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100" title="Close">
                            <LuX size={18} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                    {isLoading || !order ? (
                        <div className="space-y-3 animate-pulse">
                            <div className="h-24 bg-gray-100 rounded-xl" />
                            <div className="h-40 bg-gray-100 rounded-2xl" />
                        </div>
                    ) : (
                        <>
                            {/* Customer / destination / COD */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Deliver to</p>
                                    <p className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                        <LuUser size={14} className="text-gray-400" /> {customerName}
                                    </p>
                                    <p className="flex items-center gap-2 text-sm text-gray-600">
                                        <LuPhone size={14} className="text-gray-400" /> {ship.phone || order?.user?.phone || '—'}
                                    </p>
                                    {addr && (
                                        <p className="flex items-start gap-2 text-xs text-gray-500">
                                            <LuMapPin size={14} className="text-gray-400 mt-0.5 shrink-0" /> {addr}
                                        </p>
                                    )}
                                </div>
                                <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Payment</p>
                                    <p className="text-sm font-semibold text-gray-800">{paymentMethodLabel(order?.paymentMethod)}</p>
                                    {isCOD ? (
                                        <p className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                                            <LuBanknote size={15} /> Collect ৳{(codAmount || 0).toLocaleString()}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-gray-500">Prepaid · ৳{(order?.total || 0).toLocaleString()}</p>
                                    )}
                                </div>
                            </div>

                            {/* Animated tracking stepper */}
                            <OrderProgressTracker
                                status={order.status}
                                timeline={order.timeline}
                                carrier={order.carrier}
                                trackingNumber={order.trackingNumber}
                                courierStatus={order.courierStatus}
                                createdAt={order.createdAt}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourierTrackingModal;
