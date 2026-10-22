"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
    LuChevronLeft, LuChevronRight, LuTruck,
    LuTicketPercent, LuStar, LuSparkles, LuSmartphone,
} from 'react-icons/lu';

const BIG_BANNERS = [
    {
        id: 1,
        url: 'https://img.lazcdn.com/us/domino/0a726355-b0ed-468d-98c3-52fec47921f6_MY-1976-688.jpg_2200x2200q80.jpg_.webp',
        alt: 'Oh Murah Giler Deals',
        href: '/products?sort=-totalSold',
    },
    {
        id: 2,
        url: 'https://img.lazcdn.com/g/tps/imgextra/i3/O1CN0132XgJKdAb6B40k80_!!6000000004832-0-tps-1976-688.jpg_2200x2200q80.jpg_.webp',
        alt: 'Super Mega Brand Deals',
        href: '/products',
    },
    {
        id: 3,
        url: 'https://img.lazcdn.com/g/tps/imgextra/i4/O1CN01xRuJdkWU0MH40k80_!!6000000001554-0-tps-1976-688.jpg_2200x2200q80.jpg_.webp',
        alt: 'Exclusive Online Discounts',
        href: '/products?sort=-createdAt',
    },
];

const FEATURE_CARDS = [
    {
        id: 'lazmall',
        title: 'LazMall',
        titlePrefix: 'LM',
        subtitle: '100% Authentic Brands',
        image: 'https://img.lazcdn.com/us/domino/f948d33a-7b9f-450c-9880-da8bf1dc9bf7_MY-276-260.png_300x300q80.png_.webp',
        href: '/products?brand=authentic',
        accentColor: '#e00034',
    },
    {
        id: 'free_shipping',
        title: 'Free Shipping',
        subtitle: 'Free & Fast Delivery',
        image: 'https://img.lazcdn.com/us/domino/e3cfad01-539d-4bae-b56d-994641706bf3_MY-276-260.png_300x300q80.png_.webp',
        href: '/products?freeShipping=true',
        accentColor: '#00a982',
    },
    {
        id: 'brand_wiki',
        title: 'Brand Wiki',
        titlePrefix: '|',
        subtitle: 'Explore Brands on Maxtop',
        image: 'https://img.lazcdn.com/us/domino/acc2d279-f510-4e06-b503-3da14a24ce74_MY-276-260.png_300x300q80.png_.webp',
        href: '/products',
        accentColor: '#ff5e00',
    },
    {
        id: 'laz_blog',
        title: 'Laz Blog',
        subtitle: 'Discover Your Next Favorite',
        image: 'https://img.lazcdn.com/us/domino/d62142eb-3076-4562-877b-254aa36dd722_MY-276-260.png_300x300q80.png_.webp',
        href: '/services',
        accentColor: '#8a2be2',
    },
];

const SLIDE_INTERVAL = 4500;

