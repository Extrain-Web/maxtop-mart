"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import SmartImage from '@/components/shared/SmartImage';

const SLIDE_INTERVAL = 5000; // ms each banner stays on screen
const SLIDE_MS = 700;        // slide animation duration

/**
 * Default banners, served from /public/images. They show until the admin
 * uploads hero slides (Dashboard → Site Content → Hero Slides), which then
 * take over. Recommended size: 1800 × 600 (3:1).
 */
const DEFAULT_BANNERS = ['/images/banner-03.webp', '/images/banner-01.webp', '/images/banner-02.webp'];

type HeroSlide = { imageUrl: string; active?: boolean; order?: number };

/**
 * Hero — full-width, image-only banner slider.
 *
 * Slides horizontally every few seconds (pauses while hovered), with
 * always-visible transparent round arrows, brand-coloured dots at the bottom-left, touch
 * swipe and keyboard arrows. Honors prefers-reduced-motion (no autoplay,
 * instant switch).
 */
const HeroSection: React.FC = () => {
    const { data, isLoading } = useGetSiteContentQuery({});
    const reduce = !!useReducedMotion();

    const images = useMemo(() => {
        const admin = ((data?.data?.heroSlides || []) as HeroSlide[])
            .filter((s) => s?.imageUrl && s.active !== false)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((s) => s.imageUrl);
        if (admin.length > 0) return admin;
        // Nothing uploaded yet (or the request failed) → the bundled banners.
        return isLoading ? [] : DEFAULT_BANNERS;
    }, [data, isLoading]);

    // Hold the space with a neutral placeholder while site content loads, so the
    // page doesn't jump and no banner flashes before the real list is known.
    if (isLoading) {
        return (
            <section className="w-full" aria-label="Featured banners">
                <div className="w-full animate-pulse bg-slate-100" style={{ aspectRatio: '3' }} />
            </section>
        );
    }
    if (images.length === 0) return null;

    // Keyed on the image list so the slider state resets whenever the banners change.
    return <Slider key={images.join('|')} images={images} reduce={reduce} />;
};

interface SliderProps {
    images: string[];
    reduce: boolean;
}

const Slider: React.FC<SliderProps> = ({ images, reduce }) => {
    const count = images.length;
    const multiple = count > 1;
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    const [cycle, setCycle] = useState(0); // restarts the timer / progress after manual navigation

    // A fixed, responsive stage ratio (no per-image remeasure) keeps the hero at a
    // stable height from the first paint — previously the container resized when the
    // first banner finished loading, which made the slider visibly "shake" in.

    const goTo = useCallback((i: number) => {
        setActive(((i % count) + count) % count);
        setCycle((c) => c + 1);
    }, [count]);

    // Autoplay — pauses on hover, off entirely under reduced motion.
    useEffect(() => {
        if (!multiple || paused || reduce) return;
        const timer = setInterval(() => setActive((a) => (a + 1) % count), SLIDE_INTERVAL);
        return () => clearInterval(timer);
    }, [multiple, paused, reduce, count, cycle]);

    // Touch swipe.
    const touchX = useRef<number | null>(null);
    const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (multiple && Math.abs(dx) > 48) goTo(active + (dx < 0 ? 1 : -1));
        touchX.current = null;
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (!multiple) return;
        if (e.key === 'ArrowLeft') goTo(active - 1);
        else if (e.key === 'ArrowRight') goTo(active + 1);
    };

    // Transparent circle; white icon + ring with a difference blend, so they stay
    // visible over light and dark banners alike.
    const arrow = 'absolute top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-transparent text-white ring-1 ring-white/70 mix-blend-difference transition hover:bg-white/20 sm:h-11 sm:w-11';

    return (
        <section
            className="relative w-full overflow-hidden bg-slate-100"
            aria-label="Featured banners"
            aria-roledescription="carousel"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => { setPaused(false); setCycle((c) => c + 1); }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onKeyDown={onKeyDown}
        >
            <div className="relative w-full aspect-[16/9] sm:aspect-[3/1]">

                {/* ── Sliding track ── */}
                <motion.div
                    className="flex h-full w-full"
                    style={{ willChange: 'transform' }}
                    animate={{ x: `${-active * 100}%` }}
                    transition={reduce ? { duration: 0 } : { duration: SLIDE_MS / 1000, ease: [0.22, 1, 0.36, 1] }}
                >
                    {images.map((src, i) => (
                        <div key={`${src}-${i}`} className="relative h-full w-full shrink-0" aria-hidden={i !== active}>
                                <SmartImage
                                    src={src}
                                    alt=""
                                    fill
                                    sizes="100vw"
                                    priority={i === 0}
                                    draggable={false}
                                    className="object-cover pointer-events-none"
                                />
                        </div>
                    ))}
                </motion.div>

                {/* ── Arrows ── */}
                {multiple && (
                    <>
                        <button type="button" onClick={() => goTo(active - 1)} aria-label="Previous banner" className={`${arrow} left-3 sm:left-6`}>
                            <LuChevronLeft size={20} strokeWidth={2.2} />
                        </button>
                        <button type="button" onClick={() => goTo(active + 1)} aria-label="Next banner" className={`${arrow} right-3 sm:right-6`}>
                            <LuChevronRight size={20} strokeWidth={2.2} />
                        </button>
                    </>
                )}

                {/* ── Dots (bottom-left) — the active one fills up as the timer runs ── */}
                {multiple && (
                    <div className="absolute bottom-3 left-4 z-20 flex items-center gap-2 sm:bottom-5 sm:left-10">
                        {images.map((_, i) => {
                            const isOn = i === active;
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => goTo(i)}
                                    aria-label={`Go to banner ${i + 1}`}
                                    aria-current={isOn ? 'true' : undefined}
                                    className={`relative h-2 overflow-hidden rounded-full ring-1 ring-white/70 transition-all duration-300 ${
                                        isOn ? 'w-8 bg-primary/30' : 'w-2 bg-primary/45 hover:bg-primary/75'
                                    }`}
                                >
                                    {isOn && (
                                        <AnimatePresence>
                                            <motion.span
                                                key={`${active}-${cycle}-${paused}`}
                                                className="absolute inset-y-0 left-0 rounded-full bg-primary"
                                                initial={{ width: '0%' }}
                                                animate={{ width: paused || reduce ? '100%' : ['0%', '100%'] }}
                                                transition={paused || reduce ? { duration: 0.3 } : { duration: SLIDE_INTERVAL / 1000, ease: 'linear' }}
                                            />
                                        </AnimatePresence>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
};

export default HeroSection;
