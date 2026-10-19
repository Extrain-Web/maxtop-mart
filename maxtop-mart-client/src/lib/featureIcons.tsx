import type { IconType } from 'react-icons';
import {
    LuTruck, LuHeadset, LuRotateCcw, LuShieldCheck, LuGift, LuTag, LuStar,
    LuClock, LuWallet, LuBadgeCheck, LuPackageCheck, LuCreditCard, LuThumbsUp, LuPhone,
} from 'react-icons/lu';

/**
 * The curated icon set an admin can pick from for the homepage "features strip".
 * Both the admin editor (dropdown) and the storefront strip read from this map,
 * so the stored `icon` key always resolves to the same icon.
 */
export const FEATURE_ICONS: Record<string, { label: string; Icon: IconType }> = {
    truck: { label: 'Delivery truck', Icon: LuTruck },
    headset: { label: 'Support headset', Icon: LuHeadset },
    return: { label: 'Return arrow', Icon: LuRotateCcw },
    shield: { label: 'Secure shield', Icon: LuShieldCheck },
    gift: { label: 'Gift', Icon: LuGift },
    tag: { label: 'Price tag', Icon: LuTag },
    star: { label: 'Star', Icon: LuStar },
    clock: { label: 'Clock', Icon: LuClock },
    wallet: { label: 'Wallet', Icon: LuWallet },
    badge: { label: 'Verified badge', Icon: LuBadgeCheck },
    package: { label: 'Package', Icon: LuPackageCheck },
    card: { label: 'Card payment', Icon: LuCreditCard },
    thumb: { label: 'Thumbs up', Icon: LuThumbsUp },
    phone: { label: 'Phone', Icon: LuPhone },
};

export const FEATURE_ICON_KEYS = Object.keys(FEATURE_ICONS);

/** Resolve an icon key to its component, falling back to the truck icon. */
export const featureIcon = (key?: string): IconType => FEATURE_ICONS[key || '']?.Icon || LuTruck;

export interface FeatureItem {
    _id?: string;
    icon: string;
    title: string;
    description: string; // one string; newlines render as separate lines
    active?: boolean;
    order?: number;
}

/** Shown on the storefront until an admin saves their own set. */
export const DEFAULT_FEATURES: FeatureItem[] = [
    { icon: 'truck', title: 'Free Shipping', description: 'Free shipping on all Bangladesh', active: true, order: 0 },
    { icon: 'headset', title: 'Support 24/7', description: 'Contact us 24 hours a day\n7 days a week', active: true, order: 1 },
    { icon: 'return', title: '3-7 Days Return', description: 'We have a 7-day return policy,\nterms and condition apply.', active: true, order: 2 },
    { icon: 'shield', title: '100% Secure Payment', description: 'Your payment information is\nprocessed securely.', active: true, order: 3 },
];
