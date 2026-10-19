import { ShippingZone, ShippingRate, ShippingSettings, IShippingSettings } from './shipping.model';

export type FreeReason = 'product' | 'coupon' | 'threshold' | 'quantity' | null;

export interface ShippingQuoteInput {
    division?: string;
    district?: string;
    upazila?: string;
    city?: string; // fallback
    subtotal?: number;
    // Per-item free-delivery flags (from Product.shippingConfig.freeShipping).
    items?: { freeShipping?: boolean }[];
    // Total item quantity in the cart/order (for quantity-based free shipping).
    totalQuantity?: number;
    // Resolved upstream from a free_shipping coupon.
    couponFreeShipping?: boolean;
}

export interface ShippingQuoteResult {
    shippingCost: number;
    estimatedDays: string;
    freeShipping: boolean;
    freeReason: FreeReason;
}

// ── Settings singleton (admin-tunable; self-seeds defaults on first read) ──
export async function getSettings(): Promise<IShippingSettings> {
    // Upsert keeps a single 'main' doc and applies schema defaults on insert.
    return await ShippingSettings.findOneAndUpdate(
        { _key: 'main' },
        { $setOnInsert: { _key: 'main' } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
    ) as IShippingSettings;
}

export async function updateSettings(payload: Partial<IShippingSettings>): Promise<IShippingSettings> {
    const allowed: (keyof IShippingSettings)[] = [
        'freeShippingThreshold', 'freeShippingByThresholdEnabled',
        'defaultInsideDhakaRate', 'defaultOutsideDhakaRate', 'defaultEstimatedDays',
        'quantityFreeShippingEnabled', 'minItemsForFreeShipping',
        'defaultCommissionRate',
    ];
    const $set: any = {};
    for (const k of allowed) if (payload[k] !== undefined) $set[k] = payload[k];
    return await ShippingSettings.findOneAndUpdate(
        { _key: 'main' },
        { $set, $setOnInsert: { _key: 'main' } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
    ) as IShippingSettings;
}

/**
 * Authoritative, customer-facing shipping-cost computation. Never throws.
 *
 * Free-shipping resolution order (first match wins → cost 0):
 *   1. Product free delivery — EVERY checked-out item is free-delivery.
 *   2. Free-shipping coupon — couponFreeShipping passed in.
 *   3. Subtotal threshold — enabled AND subtotal >= threshold.
 *   4. Quantity threshold — enabled AND totalQuantity >= minItems.
 * Otherwise: zone match by city → rate.price (honoring the rate's
 * freeShippingMinimum); else default flat (inside/outside Dhaka) from settings.
 */
export async function computeShippingCost(
    { division, district, upazila, city, subtotal, items, totalQuantity, couponFreeShipping }: ShippingQuoteInput,
): Promise<ShippingQuoteResult> {
    const sub = Number(subtotal) || 0;
    const cityStr = (city || '').toString().trim().toLowerCase();
    const divStr = (division || '').toString().trim().toLowerCase();
    const distStr = (district || '').toString().trim().toLowerCase();
    const upaStr = (upazila || cityStr).toString().trim().toLowerCase();

    let settings: IShippingSettings | null = null;
    try {
        settings = await getSettings();
    } catch {
        settings = null; // fall back to hardcoded defaults below — never throw
    }
    const threshold = settings?.freeShippingThreshold ?? 5000;
    const thresholdEnabled = settings?.freeShippingByThresholdEnabled ?? true;
    const insideRate = settings?.defaultInsideDhakaRate ?? 60;
    const outsideRate = settings?.defaultOutsideDhakaRate ?? 120;
    const defaultDays = settings?.defaultEstimatedDays || '3-5 days';
    const qtyEnabled = settings?.quantityFreeShippingEnabled ?? false;
    const minItems = settings?.minItemsForFreeShipping ?? 0;

    const free = (reason: FreeReason): ShippingQuoteResult =>
        ({ shippingCost: 0, estimatedDays: defaultDays, freeShipping: true, freeReason: reason });

    // 1) Every item is free-delivery (per-order shipping → all-or-nothing).
    if (Array.isArray(items) && items.length > 0 && items.every((i) => i?.freeShipping === true)) {
        return free('product');
    }

    // 2) Free-shipping coupon.
    if (couponFreeShipping) return free('coupon');

    // 3) Subtotal threshold.
    if (thresholdEnabled && threshold > 0 && sub >= threshold) return free('threshold');

    // 4) Quantity threshold.
    if (qtyEnabled && minItems > 0 && Number(totalQuantity || 0) >= minItems) return free('quantity');

    // 5) Zone match → paid rate based on exact matching of division -> district -> upazila.
    try {
        const zones = await ShippingZone.find({ isActive: true });
        
        let bestMatch = null;
        let bestScore = -1;

        for (const z of zones) {
            const zDiv = (z.division || '').toLowerCase();
            const zDist = (z.district || '').toLowerCase();
            const zUpas = (z.upazilas || []).map(u => (u || '').toLowerCase());

            if (divStr && zDiv && divStr.includes(zDiv)) {
                let score = 1; // Base score for matching division
                
                if (zDist && distStr && distStr.includes(zDist)) {
                    score = 2; // Higher score for matching district
                    
                    if (zUpas.length > 0 && upaStr) {
                        if (zUpas.some(u => upaStr.includes(u))) {
                            score = 3; // Highest score for matching upazila
                        } else {
                            continue; // This zone requires a specific upazila which we don't match
                        }
                    }
                } else if (zDist) {
                    continue; // This zone requires a specific district which we don't match
                }
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = z;
                }
            }
        }

        if (!bestMatch && cityStr) {
             // Fallback to name search for backward compatibility
             bestMatch = zones.find((z) => {
                const nameMatch = (z.name || '').toLowerCase().includes(cityStr) || cityStr.includes((z.name || '').toLowerCase());
                return Boolean(z.name && nameMatch);
             });
        }

        if (bestMatch && typeof bestMatch.price === 'number') {
            return {
                shippingCost: bestMatch.price,
                estimatedDays: bestMatch.estimatedDays || defaultDays,
                freeShipping: false,
                freeReason: null,
            };
        }
    } catch {
        // Swallow DB errors → fall through to the default flat rate. Never throw.
    }

    // 6) Default flat rate.
    const isDhaka = cityStr.includes('dhaka');
    return {
        shippingCost: isDhaka ? insideRate : outsideRate,
        estimatedDays: defaultDays,
        freeShipping: false,
        freeReason: null,
    };
}

export default { computeShippingCost, getSettings, updateSettings };
