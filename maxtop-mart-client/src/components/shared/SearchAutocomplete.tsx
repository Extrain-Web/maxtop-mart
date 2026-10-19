"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LuSearch, LuX } from 'react-icons/lu';
import { useSuggestProductsQuery } from '@/redux/api/productApi';
import SmartImage from '@/components/shared/SmartImage';



/* ─────────────────────────── suggestion shapes ─────────────────────────── */
interface SuggestProduct {
    _id: string;
    name: string;
    slug: string;
    thumbnail?: string;
    price?: number;
    discount?: number;
}
interface SuggestCategory {
    _id: string;
    name: string;
    slug: string;
}

interface SearchAutocompleteProps {
    /** Shared search text (controlled by Header so both inputs stay in sync). */
    value: string;
    onChange: (v: string) => void;
    /** Submit the full-text search to the listing page. */
    onSubmit: (term: string) => void;
    /** Visual variant — desktop pill is taller, mobile is compact. */
    variant?: 'desktop' | 'mobile';
    placeholder?: string;
    /** Slot rendered before the input (e.g. desktop category selector). */
    leading?: React.ReactNode;
    /** Focus the input on mount (used by the header search panel). */
    autoFocus?: boolean;
}

const DEBOUNCE_MS = 300;

const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
    value,
    onChange,
    onSubmit,
    variant = 'desktop',
    placeholder = 'Search products, brands, categories…',
    leading,
    autoFocus = false,
}) => {
    const router = useRouter();
    const pathname = usePathname();

    const [open, setOpen] = useState(false);
    const [debounced, setDebounced] = useState('');
    const rootRef = useRef<HTMLDivElement>(null);

    const isMobile = variant === 'mobile';


    /* debounce the query term ~300ms */
    useEffect(() => {
        const term = value.trim();
        const t = setTimeout(() => setDebounced(term), DEBOUNCE_MS);
        return () => clearTimeout(t);
    }, [value]);

    const trimmed = value.trim();
    const skip = debounced.length === 0;

    const { data, isFetching } = useSuggestProductsQuery(
        { q: debounced, limit: 8 },
        { skip },
    );

    const products: SuggestProduct[] = data?.data?.products ?? [];
    const categories: SuggestCategory[] = data?.data?.categories ?? [];
    const hasResults = products.length > 0 || categories.length > 0;

    /* close on outside click */
    useEffect(() => {
        const onDown = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, []);

    /* close on route change */
    useEffect(() => {
        setOpen(false);
    }, [pathname]);



    const submit = (term: string) => {
        setOpen(false);
        onSubmit(term);
    };

    const goToProduct = (slug: string) => {
        setOpen(false);
        router.push(`/product/${slug}`);
    };

    const goToCategory = (id: string) => {
        setOpen(false);
        router.push(`/products?category=${id}`);
    };



    const fmtPrice = (p?: number) =>
        typeof p === 'number' ? `৳${p.toLocaleString()}` : '';

    /* ───────────────────────────── render ───────────────────────────── */
    return (
        <div ref={rootRef} className="relative w-full">
            <div
                className={`flex items-center w-full overflow-hidden bg-white transition-shadow duration-200 focus-within:shadow-[0_0_0_3px_var(--color-primary-glow)] ${
                    isMobile ? 'h-[44px] rounded-full' : 'h-[48px] rounded-full'
                }`}
                style={{ border: '2px solid var(--color-primary)' }}
            >
                {leading}

                {/* Leading search icon */}
                <LuSearch
                    size={isMobile ? 16 : 18}
                    className={`shrink-0 text-gray-400 ${isMobile ? 'ml-3.5' : 'ml-3.5'}`}
                    strokeWidth={2}
                />

                {/* Text input */}
                <input
                    type="text"
                    value={value}
                    onChange={(e) => { onChange(e.target.value); setOpen(true); }}
                    onFocus={() => { if (trimmed) setOpen(true); }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') submit(value);
                        else if (e.key === 'Escape') setOpen(false);
                    }}
                    placeholder={placeholder}
                    className={`flex-1 h-full text-gray-700 placeholder-gray-400 focus:outline-none text-sm bg-transparent ${
                        isMobile ? 'px-2.5' : 'px-3'
                    }`}
                    aria-label="Search"
                    autoComplete="off"
                    autoFocus={autoFocus}
                />



                {/* Search button */}
                <button
                    type="button"
                    onClick={() => submit(value)}
                    className={`shrink-0 rounded-full text-white font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:opacity-75 ${
                        isMobile ? 'px-4 h-[36px] mr-1 text-sm' : 'px-6 h-[40px] mr-1 text-sm'
                    }`}
                    style={{ background: 'var(--color-primary)' }}
                    aria-label="Search"
                >
                    <LuSearch size={16} strokeWidth={2.2} />
                    {!isMobile && <span className="hidden lg:inline">Search</span>}
                </button>
            </div>

            {/* ─────────────── Autocomplete dropdown ─────────────── */}
            {open && trimmed.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl shadow-gray-900/15 border border-gray-100 z-[60] overflow-hidden max-h-[70vh] overflow-y-auto">
                    {/* Loading */}
                    {isFetching && !hasResults && (
                        <div className="px-4 py-6 text-center text-[13px] text-gray-400">
                            Searching…
                        </div>
                    )}

                    {/* No results */}
                    {!isFetching && !hasResults && (
                        <div className="px-4 py-6 text-center text-[13px] text-gray-400">
                            No matches for “{trimmed}”
                        </div>
                    )}

                    {/* Category matches */}
                    {categories.length > 0 && (
                        <div className="py-1.5">
                            <p className="px-4 pt-1 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400">
                                Categories
                            </p>
                            {categories.map((cat) => (
                                <button
                                    key={cat._id}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => goToCategory(cat._id)}
                                    className="w-full flex items-center gap-2.5 text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-[var(--color-primary-lightest)] hover:text-[var(--color-primary)] transition-colors"
                                >
                                    <LuSearch size={13} className="shrink-0 text-gray-400" />
                                    <span className="truncate">{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Product matches */}
                    {products.length > 0 && (
                        <div className={`py-1.5 ${categories.length > 0 ? 'border-t border-gray-100' : ''}`}>
                            <p className="px-4 pt-1 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-gray-400">
                                Products
                            </p>
                            {products.map((p) => (
                                <button
                                    key={p._id}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => goToProduct(p.slug)}
                                    className="w-full flex items-center gap-3 text-left px-4 py-2 hover:bg-[var(--color-primary-lightest)] transition-colors group"
                                >
                                    <span className="relative shrink-0 w-10 h-10 rounded-md overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
                                        {p.thumbnail ? (
                                            <SmartImage src={p.thumbnail} alt="" fill sizes="40px" className="object-cover" />
                                        ) : (
                                            <LuSearch size={14} className="text-gray-300" />
                                        )}
                                    </span>
                                    <span className="flex-1 min-w-0">
                                        <span className="block text-[13px] text-gray-700 truncate group-hover:text-[var(--color-primary)] transition-colors">
                                            {p.name}
                                        </span>
                                        {typeof p.price === 'number' && (
                                            <span className="block text-[12.5px] font-semibold" style={{ color: 'var(--color-primary)' }}>
                                                {fmtPrice(p.price)}
                                            </span>
                                        )}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Footer: full search */}
                    {hasResults && (
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => submit(value)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[12.5px] font-semibold border-t border-gray-100 hover:bg-[var(--color-primary-lightest)] transition-colors"
                            style={{ color: 'var(--color-primary)' }}
                        >
                            <LuSearch size={13} strokeWidth={2.2} />
                            See all results for “{trimmed}”
                        </button>
                    )}
                </div>
            )}


        </div>
    );
};

export default SearchAutocomplete;
