"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { IconContext } from 'react-icons';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';

/**
 * Theme plumbing.
 *
 * The brand palette (dark-blue → black gradient on white) is defined in ONE
 * place: the `@theme` block at the top of `src/app/globals.css`. Nothing in
 * this file hardcodes a colour. The provider only
 *   1. applies a primary colour an admin explicitly picked in
 *      Settings → Appearance on top of the CSS defaults, deriving the tints
 *      and the gradient stops from it, and
 *   2. exposes the current values + logo / favicon URLs via `useTheme()`.
 */
interface ThemeContextType {
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
    faviconUrl: string;
    isLoaded: boolean;
}

// No stand-in logo on purpose: falling back to a bundled image meant a logo the
// admin never chose kept reappearing in Appearance settings. Empty = "not set".
const defaultTheme: ThemeContextType = {
    primaryColor: '',
    secondaryColor: '',
    logoUrl: '',
    faviconUrl: '',
    isLoaded: false,
};

/* Defaults from earlier versions (indigo, then orange) that were never chosen
   by an admin — treated as "not set" so changing the brand colour in
   globals.css never needs a DB migration. */
const LEGACY_COLORS = new Set(['#4f46e5', '#4338ca', '#6366f1', '#f85606', '#f97316']);
const HEX_COLOR = /^#[0-9a-f]{6}$/;

/* Every variable an admin override may set — cleared when no override applies. */
const OVERRIDE_VARS = [
    '--color-primary', '--color-primary-dark', '--color-primary-light',
    '--color-primary-lightest', '--color-primary-border', '--color-primary-surface',
    '--color-secondary',
    '--color-brand-blue', '--color-brand-navy', '--color-brand-black', '--color-brand-accent',
];

const ThemeContext = createContext<ThemeContextType>(defaultTheme);

export const useTheme = () => useContext(ThemeContext);

/** A colour an admin explicitly chose: a real 6-digit hex that isn't a legacy default. */
function customColor(raw: unknown): string | null {
    if (typeof raw !== 'string') return null;
    const value = raw.trim().toLowerCase();
    if (!HEX_COLOR.test(value) || LEGACY_COLORS.has(value)) return null;
    return value;
}

/* ─── Colour helpers ─── */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    try {
        hex = hex.replace('#', '');
        return {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16),
        };
    } catch { return null; }
}

function rgbToHex(r: number, g: number, b: number): string {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function darken(hex: string, amount: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    return rgbToHex(Math.max(0, rgb.r - amount), Math.max(0, rgb.g - amount), Math.max(0, rgb.b - amount));
}

function lighten(hex: string, factor: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    return rgbToHex(
        Math.min(255, Math.round(rgb.r + (255 - rgb.r) * factor)),
        Math.min(255, Math.round(rgb.g + (255 - rgb.g) * factor)),
        Math.min(255, Math.round(rgb.b + (255 - rgb.b) * factor)),
    );
}

/* Apply an admin-picked primary (+ optional secondary) on top of the CSS defaults. */
function applyOverride(primary: string, secondary: string | null) {
    const root = document.documentElement.style;
    root.setProperty('--color-primary', primary);
    root.setProperty('--color-primary-dark', darken(primary, 20));
    root.setProperty('--color-primary-light', lighten(primary, 0.88));
    root.setProperty('--color-primary-lightest', lighten(primary, 0.94));
    root.setProperty('--color-primary-border', lighten(primary, 0.7));
    root.setProperty('--color-primary-surface', lighten(primary, 0.97));
    // The dark gradient (header, dark strips) follows the chosen colour too.
    root.setProperty('--color-brand-blue', primary);
    root.setProperty('--color-brand-navy', darken(primary, 28));
    root.setProperty('--color-brand-black', darken(primary, 64));
    root.setProperty('--color-brand-accent', lighten(primary, 0.5));
    if (secondary) root.setProperty('--color-secondary', secondary);
    else root.removeProperty('--color-secondary');
}

function clearOverride() {
    const root = document.documentElement.style;
    OVERRIDE_VARS.forEach((name) => root.removeProperty(name));
}

/** Value of a CSS token as defined in globals.css (empty during SSR). */
function readToken(name: string): string {
    if (typeof document === 'undefined') return '';
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/* ─────────────────────────────────────────────────────────────────── */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { data: res } = useGetSiteContentQuery({});

    /* The CSS defaults (globals.css) render immediately — read them once on the client. */
    const [cssPrimary] = useState(() => readToken('--color-primary'));
    const [cssSecondary] = useState(() => readToken('--color-secondary'));

    /* What the admin explicitly chose, if anything. */
    const override = useMemo(() => {
        const theme = res?.data?.theme || {};
        return {
            primary: customColor(theme.primaryColor),
            secondary: customColor(theme.secondaryColor),
            logoUrl: (theme.logoUrl as string) || '',
            faviconUrl: (theme.faviconUrl as string) || '',
            loaded: Boolean(res),
        };
    }, [res]);

    /* Sync the override to the DOM once site content arrives (or clear a stale one). */
    useEffect(() => {
        if (override.primary) applyOverride(override.primary, override.secondary);
        else clearOverride();
    }, [override]);

    const themeData = useMemo<ThemeContextType>(() => ({
        primaryColor: override.primary || cssPrimary,
        secondaryColor: override.secondary || cssSecondary,
        logoUrl: override.logoUrl,
        faviconUrl: override.faviconUrl,
        isLoaded: override.loaded,
    }), [override, cssPrimary, cssSecondary]);

    return (
        <ThemeContext.Provider value={themeData}>
            {/* Global icon defaults — a consistent class on every react-icons SVG
               so outline (Lucide) icons render with a refined, uniform stroke. */}
            <IconContext.Provider value={{ className: 'app-icon' }}>
                {children}
            </IconContext.Provider>
        </ThemeContext.Provider>
    );
}
