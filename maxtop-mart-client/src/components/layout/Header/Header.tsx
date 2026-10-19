"use client";

import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore, Suspense } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
    LuUser, LuHeart, LuShoppingCart, LuMenu, LuX,
    LuChevronDown, LuLayoutGrid, LuCrown, LuStar, LuSparkles,
    LuHeadphones, LuGlobe, LuTruck, LuShieldCheck, LuSmartphone,
    LuTag, LuBox, LuLogOut, LuLogIn,
} from 'react-icons/lu';
import { useAppSelector, useAppDispatch } from '@/redux';
import { useGetCategoriesQuery } from '@/redux/api/categoryApi';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import { logout } from '@/redux/slices/authSlice';
import Logo from '@/components/shared/Logo';
import SmartImage from '@/components/shared/SmartImage';
import SearchAutocomplete from '@/components/shared/SearchAutocomplete';

interface Category {
    _id: string;
    name: string;
    slug: string;
    icon?: string;
    createdAt?: string;
}

interface HeaderUser {
    name?: string;
    email?: string;
    avatar?: string;
}

const ICON_SIZE = 18;
const TOP_SELLING_HREF = '/products?sort=-totalSold';
const FIVE_STAR_HREF = '/products?sort=-rating';
const NEW_IN_HREF = '/products?sort=-createdAt';

/* Temu-style palette */
const NAV_BG = '#4a1a7c';      // purple nav bar
const TOPBAR_BG = '#161616';   // near-black utility bar
const SEARCH_PRIMARY = '#1a1a1a'; // black search button + border

const CategoryIcon: React.FC<{ icon?: string; size?: number; className?: string }> = ({ size = ICON_SIZE, className }) =>
    <LuTag size={size} strokeWidth={1.9} className={className} />;

const CountBadge: React.FC<{ count: number }> = ({ count }) => (
    <span className="pointer-events-none absolute -top-2 -right-2.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none shadow bg-[#fb7701] text-white">
        {count > 99 ? '99+' : count}
    </span>
);

interface MobileDrawerProps {
    open: boolean;
    onClose: () => void;
    categories: Category[];
    contactPhone: string;
    pathname: string;
    isAuthenticated: boolean;
    user: HeaderUser | null;
    dashboardHref: string;
    onLogout: () => void;
}

const subscribeNoop = () => () => {};

