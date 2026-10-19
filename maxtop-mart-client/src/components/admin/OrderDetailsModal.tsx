"use client";

import React, { useEffect, useMemo, useState } from 'react';
import SmartImage from '@/components/shared/SmartImage';
import { createPortal } from 'react-dom';
import { LuX, LuDownload, LuPrinter, LuLoader, LuMapPin, LuUser, LuPhone, LuMail, LuCheck } from 'react-icons/lu';
import { toast } from 'react-hot-toast';
import {
    useGetAdminOrderByIdQuery,
    useUpdateOrderStatusMutation,
    useUpdatePaymentStatusMutation,
} from '@/redux/api/orderApi';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import { getStatusConfig, paymentMethodLabel } from '@/lib/orderStatus';
import { downloadInvoicePdf, printInvoicePdf, downloadThermalLabelPdf } from '@/lib/downloadInvoice';
import { resolveImageUrl } from '@/components/shared/SmartImage';
import Logo from '@/components/shared/Logo';

/* eslint-disable @typescript-eslint/no-explicit-any */

const STATUS_OPTIONS = [
    'pending', 'confirmed', 'processing', 'shipped', 'on_the_way',
    'out_for_delivery', 'delivery_attempt', 'delivered', 'cancelled', 'returned', 'refunded',
];
const PAYMENT_STATUS_OPTIONS = ['pending', 'paid', 'failed', 'refunded'];

const money = (n?: number) => `৳${(n || 0).toLocaleString()}`;
const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

interface Props {
    orderId: string | null;
    onClose: () => void;
    /** Called after a status/payment change so the list can refetch. */
    onChanged?: () => void;
}

