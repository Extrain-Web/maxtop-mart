"use client";

import React from 'react';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import { featureIcon, DEFAULT_FEATURES, type FeatureItem } from '@/lib/featureIcons';

/**
 * Feature strip under the hero banner — four (or more) centred columns, each
 * with a thin line icon, an uppercase title and a short description.
 *
 * Fully admin-driven: the items come from Site Content → Features Strip
 * (Dashboard). Until an admin saves their own set, the bundled defaults show.
 */
const TrustStrip: React.FC = () => {
    const { data } = useGetSiteContentQuery({});

    const saved = (data?.data?.features || []) as FeatureItem[];
    const active = saved.filter((f) => f && f.active !== false && f.title);
    const features = (active.length > 0 ? [...active].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : DEFAULT_FEATURES);

    if (features.length === 0) return null;

    // Keep the grid balanced: 2-up on mobile, then match the column count (capped at 4).
    const cols = Math.min(features.length, 4);
    const lgCols = cols === 1 ? 'lg:grid-cols-1' : cols === 2 ? 'lg:grid-cols-2' : cols === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4';

    return (
        <section className="bg-white" aria-label="Why shop with us">
            <div className="container mx-auto px-4 py-10 sm:py-14">
                <div className={`grid grid-cols-2 gap-x-6 gap-y-10 ${lgCols} lg:gap-x-10`}>
                    {features.map((f, idx) => {
                        const Icon = featureIcon(f.icon);
                        const lines = String(f.description || '').split('\n');
                        return (
                            <div key={f._id || idx} className="flex flex-col items-center text-center">
                                <Icon className="mb-4 h-9 w-9 text-gray-400 sm:h-10 sm:w-10" strokeWidth={1.25} aria-hidden />
                                {/* Plain element (not h3) so it keeps the body font instead of the display font. */}
                                <p role="heading" aria-level={3} className="text-[13px] font-semibold uppercase tracking-wide text-gray-900 sm:text-[15px]">
                                    {f.title}
                                </p>
                                <p className="mt-2 text-[12.5px] leading-6 text-gray-500 sm:text-[14px] sm:leading-7">
                                    {lines.map((line, i) => (
                                        <React.Fragment key={i}>
                                            {line}
                                            {i < lines.length - 1 && <br />}
                                        </React.Fragment>
                                    ))}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default TrustStrip;
