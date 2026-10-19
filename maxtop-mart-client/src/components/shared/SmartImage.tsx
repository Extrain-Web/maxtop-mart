"use client";

import React, { useState } from 'react';
import NextImage, { ImageProps } from 'next/image';

/**
 * SmartImage — the single wrapper used everywhere in place of a raw <img>.
 *
 * It renders Next.js's <Image> (so every photo is automatically resized,
 * served as AVIF/WebP and lazy-loaded) while keeping the two conveniences a
 * plain <img> gave us:
 *   • a graceful fallback when the src is empty or fails to load, and
 *   • a `fill`-friendly API so callers only need a relatively-positioned box.
 *
 * Callers pass EITHER `fill` (the parent must be position:relative) OR explicit
 * width/height — exactly like next/image.
 */

// Neutral light-gray placeholder (inline SVG, no network request).
const FALLBACK =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23f1f5f9' width='400' height='400'/%3E%3C/svg%3E";

type SmartImageProps = Omit<ImageProps, 'src' | 'alt'> & {
    src?: string | null;
    alt?: string;
    fallbackSrc?: string;
};

/**
 * Normalize any backend upload URL to the CURRENT API origin.
 *
 * Image URLs in the data come in several shapes — a relative `/uploads/...`
 * path, a stale local-dev URL like `http://localhost:5000/uploads/...`, or an
 * `http://` API URL. Whatever the stored host/scheme, we rebuild the URL from
 * the `/uploads/...` part onto the configured API base (https in production),
 * so images always load and never trip mixed-content blocking. Non-upload URLs
 * (e.g. Cloudinary) are returned unchanged.
 */
export function resolveImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const base = apiUrl.replace(/\/api\/?$/, '');

    // If it's a relative path, resolve to current backend
    if (url.startsWith('/uploads/')) {
        return base + url;
    }

    // If it's a localhost URL but we might be on a different IP/domain, rewrite it
    if (url.includes('/uploads/') && (url.includes('localhost') || url.includes('127.0.0.1'))) {
        const idx = url.indexOf('/uploads/');
        return base + url.slice(idx);
    }

    // Otherwise (like api.maxtopmartbd.com or Cloudinary), leave it alone
    // so local dev can load images from the production server.
    return url;
}

const SmartImage: React.FC<SmartImageProps> = ({
    src,
    alt = '',
    fallbackSrc = FALLBACK,
    sizes,
    fill,
    ...rest
}) => {
    const [errored, setErrored] = useState(false);
    let resolved = !src || errored ? fallbackSrc : src;
    resolved = resolveImageUrl(resolved);

    // Data-URI fallbacks can't be optimized by the Next image loader.
    const isData = resolved.startsWith('data:');
    const isLocal = resolved.includes('localhost') || resolved.includes('127.0.0.1');

    return (
        <NextImage
            src={resolved}
            alt={alt}
            fill={fill}
            // A sensible default so `fill` images don't over-fetch; callers can override.
            sizes={sizes ?? (fill ? '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw' : undefined)}
            unoptimized={isData || isLocal || undefined}
            onError={() => setErrored(true)}
            {...rest}
        />
    );
};

export default SmartImage;
