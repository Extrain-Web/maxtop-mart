"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { LuShoppingCart, LuLink } from 'react-icons/lu';
import { useGetProductsQuery } from '@/redux/api/productApi';

/**
 * Featured Products — title + category tabs, then a card carousel that slides
 * one card at a time from right to left every few seconds (pauses on hover,
 * swipe on touch, dots for pages). Cards: image on a soft grey tile, brand,
 * name, price (or price range across variants), colour swatches and a
 * "Quick Shop" pill ("Read More" when there is no price).
 *
 * Data: products the admin marked "Featured" (Dashboard → Products). If none
 * are marked yet, the newest products are shown instead so the section is
 * never blank once the catalogue has items.
 */

const SLIDE_INTERVAL = 3500; // ms between steps
const SLIDE_MS = 600;        // slide animation duration
const FETCH_LIMIT = 24;
const MAX_SWATCHES = 5;

interface Variant {
    color?: string;
    colorHex?: string;
    price?: number;
}

interface Product {
    _id: string;
    slug: string;
    name: string;
    brand?: string;
    price: number;
    thumbnail?: string;
    images?: string[];
    variants?: Variant[];
    category?: { _id: string; name: string } | string | null;
}

interface Tab {
    id: string;
    name: string;
}

const money = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const categoryId = (p: Product) =>
    p.category && typeof p.category === 'object' ? String(p.category._id) : p.category ? String(p.category) : '';

/* Lowest and highest price across the product and its variants (zeros ignored). */
const priceRange = (p: Product) => {
    const prices = [p.price, ...(p.variants || []).map((v) => v.price ?? 0)].filter((n) => typeof n === 'number' && n > 0);
    if (prices.length === 0) return { min: 0, max: 0 };
    return { min: Math.min(...prices), max: Math.max(...prices) };
};

/* Distinct variant colours, as CSS colour values. */
const swatches = (p: Product) => {
    const seen = new Set<string>();
    for (const v of p.variants || []) {
        const c = (v.colorHex || v.color || '').trim();
        if (c) seen.add(c);
    }
    return [...seen].slice(0, MAX_SWATCHES);
};

/* ── Cards per view. CSS (basis-*) sizes the cards; JS only needs the same
   number for the slide step. useSyncExternalStore keeps it hydration-safe. ── */
const perViewNow = () => {
    const w = window.innerWidth;
    if (w >= 1280) return 5;
    if (w >= 1024) return 4;
    if (w >= 640) return 3;
    return 2;
};
const subscribeResize = (cb: () => void) => {
    window.addEventListener('resize', cb);
    return () => window.removeEventListener('resize', cb);
};
const usePerView = () => useSyncExternalStore(subscribeResize, perViewNow, () => 5);
const CARD_BASIS = 'basis-1/2 sm:basis-1/3 lg:basis-1/4 xl:basis-1/5 2xl:basis-1/6';

import NewProductCard from '@/components/shared/NewProductCard';

/* ═════════════════════════════ Carousel ═════════════════════════════ */

