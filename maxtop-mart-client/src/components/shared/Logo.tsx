import React from 'react';

/**
 * Maxtop Mart brand logo — rendered as the "MAXTOP MART" wordmark.
 */
interface LogoProps {
    /** Logo height in px (used when `imgClassName` is not set). */
    size?: number;
    /** Kept for API compatibility — the artwork reads on light and dark backgrounds alike. */
    light?: boolean;
    /** Wrap the logo in a white rounded chip. */
    boxed?: boolean;
    /** Kept for API compatibility (no-op). */
    showTagline?: boolean;
    /** Render only the shield mark (no wordmark). */
    iconOnly?: boolean;
    className?: string;
    /** Tailwind height utilities for the logo (e.g. "h-[40px] md:h-[50px]"). Overrides `size`. */
    imgClassName?: string;
}

export const BRAND_NAME = 'Maxtop Mart';

const Logo: React.FC<LogoProps> = ({ size = 40, boxed = false, light = false, className }) => {
    // "MAXTOP" turns white on dark surfaces (header) via `light`; stays brand blue elsewhere.
    // "MART" is always the brand green, which reads on both light and dark backgrounds.
    const maxtopColor = light ? '#FFFFFF' : 'var(--color-primary)';
    const martColor = 'var(--color-success)';

    return (
        <span
            className={className}
            style={boxed
                ? { display: 'inline-flex', alignItems: 'center', background: '#fff', borderRadius: 10, padding: '6px 12px' }
                : { display: 'inline-flex', alignItems: 'center' }}
        >
            <span className="font-heading font-extrabold tracking-tight whitespace-nowrap" style={{ fontSize: size ? Math.max(20, size * 0.7) : 28 }}>
                <span style={{ color: maxtopColor }}>MAXTOP</span>{' '}
                <span style={{ color: martColor }}>MART</span>
            </span>
        </span>
    );
};

/** Same logo API, kept for places that import the compact name. */
export const LogoMark: React.FC<LogoProps> = (props) => <Logo {...props} />;

export default Logo;
