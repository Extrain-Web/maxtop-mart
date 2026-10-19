"use client";

import React from 'react';

/**
 * PayLaterBar — full-bleed black strip shown under the deals section:
 * "Shop now, pay later with" + BNPL provider logos (Afterpay, Klarna, Affirm).
 * Logos are pre-styled colored chips served as images.
 */
const LOGOS: { src: string; alt: string }[] = [
    { src: 'https://aimg.kwcdn.com/upload_aimg/temu/7d02a691-5391-418d-a38e-eadde739e22e.png.slim.png?imageView2/2/w/300/q/70/format/avif', alt: 'Afterpay' },
    { src: 'https://aimg.kwcdn.com/upload_aimg/temu/cb55c72f-946d-455c-8a4d-f614261b3eb5.png.slim.png?imageView2/2/w/300/q/70/format/avif', alt: 'Klarna' },
    { src: 'https://aimg.kwcdn.com/upload_aimg/temu/8d57d602-98bf-4da0-b127-ff667db68fdf.png.slim.png?imageView2/2/w/300/q/70/format/avif', alt: 'Affirm' },
];

const PayLaterBar: React.FC = () => {
    return (
        <section className="container mx-auto px-3 sm:px-4 mt-5 sm:mt-7" aria-label="Buy now, pay later">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 rounded-lg bg-black px-4 py-5">
                <span className="text-lg sm:text-xl font-extrabold italic tracking-tight text-white">
                    Shop now, pay later with
                </span>
                <div className="flex items-center gap-2.5">
                    {LOGOS.map((logo) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            key={logo.alt}
                            src={logo.src}
                            alt={logo.alt}
                            className="h-9 w-auto rounded-md"
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PayLaterBar;