const OrderDetailsModal: React.FC<Props> = ({ orderId, onClose, onChanged }) => {
    const open = !!orderId;
    const { data, isFetching } = useGetAdminOrderByIdQuery(orderId, { skip: !orderId });
    const order = data?.data;

    const { data: siteContentRes } = useGetSiteContentQuery({});
    const dynamicLogo = siteContentRes?.data?.theme?.logoUrl;

    const [updateStatus, { isLoading: savingStatus }] = useUpdateOrderStatusMutation();
    const [updatePayment, { isLoading: savingPayment }] = useUpdatePaymentStatusMutation();

    const [status, setStatus] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [downloadingLabel, setDownloadingLabel] = useState(false);
    const [printing, setPrinting] = useState(false);

    // Sync the dropdowns to the loaded order.
    useEffect(() => {
        if (order) {
            setStatus(order.status || '');
            setPaymentStatus(order.paymentStatus || '');
        }
    }, [order]);

    // Lock body scroll + Escape to close.
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
    }, [open, onClose]);

    const orderNo = order?.orderId || order?.orderNumber || '';

    const saveStatus = async () => {
        if (!order || status === order.status) return;
        try {
            await updateStatus({ id: order._id, status }).unwrap();
            toast.success('Order status updated');
            onChanged?.();
        } catch (e: any) { toast.error(e?.data?.message || 'Could not update status'); }
    };
    const savePayment = async () => {
        if (!order || paymentStatus === order.paymentStatus) return;
        try {
            await updatePayment({ id: order._id, paymentStatus }).unwrap();
            toast.success('Payment status updated');
            onChanged?.();
        } catch (e: any) { toast.error(e?.data?.message || 'Could not update payment'); }
    };
    const doPrint = async () => {
        if (!order) return;
        setPrinting(true);
        try { await printInvoicePdf(order._id); } catch (e: any) { toast.error(e?.message || 'Could not open invoice'); }
        finally { setPrinting(false); }
    };

    const doDownloadLabel = async () => {
        if (!order) return;
        setDownloadingLabel(true);
        try { await downloadThermalLabelPdf(order._id); toast.success('Thermal Label downloading...'); } 
        catch (e: any) { toast.error(e?.message || 'Thermal label download failed'); }
        finally { setDownloadingLabel(false); }
    };

    const handleQuickConfirm = async () => {
        if (!order || status === 'confirmed') return;
        try {
            await updateStatus({ id: order._id, status: 'confirmed' }).unwrap();
            toast.success('Order confirmed');
            setStatus('confirmed');
            onChanged?.();
            onClose();
        } catch (e: any) { toast.error(e?.data?.message || 'Could not confirm order'); }
    };

    const handleQuickCancel = async () => {
        if (!order || status === 'cancelled') return;
        try {
            await updateStatus({ id: order._id, status: 'cancelled' }).unwrap();
            toast.success('Order cancelled');
            setStatus('cancelled');
            onChanged?.();
            onClose();
        } catch (e: any) { toast.error(e?.data?.message || 'Could not cancel order'); }
    };

    const addr = order?.shippingAddress || {};
    const items: any[] = order?.items || [];

    const totals = useMemo(() => ([
        { label: 'Subtotal', value: money(order?.subtotal) },
        ...(order?.discount > 0 ? [{ label: 'Discount', value: `- ${money(order?.discount)}`, accent: true }] : []),
        { label: order?.shippingCost > 0 ? 'Shipping' : 'Shipping (Free)', value: order?.shippingCost > 0 ? money(order?.shippingCost) : 'Free' },
    ]), [order]);

    if (!open || typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[10001] flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:p-6" onMouseDown={onClose}>
            <div
                className="my-2 w-full max-w-3xl rounded-xl bg-white shadow-2xl"
                onMouseDown={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="relative flex flex-col items-center justify-center gap-1.5 rounded-t-xl px-5 py-5 text-white" style={{ background: 'var(--gradient-brand)' }}>
                    {dynamicLogo ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={resolveImageUrl(dynamicLogo)} alt="Logo" className="h-[48px] object-contain drop-shadow-sm" />
                    ) : (
                        <Logo imgClassName="h-[48px]" />
                    )}
                    <p className="truncate text-sm font-semibold tracking-wide text-white/90">{orderNo || (isFetching ? 'Loading…' : '—')}</p>
                    <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/10 text-white/90 backdrop-blur-sm transition hover:bg-black/20 hover:text-white">
                        <LuX size={18} />
                    </button>
                </div>

                {isFetching && !order ? (
                    <div className="flex items-center justify-center py-20 text-gray-400"><LuLoader className="animate-spin" size={26} /></div>
                ) : !order ? (
                    <div className="py-20 text-center text-gray-500">Order not found.</div>
                ) : (
                    <>
                        <div className="max-h-[68vh] space-y-5 overflow-y-auto px-5 py-5 custom-scrollbar">
                            {/* Status + date + controls */}
                            <div className="flex flex-wrap items-center gap-3">
                                {(() => { const sc = getStatusConfig(order.status); return (
                                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${sc.badgeBg} ${sc.badgeText}`}>{sc.label}</span>
                                ); })()}
                                <span className="text-xs text-gray-400">Placed {formatDate(order.createdAt)}</span>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {/* Order status display */}
                                <div className="rounded-lg border border-gray-200 p-3">
                                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">Order status</label>
                                    <div className="flex gap-2">
                                        <div className="min-w-0 flex-1 rounded-md border border-gray-200 px-2.5 py-2 text-sm bg-gray-50 text-gray-700 capitalize">
                                            {getStatusConfig(order.status).label}
                                        </div>
                                    </div>
                                </div>
                                {/* Payment status & method display */}
                                <div className="rounded-lg border border-gray-200 p-3">
                                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">Payment</label>
                                    <div className="flex gap-2">
                                        <div className="min-w-0 flex-1 rounded-md border border-gray-200 px-2.5 py-2 text-sm bg-gray-50 text-gray-700">
                                            <span className="font-semibold capitalize">{paymentMethodLabel(order.paymentMethod) === 'Cash on Delivery' ? 'COD' : paymentMethodLabel(order.paymentMethod)}</span> 
                                            <span className="text-gray-400 mx-1">•</span> 
                                            <span className="capitalize">{order.paymentStatus || 'pending'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Customer + shipping */}
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-lg border border-gray-200 p-3.5">
                                    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400"><LuUser size={13} /> Customer</p>
                                    <p className="text-sm font-semibold text-gray-800">{order.user?.firstName} {order.user?.lastName} {addr.fullName && !order.user?.firstName ? addr.fullName : ''}</p>
                                    {(order.user?.email || addr.email) && <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500"><LuMail size={12} /> {order.user?.email || addr.email}</p>}
                                    {(addr.phone || order.user?.phone) && <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500"><LuPhone size={12} /> {addr.phone || order.user?.phone}</p>}
                                </div>
                                <div className="rounded-lg border border-gray-200 p-3.5">
                                    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400"><LuMapPin size={13} /> Shipping address</p>
                                    <p className="text-sm font-semibold text-gray-800">{addr.fullName || '—'}</p>
                                    <p className="mt-1 text-xs leading-relaxed text-gray-500">
                                        {[addr.address, addr.area, addr.city, addr.postalCode].filter(Boolean).join(', ') || 'No address on file'}
                                    </p>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="overflow-hidden rounded-lg border border-gray-200">
                                <div className="border-b border-gray-100 bg-gray-50 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Items ({items.length})</div>
                                <div className="divide-y divide-gray-100">
                                    {items.map((it, i) => (
                                        <div key={i} className="flex items-center gap-3 px-3.5 py-2.5">
                                            {it.thumbnail ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <SmartImage src={it.thumbnail} alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-md border border-gray-100 object-cover" />
                                            ) : <div className="h-11 w-11 shrink-0 rounded-md bg-gray-100" />}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-gray-800">{it.name}</p>
                                                <p className="text-xs text-gray-400">{[it.color, it.size].filter(Boolean).join(' / ')}{(it.color || it.size) ? ' · ' : ''}{money(it.price)} × {it.quantity}</p>
                                            </div>
                                            <p className="shrink-0 text-sm font-bold text-gray-800">{money(it.total)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
                                {totals.map((t) => (
                                    <div key={t.label} className="flex justify-between">
                                        <span className="text-gray-500">{t.label}</span>
                                        <span className={(t as any).accent ? 'font-semibold text-emerald-600' : 'font-semibold text-gray-800'}>{t.value}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between border-t border-gray-200 pt-2 text-base">
                                    <span className="font-bold text-gray-900">Total</span>
                                    <span className="font-bold text-primary">{money(order.total)}</span>
                                </div>
                            </div>

                            {(order.note || order.adminNote) && (
                                <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                                    {order.note && <p><span className="font-semibold text-gray-700">Customer note:</span> {order.note}</p>}
                                    {order.adminNote && <p className="mt-1"><span className="font-semibold text-gray-700">Admin note:</span> {order.adminNote}</p>}
                                </div>
                            )}
                        </div>

                        {/* Footer — actions based on status */}
                        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-end gap-3 rounded-b-xl border-t border-gray-100 bg-gray-50 px-5 py-4">
                            {status === 'pending' ? (
                                <div className="flex w-full items-center justify-end gap-2">
                                    <button 
                                        type="button" 
                                        onClick={handleQuickCancel} 
                                        disabled={savingStatus} 
                                        className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                                    >
                                        <LuX size={16} /> Cancel
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={handleQuickConfirm} 
                                        disabled={savingStatus} 
                                        className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                        <LuCheck size={16} /> Confirm
                                    </button>
                                </div>
                            ) : (
                                <div className="flex w-full items-center justify-end gap-2">
                                    <button type="button" onClick={doPrint} disabled={printing} className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary disabled:opacity-50">
                                        {printing ? <LuLoader className="animate-spin" size={15} /> : <LuPrinter size={15} />} Print A4 Invoice
                                    </button>
                                    <button type="button" onClick={doDownloadLabel} disabled={downloadingLabel} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50">
                                        {downloadingLabel ? <LuLoader className="animate-spin" size={15} /> : <LuDownload size={15} />} Thermal Label
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>,
        document.body,
    );
};

export default OrderDetailsModal;