const MobileDrawer: React.FC<MobileDrawerProps> = ({
    open, onClose, categories, contactPhone, pathname, isAuthenticated, user, dashboardHref, onLogout,
}) => {
    const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 320);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.clearTimeout(focusTimer);
        };
    }, [open]);

    if (!isClient) return null;

    const item = (href: string, label: string, icon: React.ReactNode, extra?: React.ReactNode) => {
        const active = pathname === href;
        return (
            <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 px-5 py-3 text-[14px] font-medium transition-colors ${
                    active ? 'bg-purple-50 text-[#4a1a7c]' : 'text-gray-800 hover:bg-purple-50 hover:text-[#4a1a7c]'
                }`}
            >
                <span className={active ? 'text-[#4a1a7c]' : 'text-gray-400'}>{icon}</span>
                <span className="truncate">{label}</span>
                {extra}
            </Link>
        );
    };

    const sectionLabel = (text: string) => (
        <p className="px-5 pb-1 pt-4 text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">{text}</p>
    );

    return createPortal(
        <div
            id="mobile-drawer"
            className={`fixed inset-0 z-[10001] lg:hidden ${open ? '' : 'pointer-events-none'}`}
            aria-hidden={!open}
            inert={!open}
        >
            <div
                onClick={onClose}
                className={`absolute inset-0 bg-black/55 transition-opacity duration-300 ease-out ${open ? 'opacity-100' : 'opacity-0'}`}
            />
            <aside
                role="dialog"
                aria-modal="true"
                aria-label="Menu"
                className={`absolute left-0 top-0 flex h-full w-[300px] max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out will-change-transform ${
                    open ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex h-[60px] shrink-0 items-center justify-between px-4 text-white" style={{ background: NAV_BG }}>
                    <Link href="/" onClick={onClose} aria-label="Home">
                        <Logo light imgClassName="h-[48px]" />
                    </Link>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        aria-label="Close menu"
                        className="flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <LuX size={22} />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto pb-4" aria-label="Mobile menu">
                    {sectionLabel('Discover')}
                    {item(TOP_SELLING_HREF, 'Best-Selling Items', <LuCrown size={18} />)}
                    {item(FIVE_STAR_HREF, '5-Star Rated', <LuStar size={18} />)}
                    {item(NEW_IN_HREF, 'New In', <LuSparkles size={18} />)}

                    {sectionLabel('Categories')}
                    {item('/products', 'All Products', <LuLayoutGrid size={18} />)}
                    {categories.map((cat) =>
                        item(
                            `/products?category=${cat._id}`,
                            cat.name,
                            <CategoryIcon icon={cat.icon} size={18} />,
                        ),
                    )}

                    {sectionLabel('Account')}
                    {isAuthenticated && user ? (
                        <>
                            <div className="flex items-center gap-3 px-5 py-2.5">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-50 text-[#4a1a7c]">
                                    <LuUser size={18} />
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-gray-800">{user.name || 'User'}</p>
                                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                                </div>
                            </div>
                            {item(dashboardHref, 'Orders & Account', <LuLayoutGrid size={18} />)}
                            {item('/dashboard/user/orders', 'My Orders', <LuBox size={18} />)}
                            {item('/wishlist', 'Wishlist', <LuHeart size={18} />)}
                            <button
                                type="button"
                                onClick={() => { onClose(); onLogout(); }}
                                className="flex w-full items-center gap-3 px-5 py-3 text-[14px] font-medium text-red-500 transition-colors hover:bg-red-50"
                            >
                                <LuLogOut size={18} /> Logout
                            </button>
                        </>
                    ) : (
                        item('/login', 'Sign in / Register', <LuLogIn size={18} />)
                    )}
                </nav>

                {contactPhone && (
                    <a
                        href={`tel:${contactPhone}`}
                        className="flex shrink-0 items-center gap-2 border-t border-gray-100 px-5 py-3.5 text-[13.5px] font-medium text-gray-600 transition-colors hover:text-[#4a1a7c]"
                    >
                        <LuHeadphones size={15} strokeWidth={2} /> {contactPhone}
                    </a>
                )}
            </aside>
        </div>,
        document.body,
    );
};

const HeaderInner: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [catOpen, setCatOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const profileRef = useRef<HTMLDivElement>(null);
    const catRef = useRef<HTMLDivElement>(null);

    const cartCount = useAppSelector((state) => state.cart.items.length);
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const { data: categoriesData } = useGetCategoriesQuery({ menu: true });
    const categories: Category[] = useMemo(() => categoriesData?.data || [], [categoriesData]);
    const { data: siteContentRes } = useGetSiteContentQuery({});
    const contactPhone: string = siteContentRes?.data?.contact?.phone || '';

    const [panelsPath, setPanelsPath] = useState(pathname);
    if (pathname !== panelsPath) {
        setPanelsPath(pathname);
        setMobileOpen(false);
        setProfileOpen(false);
        setCatOpen(false);
    }

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const onMouseDown = (e: MouseEvent) => {
            const target = e.target as Node;
            if (profileRef.current && !profileRef.current.contains(target)) setProfileOpen(false);
            if (catRef.current && !catRef.current.contains(target)) setCatOpen(false);
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setProfileOpen(false);
                setCatOpen(false);
                setMobileOpen(false);
            }
        };
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, []);

    const handleLogout = () => {
        dispatch(logout());
        localStorage.removeItem('token');
        setProfileOpen(false);
        router.push('/');
    };

    const handleSearch = (rawTerm?: string) => {
        const term = (rawTerm ?? searchQuery).trim();
        if (!term) return;
        router.push(`/products?q=${encodeURIComponent(term)}`);
    };

    const dashboardHref = user?.role === 'admin' || user?.role === 'superadmin' ? '/dashboard/admin' : '/dashboard/user';
    const supportHref = contactPhone ? `tel:${contactPhone}` : '/services';

    const navLink = 'flex items-center gap-1.5 whitespace-nowrap text-[14px] font-medium text-white/90 transition-colors hover:text-white';
    const menuItem = 'flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] text-gray-700 transition-colors hover:bg-purple-50 hover:text-[#4a1a7c]';

    const isActive = (href: string) => {
        const [base, query] = href.split('?');
        if (pathname !== base) return false;
        if (!query) return true;
        const key = query.split('=')[0];
        const val = decodeURIComponent(query.split('=')[1] ?? '');
        return searchParams.get(key) === val;
    };

    // Mobile category scroller (Temu-style tabs)
    const allActive = pathname === '/' || (pathname.startsWith('/products') && !searchParams.get('category') && !searchParams.get('q'));
    const mobileCatClass = (active: boolean) =>
        `shrink-0 whitespace-nowrap border-b-2 pb-1.5 text-[14px] transition-colors ${
            active ? 'border-white font-bold text-white' : 'border-transparent font-medium text-white/80 hover:text-white'
        }`;

    return (
        <header
            className="sticky top-0 z-50 transition-shadow duration-300"
            style={{ background: NAV_BG, boxShadow: scrolled ? '0 8px 30px -10px rgba(0,0,0,0.45)' : 'none' }}
        >
            {/* ───────── Top utility bar (black) ───────── */}
            <div className="hidden md:block text-white" style={{ background: TOPBAR_BG }}>
                <div className="container mx-auto px-4 flex items-center justify-between gap-6 py-1.5">
                    <div className="flex items-center gap-7">
                        <Link href={NEW_IN_HREF} className="flex items-center gap-2 group">
                            <LuTruck size={20} strokeWidth={1.8} className="text-[#fb7701]" />
                            <span className="leading-tight">
                                <span className="flex items-center gap-1 text-[12.5px] font-semibold group-hover:underline">
                                    Free shipping <LuChevronDown size={12} className="-rotate-90" />
                                </span>
                                <span className="block text-[10.5px] text-white/60">Min. order value ৳2000</span>
                            </span>
                        </Link>
                        <div className="flex items-center gap-2">
                            <LuShieldCheck size={20} strokeWidth={1.8} className="text-[#fb7701]" />
                            <span className="leading-tight">
                                <span className="block text-[12.5px] font-semibold">Delivery guarantee</span>
                                <span className="block text-[10.5px] text-white/60">Refund for any issues</span>
                            </span>
                        </div>
                        <div className="hidden lg:flex items-center gap-2">
                            <LuSmartphone size={20} strokeWidth={1.8} className="text-[#fb7701]" />
                            <span className="text-[12.5px] font-semibold">Get the App</span>
                        </div>
                    </div>

                    {/* Seller banner */}
                    <Link
                        href="/services"
                        className="flex items-center gap-3 rounded-full bg-white/5 py-1 pl-4 pr-1 transition-colors hover:bg-white/10"
                    >
                        <span className="text-[12px] font-medium leading-tight text-right">
                            Start Selling to Thousands of<br className="hidden xl:block" /> Buyers on Maxtop Mart
                        </span>
                        <span className="rounded-full bg-[#fb7701] px-3.5 py-1.5 text-[12.5px] font-bold text-white transition-colors hover:bg-[#e56a00]">
                            Join Now
                        </span>
                    </Link>
                </div>
            </div>

            {/* ───────── Main nav (purple) ───────── */}
            <div className="text-white">

                {/* ========== MOBILE (<lg) ========== */}
                <div className="lg:hidden">
                    {/* Row 1: logo + inline search + icons */}
                    <div className="container mx-auto px-3 flex h-[54px] items-center gap-2">
                        <Link href="/" className="shrink-0 flex items-center" aria-label="Home" onClick={() => setSearchQuery('')}>
                            <Logo light size={24} />
                        </Link>

                        <div className="flex-1 min-w-0" style={{ '--color-primary': SEARCH_PRIMARY } as React.CSSProperties}>
                            <SearchAutocomplete
                                variant="mobile"
                                value={searchQuery}
                                onChange={setSearchQuery}
                                onSubmit={handleSearch}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => setMobileOpen(true)}
                            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
                            aria-label="Open menu"
                        >
                            <LuMenu size={22} strokeWidth={1.9} />
                        </button>

                        <Link
                            href={isAuthenticated ? dashboardHref : '/login'}
                            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
                            aria-label="Account"
                        >
                            <LuUser size={21} strokeWidth={1.9} />
                        </Link>

                        <Link
                            href="/cart"
                            className="relative shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
                            aria-label={`Cart, ${cartCount} items`}
                        >
                            <LuShoppingCart size={21} strokeWidth={1.9} />
                            <CountBadge count={cartCount} />
                        </Link>
                    </div>

                    {/* Row 2: horizontal category tabs */}
                    <div className="container mx-auto">
                        <nav
                            className="flex items-center gap-5 overflow-x-auto px-3 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                            aria-label="Categories"
                        >
                            <Link href="/products" className={mobileCatClass(allActive)}>All</Link>
                            {categories.map((cat) => (
                                <Link
                                    key={cat._id}
                                    href={`/products?category=${cat._id}`}
                                    className={mobileCatClass(searchParams.get('category') === cat._id)}
                                >
                                    {cat.name}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* ========== DESKTOP (lg+) ========== */}
                <div className="hidden lg:block">
                    <div className="container mx-auto px-4 flex h-[64px] items-center gap-6">
                        {/* Logo */}
                        <Link href="/" className="shrink-0 flex items-center mr-2" aria-label="Home" onClick={() => setSearchQuery('')}>
                            <Logo light imgClassName="h-[48px]" />
                        </Link>

                        {/* Left nav links */}
                        <nav className="flex items-center gap-5 xl:gap-6 shrink-0" aria-label="Primary">
                            <Link href={TOP_SELLING_HREF} className={`${navLink} ${isActive(TOP_SELLING_HREF) ? '!text-white font-semibold' : ''}`}>
                                <LuCrown size={18} strokeWidth={1.9} className="text-[#fb7701]" /> Best-Selling Items
                            </Link>
                            <Link href={FIVE_STAR_HREF} className={`${navLink} ${isActive(FIVE_STAR_HREF) ? '!text-white font-semibold' : ''}`}>
                                <LuStar size={18} strokeWidth={1.9} className="text-[#fb7701]" /> 5-Star Rated
                            </Link>
                            <Link href={NEW_IN_HREF} className={`${navLink} ${isActive(NEW_IN_HREF) ? '!text-white font-semibold' : ''}`}>
                                New In
                            </Link>

                            {/* Categories dropdown */}
                            <div className="relative" ref={catRef}>
                                <button
                                    type="button"
                                    onClick={() => setCatOpen((o) => !o)}
                                    className={navLink}
                                    aria-haspopup="menu"
                                    aria-expanded={catOpen}
                                >
                                    Categories
                                    <LuChevronDown size={15} strokeWidth={2.5} className={`transition-transform ${catOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {catOpen && (
                                    <div className="absolute left-0 top-full z-[70] mt-3 w-64 overflow-hidden rounded-xl border border-gray-100 bg-white py-1.5 shadow-2xl shadow-black/20">
                                        <div className="max-h-80 overflow-y-auto">
                                            <Link href="/products" className={`${menuItem} font-medium`}>
                                                <LuLayoutGrid size={15} /> All Products
                                            </Link>
                                            {categories.map((cat) => (
                                                <Link key={cat._id} href={`/products?category=${cat._id}`} className={menuItem}>
                                                    <CategoryIcon icon={cat.icon} size={15} className="text-gray-400" />
                                                    <span className="truncate">{cat.name}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </nav>

                        {/* Search */}
                        <div className="flex-1 max-w-2xl" style={{ '--color-primary': SEARCH_PRIMARY } as React.CSSProperties}>
                            <SearchAutocomplete
                                variant="desktop"
                                value={searchQuery}
                                onChange={setSearchQuery}
                                onSubmit={handleSearch}
                            />
                        </div>

                        {/* Right actions */}
                        <div className="flex items-center gap-5 shrink-0">
                            {isAuthenticated && user ? (
                                <div className="relative" ref={profileRef}>
                                    <button
                                        type="button"
                                        onClick={() => setProfileOpen((o) => !o)}
                                        className="flex items-center gap-2 text-left transition-colors hover:text-white text-white/90"
                                        aria-haspopup="menu"
                                        aria-expanded={profileOpen}
                                    >
                                        {user.avatar
                                            ? <SmartImage src={user.avatar} alt="" width={26} height={26} className="h-[26px] w-[26px] rounded-full object-cover border border-white/30" />
                                            : <LuUser size={22} strokeWidth={1.9} />}
                                        <span className="leading-tight">
                                            <span className="block text-[13px] font-semibold">{user.name?.split(' ')[0] || 'Account'}</span>
                                            <span className="block text-[11px] text-white/60">Orders & Account</span>
                                        </span>
                                        <LuChevronDown size={14} className={`transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {profileOpen && (
                                        <div className="absolute right-0 top-full z-[70] mt-3 w-60 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-2xl shadow-black/25">
                                            <div className="border-b border-gray-100 bg-purple-50 px-4 py-3.5">
                                                <p className="truncate text-sm font-bold text-gray-800">{user.name || 'User'}</p>
                                                <p className="mt-0.5 truncate text-xs text-gray-500">{user.email}</p>
                                            </div>
                                            <div className="py-1.5">
                                                <Link href={dashboardHref} className={menuItem}><LuLayoutGrid size={15} /> Orders & Account</Link>
                                                <Link href="/dashboard/user/orders" className={menuItem}><LuBox size={15} /> My Orders</Link>
                                                <Link href="/wishlist" className={menuItem}><LuHeart size={15} /> Wishlist</Link>
                                            </div>
                                            <div className="border-t border-gray-100 py-1.5">
                                                <button
                                                    type="button"
                                                    onClick={handleLogout}
                                                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13.5px] text-red-500 transition-colors hover:bg-red-50"
                                                >
                                                    <LuLogOut size={15} /> Logout
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link href="/login" className="flex items-center gap-2 text-white/90 transition-colors hover:text-white">
                                    <LuUser size={22} strokeWidth={1.9} />
                                    <span className="leading-tight">
                                        <span className="block text-[13px] font-semibold">Sign in / Register</span>
                                        <span className="block text-[11px] text-white/60">Orders & Account</span>
                                    </span>
                                </Link>
                            )}

                            {/* Support */}
                            <a href={supportHref} className="flex items-center gap-1.5 text-[13px] font-medium text-white/90 transition-colors hover:text-white">
                                <LuHeadphones size={20} strokeWidth={1.9} /> Support
                            </a>

                            {/* Language */}
                            <button type="button" className="flex items-center gap-1.5 text-[13px] font-medium text-white/90 transition-colors hover:text-white">
                                <LuGlobe size={20} strokeWidth={1.9} /> English
                            </button>

                            {/* Cart */}
                            <Link href="/cart" className="relative flex items-center justify-center h-10 w-10 rounded-full text-white transition-colors hover:bg-white/10" aria-label={`Cart, ${cartCount} items`}>
                                <LuShoppingCart size={24} strokeWidth={1.9} />
                                <CountBadge count={cartCount} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile drawer */}
            <MobileDrawer
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                categories={categories}
                contactPhone={contactPhone}
                pathname={pathname}
                isAuthenticated={isAuthenticated}
                user={user}
                dashboardHref={dashboardHref}
                onLogout={handleLogout}
            />
        </header>
    );
};

const Header: React.FC = () => {
    return (
        <Suspense fallback={<div className="h-[64px] md:h-[100px]" style={{ background: NAV_BG }} />}>
            <HeaderInner />
        </Suspense>
    );
};

export default Header;
