"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    LuShieldCheck, LuLock, LuCreditCard, LuPackageCheck,
    LuBell, LuChevronRight, LuStar,
} from 'react-icons/lu';

/* Temu-style palette */
const GREEN = '#0a8a00';
const ORANGE = '#fb7701';
const RED = '#e02424';

/* "Why choose" trust options — rotated one-at-a-time on mobile */
const WHY_OPTIONS: { Icon: React.ComponentType<{ size?: number }>; label: string }[] = [
    { Icon: LuLock, label: 'Secure privacy' },
    { Icon: LuCreditCard, label: 'Safe payments' },
    { Icon: LuPackageCheck, label: 'Delivery guarantee' },
];

interface Deal {
    img: string;
    price: string;        // numeric string, e.g. "16.43"
    was?: string;         // strikethrough "Was: X"
    compareAt?: string;   // strikethrough "Compare at: X"
    rating?: number;      // 0–5
    reviews?: number;
    href?: string;
}

const LIGHTNING_DEALS: Deal[] = [
    { img: 'https://img.kwcdn.com/product/fancy/1e34518b-1de8-40e4-9a3e-b5083b00a1ff.jpg?imageView2/2/w/500/q/70/format/avif', price: '1,840' },
    { img: 'https://img.kwcdn.com/product/fancy/1e34518b-1de8-40e4-9a3e-b5083b00a1ff.jpg?imageView2/2/w/500/q/70/format/avif', price: '420' },
    { img: 'https://img.kwcdn.com/product/open/fb4853672c5541e4b48e489fb8fc8a98-goods.jpeg?imageView2/2/w/250/q/10/format/avif', price: '550' },
];

const UNBEATABLE_DEALS: Deal[] = [
    { img: 'https://img.kwcdn.com/product/fancy/f1abbd5e-bbdc-4c8f-80de-1de91d0a831d.jpg?imageView2/2/w/500/q/70/format/avif', price: '150', was: '180', rating: 4.5, reviews: 76 },
    { img: 'https://img.kwcdn.com/product/open/4b3d4d87f6564a85be59a33966bb7b7f-goods.jpeg?imageView2/2/w/500/q/70/format/avif', price: '1,560' },
    { img: 'https://img.kwcdn.com/product/fancy/41d286fb-50b7-421a-b46a-5239ae7c1494.jpg?imageView2/2/w/500/q/70/format/avif', price: '850', compareAt: '980', rating: 5, reviews: 5 },
];

const Stars: React.FC<{ rating: number; reviews?: number }> = ({ rating, reviews }) => (
    <div className="mt-0.5 flex items-center gap-1">
        <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, i) => (
                <LuStar
                    key={i}
                    size={12}
                    className={i < Math.round(rating) ? 'text-gray-800 fill-gray-800' : 'text-gray-300 fill-gray-300'}
                />
            ))}
        </div>
        {typeof reviews === 'number' && <span className="text-[11px] text-gray-500">{reviews}</span>}
    </div>
);

const DealCard: React.FC<{ deal: Deal; color: string }> = ({ deal, color }) => (
    <Link href={deal.href || '/products'} className="group block">
        <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={deal.img}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
        </div>
        <div className="mt-1.5">
            <p className="font-bold leading-none" style={{ color }}>
                <span className="text-[13px] align-top">৳</span>
                <span className="text-[18px]">{deal.price}</span>
            </p>
            {deal.was && (
                <p className="mt-1 text-[11px] text-gray-500">
                    Was: <span className="line-through">৳{deal.was}</span>
                </p>
            )}
            {deal.compareAt && (
                <p className="mt-1 text-[11px] text-gray-500">
                    Compare at: <span className="line-through">৳{deal.compareAt}</span>
                </p>
            )}
            {typeof deal.rating === 'number' && <Stars rating={deal.rating} reviews={deal.reviews} />}
        </div>
    </Link>
);

