// ── Admin permission catalogue ───────────────────────────────────
// Granular permissions assignable to admin/staff users. Superadmins bypass
// all permission checks (see authorizePermission middleware).
export const ALL_PERMISSIONS: string[] = [
    'view_analytics',
    'manage_orders',
    'manage_courier',
    'manage_shipping',
    'manage_returns',
    'manage_categories',
    'manage_products',
    'manage_expenses',
    'manage_coupons',
    'manage_offers',
    'manage_reviews',
    'manage_newsletter',
    'manage_payments',
    'manage_users',
    'manage_roles',
    'manage_site_content',
    'manage_settings',
];
