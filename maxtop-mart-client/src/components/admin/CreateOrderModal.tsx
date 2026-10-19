"use client";

import React, { useEffect, useMemo, useState } from 'react';
import SmartImage from '@/components/shared/SmartImage';
import { createPortal } from 'react-dom';
import { LuX, LuSearch, LuPlus, LuMinus, LuTrash2, LuLoader, LuUserPlus } from 'react-icons/lu';
import { toast } from 'react-hot-toast';
import { useSuggestProductsQuery } from '@/redux/api/productApi';
import { useGuestCheckoutMutation } from '@/redux/api/orderApi';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Line { _id: string; name: string; thumbnail?: string; price: number; qty: number; }

const PAYMENT_METHODS = [
    { value: 'cod', label: 'Cash on Delivery' },
    { value: 'bkash', label: 'bKash' },
    { value: 'nagad', label: 'Nagad' },
    { value: 'rocket', label: 'Rocket' },
    { value: 'sslcommerz', label: 'Card / SSLCommerz' },
];

const money = (n: number) => `৳${(n || 0).toLocaleString()}`;

interface Props {
    open: boolean;
    onClose: () => void;
    /** Called after an order is created so the list can refetch. */
    onCreated?: () => void;
}

const CreateOrderModal: React.FC<Props> = ({ open, onClose, onCreated }) => {
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [area, setArea] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [note, setNote] = useState('');
    const [lines, setLines] = useState<Line[]>([]);

    const [term, setTerm] = useState('');
    const [debounced, setDebounced] = useState('');
    const [createOrder, { isLoading: submitting }] = useGuestCheckoutMutation();

    useEffect(() => {
        const t = setTimeout(() => setDebounced(term.trim()), 300);
        return () => clearTimeout(t);
    }, [term]);

    const { data: sugg, isFetching: searching } = useSuggestProductsQuery(
        { q: debounced, limit: 8 },
        { skip: debounced.length < 1 },
    );
    const results: any[] = sugg?.data?.products || sugg?.products || [];

    // Reset everything each time the modal is opened, and lock body scroll.
    useEffect(() => {
        if (!open) return;
        setFullName(''); setPhone(''); setEmail(''); setAddress(''); setCity(''); setArea('');
        setPostalCode(''); setPaymentMethod('cod'); setNote(''); setLines([]); setTerm(''); setDebounced('');
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
    }, [open, onClose]);

    const addLine = (p: any) => {
        setLines((prev) => {
            const found = prev.find((l) => l._id === p._id);
            if (found) return prev.map((l) => (l._id === p._id ? { ...l, qty: l.qty + 1 } : l));
            return [...prev, { _id: p._id, name: p.name, thumbnail: p.thumbnail, price: p.price || 0, qty: 1 }];
        });
        setTerm(''); setDebounced('');
    };
    const setQty = (id: string, qty: number) => setLines((prev) => prev.map((l) => (l._id === id ? { ...l, qty: Math.max(1, qty) } : l)));
    const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l._id !== id));

    const subtotal = useMemo(() => lines.reduce((s, l) => s + l.price * l.qty, 0), [lines]);

    const submit = async () => {
        if (!fullName.trim()) return toast.error('Customer name is required');
        if (!phone.trim()) return toast.error('Phone number is required');
        if (!address.trim()) return toast.error('Address is required');
        if (lines.length === 0) return toast.error('Add at least one product');

        const payload = {
            items: lines.map((l) => ({ product: l._id, quantity: l.qty })),
            shippingAddress: {
                fullName: fullName.trim(),
                phone: phone.trim(),
                email: email.trim() || undefined,
                address: address.trim(),
                area: area.trim() || undefined,
                city: city.trim() || undefined,
                postalCode: postalCode.trim() || undefined,
            },
            paymentMethod,
            note: note.trim() || undefined,
            status: 'confirmed', // Admin orders are instantly confirmed
        };
        try {
            const res: any = await createOrder(payload).unwrap();

            const isNew = res?.data?.isNewUser ?? res?.isNewUser;
            toast.success(
                isNew
                    ? 'Order placed & confirmed. Customer account created — their phone number is the password.'
                    : 'Order placed & confirmed for the existing customer.',
                { duration: 5000 },
            );
            onCreated?.();
            onClose();
        } catch (e: any) {
            const msg = e?.data?.errorMessages?.[0]?.message || e?.data?.message || 'Could not create the order';
            toast.error(msg);
        }
    };

    if (!open || typeof document === 'undefined') return null;

    const field = 'w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary';

    return createPortal(
        <div className="fixed inset-0 z-[10001] flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:p-6" onMouseDown={onClose}>
            <div className="my-2 w-full max-w-2xl rounded-xl bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 rounded-t-xl px-5 py-4 text-white" style={{ background: 'var(--gradient-brand)' }}>
                    <div className="flex items-center gap-2">
                        <LuUserPlus size={18} />
                        <p className="text-lg font-bold">Create Order</p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15 hover:text-white">
                        <LuX size={20} />
                    </button>
                </div>

                <div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 py-5">
                    {/* Customer */}
                    <div>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Customer</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <input className={field} placeholder="Full name *" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                            <input className={field} placeholder="Phone number *" value={phone} onChange={(e) => setPhone(e.target.value)} />
                            <input className={`${field} sm:col-span-2`} placeholder="Email (optional — used as login)" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <p className="mt-1.5 text-[11px] text-gray-400">A customer account is created automatically. Login email = the email above (or a phone-based one), password = their phone number.</p>
                    </div>

                    {/* Address */}
                    <div>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Shipping address</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <input className={`${field} sm:col-span-2`} placeholder="Address *" value={address} onChange={(e) => setAddress(e.target.value)} />
                            <input className={field} placeholder="Area" value={area} onChange={(e) => setArea(e.target.value)} />
                            <input className={field} placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                            <input className={field} placeholder="Postal code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                        </div>
                    </div>

                    {/* Products */}
                    <div>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Products</p>
                        <div className="relative">
                            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input className={`${field} pl-9`} placeholder="Search products to add…" value={term} onChange={(e) => setTerm(e.target.value)} />
                            {debounced.length >= 1 && (
                                <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                                    {searching ? (
                                        <div className="flex items-center justify-center py-4 text-gray-400"><LuLoader className="animate-spin" size={18} /></div>
                                    ) : results.length === 0 ? (
                                        <p className="px-3 py-3 text-sm text-gray-400">No products found</p>
                                    ) : results.map((p) => (
                                        <button key={p._id} type="button" onClick={() => addLine(p)} className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-primary-lightest">
                                            {p.thumbnail ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <SmartImage src={p.thumbnail} alt="" width={32} height={32} className="h-8 w-8 rounded border border-gray-100 object-cover" />
                                            ) : <div className="h-8 w-8 rounded bg-gray-100" />}
                                            <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{p.name}</span>
                                            <span className="shrink-0 text-xs font-semibold text-gray-500">{money(p.price || 0)}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Selected lines */}
                        {lines.length > 0 && (
                            <div className="mt-3 divide-y divide-gray-100 rounded-md border border-gray-200">
                                {lines.map((l) => (
                                    <div key={l._id} className="flex items-center gap-3 px-3 py-2.5">
                                        {l.thumbnail ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <SmartImage src={l.thumbnail} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-md border border-gray-100 object-cover" />
                                        ) : <div className="h-10 w-10 shrink-0 rounded-md bg-gray-100" />}
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-gray-800">{l.name}</p>
                                            <p className="text-xs text-gray-400">{money(l.price)} each</p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1.5">
                                            <button type="button" onClick={() => setQty(l._id, l.qty - 1)} className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"><LuMinus size={13} /></button>
                                            <input value={l.qty} onChange={(e) => setQty(l._id, parseInt(e.target.value) || 1)} className="h-7 w-11 rounded-md border border-gray-200 text-center text-sm outline-none focus:border-primary" />
                                            <button type="button" onClick={() => setQty(l._id, l.qty + 1)} className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"><LuPlus size={13} /></button>
                                        </div>
                                        <p className="w-20 shrink-0 text-right text-sm font-bold text-gray-800">{money(l.price * l.qty)}</p>
                                        <button type="button" onClick={() => removeLine(l._id)} className="shrink-0 text-gray-300 hover:text-red-500"><LuTrash2 size={15} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Payment + note */}
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Payment method</p>
                            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={field}>
                                {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Note (optional)</p>
                            <input className={field} placeholder="Internal / delivery note" value={note} onChange={(e) => setNote(e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-xl border-t border-gray-100 bg-gray-50 px-5 py-3.5">
                    <p className="text-sm text-gray-500">Est. subtotal: <span className="font-bold text-gray-800">{money(subtotal)}</span> <span className="text-xs text-gray-400">(final total calculated on the server)</span></p>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={onClose} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">Cancel</button>
                        <button type="button" onClick={submit} disabled={submitting} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50">
                            {submitting ? <LuLoader className="animate-spin" size={15} /> : <LuPlus size={15} />} Create Order
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default CreateOrderModal;
