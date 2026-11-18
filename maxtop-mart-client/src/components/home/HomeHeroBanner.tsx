"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
    LuChevronLeft, LuChevronRight, LuTruck, LuTicketPercent, LuSmartphone,
    LuBadgeCheck, LuTags, LuSparkles,
} from 'react-icons/lu';
import type { IconType } from 'react-icons';
import Logo from '@/components/shared/Logo';

// Maxtop Mart's own banner artwork (public/images). No third-party hosted images.
const BIG_BANNERS = [
    { id: 1, url: '/images/banner-06.webp', alt: 'Maxtop Mart Global Brands Sale — up to 80% off', href: '/products' },
    { id: 2, url: '/images/banner-05.webp', alt: 'Maxtop Mall — discount up to 40% and extra 15% voucher', href: '/products?sort=-totalSold' },
    { id: 3, url: '/images/banner-04.webp', alt: 'Maxtop Mart PayLater — 0% interest instalments', href: '/products?sort=-createdAt' },
];

const FEATURE_CARDS: { id: string; title: string; subtitle: string; icon: IconType; href: string; color: string; bg: string }[] = [
    { id: 'authentic', title: 'Maxtop Mall', subtitle: '100% Authentic Brands', icon: LuBadgeCheck, href: '/products?brand=authentic', color: '#2A4CD4', bg: '#E6EBFC' },
    { id: 'free_shipping', title: 'Free Shipping', subtitle: 'Free & Fast Delivery', icon: LuTruck, href: '/products?freeShipping=true', color: '#00a982', bg: '#E3F7F1' },
    { id: 'brands', title: 'Top Brands', subtitle: 'Explore Brands on Maxtop', icon: LuTags, href: '/products', color: '#ff5e00', bg: '#FFF0E6' },
    { id: 'services', title: 'Our Services', subtitle: 'Ship for me, quotes & more', icon: LuSparkles, href: '/services', color: '#8a2be2', bg: '#F3E8FD' },
];

const SLIDE_INTERVAL = 4500;

