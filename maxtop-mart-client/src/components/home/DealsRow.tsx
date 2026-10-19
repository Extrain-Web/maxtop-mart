"use client";

import React from 'react';
import Link from 'next/link';
import { useGetActiveOffersQuery } from '@/redux/api/offerApi';
import SectionHeader from './SectionHeader';
import NewProductCard from '@/components/shared/NewProductCard';

/* eslint-disable @typescript-eslint/no-explicit-any */

const computeDiscount = (p: any): number => {
    const raw = p?.discount;
    if (typeof raw === 'number' && raw > 0) return Math.round(raw);
    if (typeof raw === 'string' && parseFloat(raw) > 0) return Math.round(parseFloat(raw));
    const original = p?.originalPrice || p?.mrp;
    if (original && p?.price && original > p.price) {
        return Math.round(((original - p.price) / original) * 100);
    }
    return 0;
};



/**
 * Daraz-style "Daily Deals" row — fully BACKEND-DRIVEN. The active deal offer
 * (its product set + title) comes from GET /api/offers/active?type=deal, managed
 * by an admin. Reuses the FlashSale card style for a consistent look. Renders
 * nothing if there is no active deal offer.
 */
const DealsRow: React.FC = () => {
    const { data } = useGetActiveOffersQuery({ type: 'deal' });
    const offers: any[] = data?.data || [];
    const offer = offers[0]; // show the highest-priority active deal

    const items: any[] = (offer?.products || []).filter(Boolean).slice(0, 12);
    if (!offer || items.length === 0) return null;

    return (
        <div className="container mx-auto px-2 sm:px-4 my-6 sm:my-8">
            <div className="">
                <SectionHeader
                    title={offer.title || 'Daily Deals'}
                    seeMoreHref={offer.link || '/products?sort=-discount'}
                    seeMoreLabel="Shop More"
                />

                {/* Scrollable product row */}
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-hide">
                    {items.map((p) => (
                        <div key={p._id} className="w-[150px] md:w-[200px] flex-shrink-0">
                            <NewProductCard 
                                product={{
                                    id: p._id,
                                    slug: p.slug,
                                    name: p.name,
                                    image: p.thumbnail || p.images?.[0] || '',
                                    price: p.price,
                                    originalPrice: p.originalPrice || p.mrp || undefined,
                                    discount: computeDiscount(p),
                                    rating: p.rating,
                                    reviews: p.reviewCount,
                                    categoryName: typeof p.category === 'object' ? p.category?.name : undefined,
                                    variants: p.variants,
                                }} 
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DealsRow;