const Carousel: React.FC<{ items: Product[]; reduce: boolean }> = ({ items, reduce }) => {
    const perView = usePerView();
    const count = items.length;
    const loop = count > perView;

    const [index, setIndex] = useState(0);
    const [instant, setInstant] = useState(false); // jump without animation (loop reset)
    const [paused, setPaused] = useState(false);
    const [cycle, setCycle] = useState(0);         // restarts the timer after manual navigation

    // Clones of the first cards let the last card slide into a full row before the loop resets.
    const slides = useMemo(() => (loop ? [...items, ...items.slice(0, perView)] : items), [items, loop, perView]);
    const shown = Math.min(index, count);

    const stepForward = useCallback(() => {
        setInstant(false);
        setIndex((i) => Math.min(i + 1, count));
    }, [count]);

    const goTo = useCallback((i: number) => {
        setInstant(false);
        setIndex(Math.max(0, Math.min(i, count)));
        setCycle((c) => c + 1);
    }, [count]);

    // Autoplay — one card per tick, right to left. Off under reduced motion.
    useEffect(() => {
        if (!loop || paused || reduce) return;
        const timer = setInterval(stepForward, SLIDE_INTERVAL);
        return () => clearInterval(timer);
    }, [loop, paused, reduce, cycle, stepForward]);

    // When the clones are fully in view we are visually back at the start: snap there silently.
    const onAnimationComplete = () => {
        if (shown >= count && count > 0) {
            setInstant(true);
            setIndex(0);
        }
    };

    // Touch swipe.
    const touchX = useRef<number | null>(null);
    const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (!loop || Math.abs(dx) < 48) return;
        if (dx < 0) goTo(shown + 1);
        else if (shown > 0) goTo(shown - 1);
    };

    const pages = loop ? Math.ceil(count / perView) : 1;
    const activePage = Math.min(pages - 1, Math.floor((shown % Math.max(count, 1)) / perView));

    return (
        <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => { setPaused(false); setCycle((c) => c + 1); }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            aria-roledescription="carousel"
        >
            <div className="overflow-hidden">
                <motion.div
                    className="-mx-2 flex sm:-mx-3"
                    data-index={shown}
                    animate={{ x: `${-(shown * 100) / perView}%` }}
                    transition={instant || reduce ? { duration: 0 } : { duration: SLIDE_MS / 1000, ease: [0.22, 1, 0.36, 1] }}
                    onAnimationComplete={onAnimationComplete}
                >
                    {slides.map((product, i) => {
                        const clone = i >= count;
                        return (
                            <div
                                key={`${product._id}-${i}`}
                                className={`${CARD_BASIS} shrink-0 px-2 sm:px-3 py-2`}
                                aria-hidden={clone || undefined}
                            >
                                <NewProductCard 
                                    product={{
                                        id: product._id,
                                        name: product.name,
                                        slug: product.slug,
                                        image: product.thumbnail || product.images?.[0] || '',
                                        price: product.price,
                                        variants: product.variants,
                                        categoryName: typeof product.category === 'object' && product.category ? product.category.name : undefined
                                    }} 
                                />
                            </div>
                        );
                    })}
                </motion.div>
            </div>

            {pages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2.5" role="tablist" aria-label="Product pages">
                    {Array.from({ length: pages }, (_, p) => (
                        <button
                            key={p}
                            type="button"
                            role="tab"
                            aria-selected={p === activePage}
                            aria-label={`Page ${p + 1}`}
                            onClick={() => goTo(p * perView)}
                            className={`h-2 rounded-full transition-all duration-300 ${p === activePage ? 'w-2 bg-gray-900' : 'w-2 bg-gray-300 hover:bg-gray-400'}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

/* ═════════════════════════════ Section ═════════════════════════════ */

const FeaturedProducts: React.FC = () => {
    const reduce = !!useReducedMotion();

    const featuredQuery = useGetProductsQuery({ isFeatured: true, limit: FETCH_LIMIT, sort: '-createdAt' });
    const featured = useMemo(() => (featuredQuery.data?.data || []) as Product[], [featuredQuery.data]);
    const needFallback = !featuredQuery.isLoading && !featuredQuery.isFetching && featured.length === 0;
    const latestQuery = useGetProductsQuery({ limit: FETCH_LIMIT, sort: '-createdAt' }, { skip: !needFallback });
    const latest = useMemo(() => (latestQuery.data?.data || []) as Product[], [latestQuery.data]);

    const products = featured.length > 0 ? featured : latest;
    const loading = featuredQuery.isLoading || (needFallback && (latestQuery.isLoading || latestQuery.isUninitialized));

    // Tabs come from the categories of the products on show, so no tab is ever empty.
    const tabs = useMemo<Tab[]>(() => {
        const seen = new Map<string, string>();
        for (const p of products) {
            const id = categoryId(p);
            const name = p.category && typeof p.category === 'object' ? p.category.name : '';
            if (id && name && !seen.has(id)) seen.set(id, name);
        }
        return [{ id: 'all', name: 'Show All' }, ...[...seen].map(([id, name]) => ({ id, name }))];
    }, [products]);

    const [selectedTab, setSelectedTab] = useState('all');
    const activeTab = tabs.some((t) => t.id === selectedTab) ? selectedTab : 'all';
    const visible = activeTab === 'all' ? products : products.filter((p) => categoryId(p) === activeTab);

    return (
        <section className="bg-white" aria-label="Featured products">
            <div className="container mx-auto px-4 py-10 sm:py-14">
                {/* Title + category tabs */}
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h2 className="font-heading text-[22px] font-extrabold tracking-tight text-gray-900 sm:text-[28px]">
                            Featured Products
                        </h2>
                        <span className="mt-2 block h-[2px] w-36 bg-gray-900" aria-hidden />
                    </div>

                    {tabs.length > 1 && (
                        <div className="no-scrollbar -mb-px flex gap-6 overflow-x-auto border-b border-gray-200 lg:gap-7" role="tablist" aria-label="Filter by category">
                            {tabs.map((t) => {
                                const on = t.id === activeTab;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={on}
                                        onClick={() => setSelectedTab(t.id)}
                                        className={`relative shrink-0 pb-3 text-[13px] font-medium uppercase tracking-wide transition-colors ${
                                            on ? 'text-primary' : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                    >
                                        {t.name}
                                        {on && <span className="absolute inset-x-0 -bottom-px h-[2px] bg-primary" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="mt-8 sm:mt-10">
                    {loading ? (
                        <div className="-mx-2 flex sm:-mx-3" aria-hidden>
                            {Array.from({ length: 5 }, (_, i) => (
                                <div key={i} className={`${CARD_BASIS} shrink-0 px-2 sm:px-3`}>
                                    <div className="aspect-square animate-pulse rounded-sm bg-gray-100" />
                                    <div className="mt-4 h-3 w-1/3 animate-pulse rounded bg-gray-100" />
                                    <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                                </div>
                            ))}
                        </div>
                    ) : visible.length === 0 ? (
                        <p className="py-10 text-center text-sm text-gray-400">
                            No products yet — add products and mark them &quot;Featured&quot; in Admin → Products.
                        </p>
                    ) : (
                        <Carousel key={`${activeTab}:${visible.length}`} items={visible} reduce={reduce} />
                    )}
                </div>
            </div>
        </section>
    );
};

export default FeaturedProducts;