const DealColumn: React.FC<{ title: string; color: string; deals: Deal[]; href: string }> = ({ title, color, deals, href }) => (
    <div>
        <Link href={href} className="mb-3 flex items-center justify-between">
            <h2 className="text-[22px] font-extrabold uppercase tracking-tight" style={{ color }}>{title}</h2>
            <LuChevronRight size={22} strokeWidth={2.5} className="text-gray-700" />
        </Link>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {deals.map((deal, i) => <DealCard key={i} deal={deal} color={color} />)}
        </div>
    </div>
);

/**
 * DealsShowcase — Temu-style promo block that replaces the hero banner.
 * A green trust bar, a security-reminder strip, and two deal columns
 * (Lightning Deals / Unbeatable Deals).
 */
const DealsShowcase: React.FC = () => {
    // Mobile: cycle through the trust options one at a time.
    const [whyIdx, setWhyIdx] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setWhyIdx((i) => (i + 1) % WHY_OPTIONS.length), 2500);
        return () => clearInterval(id);
    }, []);
    const active = WHY_OPTIONS[whyIdx];

    return (
        <section className="container mx-auto px-3 sm:px-4 pt-3 sm:pt-4" aria-label="Deals">
            {/* ── Green trust bar ── */}
            <div
                className="flex items-center justify-between gap-3 rounded-lg px-4 py-2.5 text-white"
                style={{ background: GREEN }}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <LuShieldCheck size={20} strokeWidth={2} className="shrink-0" />
                    <span className="text-[14px] sm:text-[15px] font-semibold">Why choose Maxtop Mart?</span>
                </div>

                {/* Desktop: all three options */}
                <div className="hidden sm:flex flex-wrap items-center justify-end gap-x-5 gap-y-1 text-[13.5px]">
                    <span className="flex items-center gap-1.5"><LuLock size={16} /> Secure privacy</span>
                    <span className="h-4 w-px bg-white/40" />
                    <span className="flex items-center gap-1.5"><LuCreditCard size={16} /> Safe payments</span>
                    <span className="h-4 w-px bg-white/40" />
                    <span className="flex items-center gap-1.5">
                        <LuPackageCheck size={16} /> Delivery guarantee <LuChevronRight size={14} />
                    </span>
                </div>

                {/* Mobile: one rotating option, right-aligned */}
                <div className="flex sm:hidden flex-1 justify-end overflow-hidden h-5">
                    <span
                        key={whyIdx}
                        className="flex items-center gap-1.5 whitespace-nowrap text-[12.5px] font-medium"
                        style={{ animation: 'whyTickerIn 0.45s ease' }}
                    >
                        <active.Icon size={14} /> {active.label} <LuChevronRight size={12} />
                    </span>
                </div>
            </div>
            <style>{`@keyframes whyTickerIn{from{transform:translateY(-120%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

            {/* ── Security reminder strip ── */}
            <div className="mt-2.5 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5">
                <p className="flex items-center gap-2 text-[13px] text-gray-700">
                    <LuBell size={16} className="shrink-0 text-gray-500" />
                    <span>
                        <span className="font-semibold">Security reminder:</span> Please be wary of scam messages and links. Maxtop Mart won&apos;t ask for extra fees via SMS or email.
                    </span>
                </p>
                <Link href="/privacy" className="flex shrink-0 items-center gap-0.5 text-[13px] font-medium text-gray-600 hover:text-gray-900">
                    View <LuChevronRight size={14} />
                </Link>
            </div>

            {/* ── Deal columns ── */}
            <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
                <DealColumn title="Lightning Deals" color={ORANGE} deals={LIGHTNING_DEALS} href="/products?sort=-discount" />
                <DealColumn title="Unbeatable Deals" color={RED} deals={UNBEATABLE_DEALS} href="/products?sort=price" />
            </div>
        </section>
    );
};

export default DealsShowcase;