export default function HomeHeroBanner() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const touchStartX = useRef<number | null>(null);
    const count = BIG_BANNERS.length;

    const nextSlide = useCallback(() => setCurrentSlide((p) => (p + 1) % count), [count]);
    const prevSlide = useCallback(() => setCurrentSlide((p) => (p - 1 + count) % count), [count]);

    useEffect(() => {
        if (isPaused) return;
        const timer = setInterval(nextSlide, SLIDE_INTERVAL);
        return () => clearInterval(timer);
    }, [isPaused, nextSlide]);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(deltaX) > 40) (deltaX < 0 ? nextSlide : prevSlide)();
        touchStartX.current = null;
    };

    return (
        <section className="w-full bg-[#f5f5f5] pt-0 pb-3 sm:pb-5">
            <div className="container mx-auto px-0 sm:px-4 max-w-[1360px]">
                <div className="flex flex-col lg:flex-row items-stretch gap-0 sm:gap-4">
                    {/* ── Banner slider ── */}
                    <div
                        className="relative flex-1 w-full overflow-hidden rounded-none sm:rounded-2xl shadow-sm bg-gray-200 group"
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div className="flex w-full transition-transform duration-500 ease-out h-full" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                            {BIG_BANNERS.map((banner, index) => (
                                <Link key={banner.id} href={banner.href} className="relative w-full shrink-0 block aspect-[1976/688]">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={banner.url}
                                        alt={banner.alt}
                                        loading={index === 0 ? 'eager' : 'lazy'}
                                        className="w-full h-full object-cover select-none pointer-events-none"
                                    />
                                </Link>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); prevSlide(); }}
                            aria-label="Previous slide"
                            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-xs flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 sm:opacity-80 z-10"
                        >
                            <LuChevronLeft size={22} strokeWidth={2.5} />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); nextSlide(); }}
                            aria-label="Next slide"
                            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-xs flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 sm:opacity-80 z-10"
                        >
                            <LuChevronRight size={22} strokeWidth={2.5} />
                        </button>

                        <div className="absolute bottom-2.5 sm:bottom-4 inset-x-0 flex items-center justify-center gap-1.5 sm:gap-2 z-10">
                            {BIG_BANNERS.map((_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setCurrentSlide(i)}
                                    aria-label={`Go to slide ${i + 1}`}
                                    className={`transition-all duration-300 rounded-full ${
                                        i === currentSlide ? 'w-6 sm:w-8 h-1.5 sm:h-2 bg-white shadow-md' : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/50 hover:bg-white/80'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* ── App card (desktop) ── */}
                    <div className="hidden lg:flex flex-col w-[260px] xl:w-[280px] shrink-0 bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-3 justify-between">
                        <div className="flex items-center justify-between gap-2 px-1 pt-0.5">
                            <Logo imgClassName="h-[30px]" />
                            <span className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--color-primary)] bg-[var(--color-primary-lightest)] px-2 py-0.5 rounded-full">
                                App
                            </span>
                        </div>

                        <div className="relative overflow-hidden rounded-xl my-2 p-3 bg-gradient-to-br from-[#2A4CD4] via-[#4338CA] to-[#7C3AED] text-white shadow-inner">
                            <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-md pointer-events-none" />
                            <h4 className="text-[13px] font-extrabold leading-tight text-white">Get the Maxtop Mart App to Enjoy</h4>
                            <div className="mt-2.5 space-y-1.5">
                                <div className="flex items-center gap-2 bg-white/15 rounded-lg px-2.5 py-1.5 border border-white/10">
                                    <div className="w-6 h-6 rounded-full bg-[#00c9a7] flex items-center justify-center shrink-0">
                                        <LuTruck size={13} strokeWidth={2.4} />
                                    </div>
                                    <span className="text-[11.5px] font-bold">Free Shipping</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/15 rounded-lg px-2.5 py-1.5 border border-white/10">
                                    <div className="w-6 h-6 rounded-full bg-[#F59E0B] flex items-center justify-center shrink-0">
                                        <LuTicketPercent size={13} strokeWidth={2.4} />
                                    </div>
                                    <span className="text-[11.5px] font-bold">Exclusive Vouchers</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-1 space-y-1.5">
                            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 text-gray-800">
                                <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 170 170" aria-hidden>
                                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.85-11.96-14.42-6-9.16-10.74-19.64-14.21-31.46-3.48-11.81-5.22-22.95-5.22-33.4 0-14.54 3.8-26.68 11.41-36.42 7.6-9.75 17.1-14.73 28.49-14.96 4.36 0 9.28 1.15 14.75 3.44 5.48 2.29 9.38 3.55 11.72 3.79 1.9.11 5.92-1.26 12.06-4.13 6.13-2.87 11.28-4.14 15.44-3.8 11.49.8 20.67 5.16 27.53 13.1-10.04 6.08-14.96 14.53-14.74 25.35.22 8.37 3.51 15.42 9.87 21.13 6.36 5.71 13.88 9 22.56 9.88-2.12 6.47-4.68 12.94-7.69 19.41zM119.22 31.84c0-7.36 2.68-14.07 8.04-20.12C132.62 5.67 139.32 1.65 147.36 0c.22 1.34.34 2.57.34 3.68 0 7.25-2.79 14.07-8.38 20.44-5.58 6.37-12.43 10.15-20.1 11.33v-3.61z" />
                                </svg>
                                <span className="text-[10.5px] font-bold">App Store</span>
                                <span className="ml-auto text-[9px] font-semibold text-gray-400">Coming soon</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 text-gray-800">
                                <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 512 512" aria-hidden>
                                    <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
                                </svg>
                                <span className="text-[10.5px] font-bold">Google Play</span>
                                <span className="ml-auto text-[9px] font-semibold text-gray-400">Coming soon</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Mobile app strip ── */}
                <div className="lg:hidden mt-2.5 px-2 sm:px-0">
                    <div className="rounded-xl p-2.5 bg-gradient-to-r from-[#2A4CD4] via-[#4338CA] to-[#7C3AED] text-white shadow-sm flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                            <LuSmartphone size={18} />
                        </div>
                        <div className="min-w-0 leading-tight">
                            <p className="text-xs font-black truncate">Maxtop Mart App — coming soon</p>
                            <p className="text-[10.5px] text-white/90 truncate mt-0.5">Free Shipping • Exclusive Vouchers</p>
                        </div>
                    </div>
                </div>

                {/* ── Feature cards ── */}
                <div className="px-2 sm:px-0">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mt-3 sm:mt-4">
                        {FEATURE_CARDS.map((card) => {
                            const Icon = card.icon;
                            return (
                                <Link
                                    key={card.id}
                                    href={card.href}
                                    className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-gray-100 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between gap-2 group"
                                    style={{ ["--card-color" as string]: card.color } as React.CSSProperties}
                                >
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-extrabold text-[13.5px] sm:text-[16px] text-gray-900 group-hover:text-[var(--card-color)] truncate transition-colors">
                                            {card.title}
                                        </h3>
                                        <p className="text-[10px] sm:text-[12px] text-gray-500 font-medium mt-0.5 sm:mt-1 truncate">{card.subtitle}</p>
                                    </div>
                                    <div
                                        className="w-11 h-11 sm:w-14 sm:h-14 shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300"
                                        style={{ backgroundColor: card.bg, color: card.color }}
                                    >
                                        <Icon className="w-5 h-5 sm:w-7 sm:h-7" strokeWidth={2.2} />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