export default function LazadaHeroBanner() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const touchStartX = useRef<number | null>(null);

    const count = BIG_BANNERS.length;

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % count);
    }, [count]);

    const prevSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev - 1 + count) % count);
    }, [count]);

    const goToSlide = (idx: number) => {
        setCurrentSlide(idx);
    };

    // Autoplay
    useEffect(() => {
        if (isPaused) return;
        const timer = setInterval(nextSlide, SLIDE_INTERVAL);
        return () => clearInterval(timer);
    }, [isPaused, nextSlide]);

    // Touch Swipe Handlers for mobile
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(deltaX) > 40) {
            if (deltaX < 0) nextSlide();
            else prevSlide();
        }
        touchStartX.current = null;
    };

    return (
        <section className="w-full bg-[#f5f5f5] py-3 sm:py-4">
            <div className="container mx-auto px-2 sm:px-4 max-w-[1360px]">

                {/* ════════════ TOP SECTION: BIG BANNER (LEFT) + APP DOWNLOAD CARD (RIGHT) ════════════ */}
                <div className="flex flex-col lg:flex-row items-stretch gap-3 sm:gap-4">

                    {/* ── Left Big Banner Slider ── */}
                    <div
                        className="relative flex-1 w-full overflow-hidden rounded-xl sm:rounded-2xl shadow-sm bg-gray-200 group"
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        {/* Slide Track */}
                        <div
                            className="flex w-full transition-transform duration-500 ease-out h-full"
                            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                        >
                            {BIG_BANNERS.map((banner, index) => (
                                <Link
                                    key={banner.id}
                                    href={banner.href}
                                    className="relative w-full shrink-0 block aspect-[1976/688]"
                                >
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

                        {/* Navigation Arrows */}
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

                        {/* Dots Indicators (Matching Lazada style dots) */}
                        <div className="absolute bottom-2.5 sm:bottom-4 inset-x-0 flex items-center justify-center gap-1.5 sm:gap-2 z-10 pointer-events-auto">
                            {BIG_BANNERS.map((_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => goToSlide(i)}
                                    aria-label={`Go to slide ${i + 1}`}
                                    className={`transition-all duration-300 rounded-full ${
                                        i === currentSlide
                                            ? 'w-6 sm:w-8 h-1.5 sm:h-2 bg-white shadow-md'
                                            : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/50 hover:bg-white/80'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* ── Right: App Download Card (Desktop) ── */}
                    <div className="hidden lg:flex flex-col w-[260px] xl:w-[280px] shrink-0 bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-3 justify-between">

                        {/* Top Header */}
                        <div className="flex items-center gap-2 px-1 pt-0.5">
                            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-[#ff1493] to-[#ff6b00] flex items-center justify-center text-white text-[10px] font-black shadow-xs">
                                Laz
                            </div>
                            <span className="text-[12px] font-extrabold uppercase tracking-wide text-gray-800">
                                TRY LAZADA APP
                            </span>
                        </div>

                        {/* Center Box: Vibrant Gradient with Stars & Features */}
                        <div className="relative overflow-hidden rounded-xl my-2 p-3 bg-gradient-to-br from-[#ff6b00] via-[#ff2a6d] to-[#d80075] text-white shadow-inner flex flex-col justify-between">
                            {/* Decorative background glow */}
                            <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-md pointer-events-none" />

                            <div>
                                {/* Rating Badge */}
                                <div className="inline-flex items-center gap-1 bg-black/20 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10.5px] font-bold text-amber-300">
                                    <LuStar size={12} className="fill-amber-300" /> 4.8 Rated
                                </div>

                                <h4 className="text-[13px] font-extrabold leading-tight mt-1.5 text-white drop-shadow-xs">
                                    Get the Lazada App to Enjoy
                                </h4>
                            </div>

                            {/* Features list */}
                            <div className="mt-2.5 space-y-1.5">
                                {/* Feature 1: Free Shipping */}
                                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-xs rounded-lg px-2.5 py-1.5 border border-white/10">
                                    <div className="w-6 h-6 rounded-full bg-[#00c9a7] flex items-center justify-center shrink-0 text-white shadow-xs">
                                        <LuTruck size={13} strokeWidth={2.4} />
                                    </div>
                                    <span className="text-[11.5px] font-bold tracking-tight text-white">
                                        Free Shipping
                                    </span>
                                </div>

                                {/* Feature 2: Exclusive Vouchers */}
                                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-xs rounded-lg px-2.5 py-1.5 border border-white/10">
                                    <div className="w-6 h-6 rounded-full bg-[#ff3366] flex items-center justify-center shrink-0 text-white shadow-xs">
                                        <LuTicketPercent size={13} strokeWidth={2.4} />
                                    </div>
                                    <span className="text-[11.5px] font-bold tracking-tight text-white">
                                        Exclusive Vouchers
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom: QR Code + App Store & Google Play */}
                        <div className="pt-1">
                            <div className="flex items-center gap-2.5">
                                {/* QR Code Image / SVG */}
                                <div className="w-[68px] h-[68px] shrink-0 rounded-lg border border-gray-200 bg-white p-1 flex items-center justify-center shadow-2xs">
                                    <svg viewBox="0 0 100 100" className="w-full h-full" fill="currentColor">
                                        {/* Stylized QR Code matrix */}
                                        <rect x="0" y="0" width="30" height="30" rx="3" fill="#111" />
                                        <rect x="5" y="5" width="20" height="20" rx="1" fill="#fff" />
                                        <rect x="10" y="10" width="10" height="10" fill="#111" />

                                        <rect x="70" y="0" width="30" height="30" rx="3" fill="#111" />
                                        <rect x="75" y="5" width="20" height="20" rx="1" fill="#fff" />
                                        <rect x="80" y="10" width="10" height="10" fill="#111" />

                                        <rect x="0" y="70" width="30" height="30" rx="3" fill="#111" />
                                        <rect x="5" y="75" width="20" height="20" rx="1" fill="#fff" />
                                        <rect x="10" y="80" width="10" height="10" fill="#111" />

                                        {/* Center dots & pattern */}
                                        <rect x="40" y="10" width="8" height="8" fill="#111" />
                                        <rect x="52" y="15" width="8" height="8" fill="#111" />
                                        <rect x="36" y="28" width="8" height="8" fill="#111" />
                                        <rect x="48" y="38" width="14" height="14" rx="2" fill="#ff1493" />
                                        <rect x="70" y="45" width="8" height="8" fill="#111" />
                                        <rect x="85" y="55" width="8" height="8" fill="#111" />
                                        <rect x="40" y="60" width="8" height="8" fill="#111" />
                                        <rect x="55" y="70" width="8" height="8" fill="#111" />
                                        <rect x="40" y="82" width="10" height="10" fill="#111" />
                                        <rect x="75" y="80" width="8" height="8" fill="#111" />
                                    </svg>
                                </div>

                                {/* Download Badges */}
                                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-md px-2 py-1 text-gray-800 transition-colors">
                                        <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 170 170">
                                            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.85-11.96-14.42-6-9.16-10.74-19.64-14.21-31.46-3.48-11.81-5.22-22.95-5.22-33.4 0-14.54 3.8-26.68 11.41-36.42 7.6-9.75 17.1-14.73 28.49-14.96 4.36 0 9.28 1.15 14.75 3.44 5.48 2.29 9.38 3.55 11.72 3.79 1.9.11 5.92-1.26 12.06-4.13 6.13-2.87 11.28-4.14 15.44-3.8 11.49.8 20.67 5.16 27.53 13.1-10.04 6.08-14.96 14.53-14.74 25.35.22 8.37 3.51 15.42 9.87 21.13 6.36 5.71 13.88 9 22.56 9.88-2.12 6.47-4.68 12.94-7.69 19.41zM119.22 31.84c0-7.36 2.68-14.07 8.04-20.12C132.62 5.67 139.32 1.65 147.36 0c.22 1.34.34 2.57.34 3.68 0 7.25-2.79 14.07-8.38 20.44-5.58 6.37-12.43 10.15-20.1 11.33v-3.61z" />
                                        </svg>
                                        <div className="leading-none min-w-0">
                                            <span className="block text-[8px] text-gray-500">Download on</span>
                                            <span className="block text-[9.5px] font-bold text-gray-900 truncate">App Store</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-md px-2 py-1 text-gray-800 transition-colors">
                                        <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 512 512">
                                            <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
                                        </svg>
                                        <div className="leading-none min-w-0">
                                            <span className="block text-[8px] text-gray-500">GET IT ON</span>
                                            <span className="block text-[9.5px] font-bold text-gray-900 truncate">Google Play</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-[9.5px] text-gray-400 text-center mt-1.5 leading-tight">
                                Download the app now by scanning the QR code
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Mobile Compact Promo Banner (Mobile only: < lg) ── */}
                <div className="lg:hidden mt-2.5">
                    <div className="relative overflow-hidden rounded-xl p-2.5 bg-gradient-to-r from-[#ff6b00] via-[#ff2a6d] to-[#d80075] text-white shadow-sm flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                                <LuSmartphone size={18} className="text-white" />
                            </div>
                            <div className="min-w-0 leading-tight">
                                <p className="text-xs font-black truncate">Get the Lazada App</p>
                                <p className="text-[10.5px] text-white/90 truncate flex items-center gap-1.5 mt-0.5">
                                    <span>Free Shipping</span> • <span>Exclusive Vouchers</span>
                                </p>
                            </div>
                        </div>
                        <a
                            href="#app-download"
                            className="shrink-0 bg-white text-[#d80075] text-[11px] font-black px-3 py-1.5 rounded-full shadow-xs active:scale-95 transition-transform"
                        >
                            Open App
                        </a>
                    </div>
                </div>

                {/* ════════════ BOTTOM SECTION: 4 LAZADA FEATURE CARDS ════════════ */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mt-3 sm:mt-4">
                    {FEATURE_CARDS.map((card) => (
                        <Link
                            key={card.id}
                            href={card.href}
                            className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-gray-100 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between gap-2 group cursor-pointer"
                        >
                            {/* Left Text */}
                            <div className="min-w-0 flex-1">
                                {card.id === 'lazmall' ? (
                                    <div className="flex items-center gap-1">
                                        <span className="text-[#e00034] font-black text-sm sm:text-[17px] tracking-tight">
                                            LM
                                        </span>
                                        <span className="font-extrabold text-[13.5px] sm:text-[16px] text-gray-900 group-hover:text-[#e00034] transition-colors truncate">
                                            {card.title}
                                        </span>
                                    </div>
                                ) : card.id === 'brand_wiki' ? (
                                    <div className="flex items-center">
                                        <span className="text-[#ff5e00] font-black mr-1 text-sm sm:text-base">|</span>
                                        <span className="font-extrabold text-[13.5px] sm:text-[16px] text-gray-900 group-hover:text-[#ff5e00] transition-colors truncate">
                                            Brand <span className="text-[#e00034]">Wiki</span>
                                        </span>
                                    </div>
                                ) : card.id === 'laz_blog' ? (
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gradient-to-tr from-purple-600 via-pink-500 to-rose-500 inline-block shrink-0 shadow-2xs" />
                                        <span className="font-extrabold text-[13.5px] sm:text-[16px] text-gray-900 group-hover:text-purple-600 transition-colors truncate">
                                            Lazada <span className="text-[#e00077]">Blog</span>
                                        </span>
                                    </div>
                                ) : (
                                    <h3 className="font-extrabold text-[13.5px] sm:text-[16px] text-gray-900 group-hover:text-[#00a982] transition-colors truncate">
                                        {card.title}
                                    </h3>
                                )}

                                <p className="text-[10px] sm:text-[12px] text-gray-500 font-medium mt-0.5 sm:mt-1 truncate">
                                    {card.subtitle}
                                </p>
                            </div>

                            {/* Right Image */}
                            <div className="w-11 h-11 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={card.image}
                                    alt={card.title}
                                    loading="lazy"
                                    className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-300"
                                />
                            </div>
                        </Link>
                    ))}
                </div>

            </div>
        </section>
    );
}
