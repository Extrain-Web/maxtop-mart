"use client";

import React from 'react';
import Link from 'next/link';
import { LuChevronLeft, LuChevronRight, LuX } from 'react-icons/lu';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import SmartImage from '@/components/shared/SmartImage';
import { useGetCategoriesQuery } from '@/redux/api/categoryApi';
import Marquee from 'react-fast-marquee';

interface FeaturedCategory {
    imageUrl: string;
    name: string;
    categoryId?: string;
    active?: boolean;
    order?: number;
}

interface CategoryExpertiseProps {
    onClose?: () => void;
}

/**
 * Featured Categories strip — fully admin-managed.
 *
 * The cards come from SiteContent.featuredCategories (managed in the admin
 * dashboard: upload an image, set a name, pick the category it links to).
 * No emoji fallback: only what the admin has added is shown.
 */
const CategoryExpertise: React.FC<CategoryExpertiseProps> = ({ onClose }) => {
    const { data: siteContentRes, isLoading } = useGetSiteContentQuery({});
    const { data: catRes } = useGetCategoriesQuery({});
    const categories: any[] = catRes?.data || [];

    const items: FeaturedCategory[] = ((siteContentRes?.data?.featuredCategories || []) as FeaturedCategory[])
        .filter((f) => f.active !== false && f.imageUrl)
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const hrefFor = (f: FeaturedCategory) => (f.categoryId ? `/products?category=${f.categoryId}` : '/products');

    // Loading: hold the strip's space with neutral tiles — never stand-in content.
    if (isLoading) {
        return (
            <section className="w-full bg-white border-b border-gray-100">
                <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5">
                    <div className="h-5 w-40 rounded bg-gray-100 animate-pulse mb-4" />
                    <div className="flex gap-2 sm:gap-4 justify-start overflow-hidden">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex-shrink-0 flex flex-col items-center justify-center p-3 sm:p-4 w-[150px] md:w-[calc(20%-13px)] bg-white border border-gray-100 shadow-sm rounded-xl">
                                <div className="w-[120px] h-[120px] sm:w-[180px] sm:h-[180px] mb-2 sm:mb-3 bg-gray-100 animate-pulse rounded-md" />
                                <div className="h-3 sm:h-4 w-16 sm:w-20 rounded bg-gray-100 animate-pulse mb-1.5" />
                                <div className="h-2 sm:h-2.5 w-12 sm:w-16 rounded bg-gray-100 animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }
    // Nothing configured yet — render no strip at all.
    if (items.length === 0) return null;

    return (
        <section id="home-categories" className="w-full scroll-mt-24 bg-white border-b border-gray-100">
            <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5">

                {/* Header row */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <span
                            className="w-[3px] h-5 rounded-full"
                            style={{ background: 'var(--color-primary)' }}
                        />
                        <h2 className="font-heading text-xl sm:text-2xl lg:text-[28px] font-bold text-gray-800 tracking-tight">
                            Featured Categories
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/products"
                            className="text-xs font-semibold hover:underline"
                            style={{ color: 'var(--color-primary)' }}
                        >
                            View All →
                        </Link>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="ml-1 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <LuX size={13} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Scroll area */}
                <div className="relative mt-2">
                    <Marquee 
                        pauseOnHover 
                        speed={30}
                        gradient={false}
                        className="py-2"
                    >
                        <div className="flex gap-2 sm:gap-4 justify-start">
                            {items.map((f, i) => {
                                const cat = categories.find((c) => c._id === f.categoryId);
                                const count = cat?.productCount || 0;
                                return (
                                    <div key={`${f.name}-${i}`} className="mx-1 sm:mx-2">
                                        <Link
                                            href={hrefFor(f)}
                                            className="flex-shrink-0 flex flex-col items-center justify-center p-3 sm:p-4 group w-[150px] md:w-[220px] bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                                        >
                                            <div className="relative w-[120px] h-[120px] sm:w-[180px] sm:h-[180px] mb-2 sm:mb-3">
                                                <SmartImage
                                                    src={f.imageUrl}
                                                    alt={f.name}
                                                    fill
                                                    sizes='180px'
                                                    className="object-contain transition-transform duration-300 group-hover:scale-110"
                                                />
                                            </div>
                                            <span className="w-full text-[12px] sm:text-[15px] font-bold text-gray-800 text-center leading-tight truncate">
                                                {f.name}
                                            </span>
                                            <span className="w-full text-[10px] sm:text-[12px] text-gray-500 text-center mt-1 sm:mt-1.5 font-medium">
                                                {count} {count === 1 ? 'Product' : 'Products'}
                                            </span>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    </Marquee>
                </div>
            </div>
        </section>
    );
};

export default CategoryExpertise;
