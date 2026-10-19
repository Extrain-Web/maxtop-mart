"use client";

import React, { useState, useRef, useEffect } from 'react';
import SmartImage from '@/components/shared/SmartImage';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    LuHeart, LuShoppingCart, LuMinus, LuPlus, LuCircleCheck,
    LuStar, LuX, LuZoomIn, LuCopy, LuShare2, LuDownload,
    LuChevronUp, LuChevronDown, LuMessageSquare,
    LuEye, LuChevronRight, LuChevronLeft, LuSend,
    LuMapPin, LuTruck, LuDollarSign, LuRefreshCw, LuShield, LuClock, LuShoppingBag
} from 'react-icons/lu';
import { resolveImageUrl } from '@/components/shared/SmartImage';
import { useGetProductBySlugQuery, useGetRelatedProductsQuery, useIncrementProductStatMutation } from '@/redux/api/productApi';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import { useGetProductReviewsQuery, useCreateReviewMutation } from '@/redux/api/reviewApi';
import { useAppDispatch, useAppSelector } from '@/redux';
import { addToCart } from '@/redux/slices/cartSlice';
import { useCreateInquiryMutation } from '@/redux/api/inquiryApi';
import { useWishlist } from '@/hooks/useWishlist';
import { toast } from 'react-hot-toast';
import NewProductCard, { CommentsPopup } from '@/components/shared/NewProductCard';
import { getDisplayPrice } from '@/utils/offerPrice';
import {
    FaFacebookF, FaFacebookMessenger, FaWhatsapp, FaTelegramPlane,
    FaLinkedinIn, FaPinterestP, FaEnvelope, FaInstagram
} from 'react-icons/fa';
import { FaXTwitter, FaTiktok } from 'react-icons/fa6';

export default function ProductDetailsPage() {
    const { slug } = useParams();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { isAuthenticated } = useAppSelector((state: any) => state.auth);
    const [createInquiry] = useCreateInquiryMutation();
    const [incrementStat] = useIncrementProductStatMutation();
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const { isInWishlist, toggle: toggleWishlistItem } = useWishlist();
    const [addedToCart, setAddedToCart] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [selectedColor, setSelectedColor] = useState<string>('');
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [activeBottomTab, setActiveBottomTab] = useState<'description' | 'reviews'>('description');
    const [detailsExpanded, setDetailsExpanded] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [showSharePopup, setShowSharePopup] = useState(false);
    const [shareLinkCopied, setShareLinkCopied] = useState(false);
    const [showCommentsModal, setShowCommentsModal] = useState(false);
    const [cmtText, setCmtText] = useState('');
    const [cmtRating, setCmtRating] = useState(5);
    const [cmtHoverRating, setCmtHoverRating] = useState(0);
    const [cmtSubmitting, setCmtSubmitting] = useState(false);
    const [cmtSuccess, setCmtSuccess] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const isDraggingRef = useRef(false);
    const hasDraggedRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const panOffsetRef = useRef({ x: 0, y: 0 });
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const [inquiryName, setInquiryName] = useState('');
    const [inquiryContact, setInquiryContact] = useState('');
    const [inquiryPhone, setInquiryPhone] = useState('');
    const [inquiryMessage, setInquiryMessage] = useState('');
    const [inquirySubmitting, setInquirySubmitting] = useState(false);
    const [inquirySuccess, setInquirySuccess] = useState(false);
    const colorSwatchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [slug]);

    const anyModalOpen = showSharePopup || showCommentsModal || showRatingModal || isFullscreen || showDownloadModal || showInquiryModal;
    useEffect(() => {
        if (anyModalOpen) { document.body.style.overflow = 'hidden'; }
        else { document.body.style.overflow = ''; }
        return () => { document.body.style.overflow = ''; };
    }, [anyModalOpen]);

    const scrollList = (ref: React.RefObject<HTMLDivElement | null>, dir: 'up' | 'down') => {
        if (ref.current) ref.current.scrollBy({ left: dir === 'down' ? 140 : -140, behavior: 'smooth' });
    };

    const { data: productData, isLoading, isError } = useGetProductBySlugQuery(slug as string, { skip: !slug });
    const product = productData?.data;
    const isWishlisted = product ? isInWishlist(product._id || product.id) : false;

    const { data: relatedData } = useGetRelatedProductsQuery(
        { id: product?._id, categoryId: product?.category?._id },
        { skip: !product?._id || !product?.category?._id }
    );
    const relatedProducts = relatedData?.data || [];

    // Ship-from location for the delivery box — from site-content, so editing it in
    // Settings updates it here too (it used to be a hardcoded address string).
    const { data: siteContentRes } = useGetSiteContentQuery(undefined);
    const shipsFrom: string = siteContentRes?.data?.contact?.address || '';

    const { data: reviewsData } = useGetProductReviewsQuery({ productId: product?._id }, { skip: !product?._id });
    const reviews = reviewsData?.data || [];
    const [createReviewMutation] = useCreateReviewMutation();

    const cartItems = useAppSelector((state: any) => state.cart.items);

    const getCartId = () => {
        const parts = [product?._id];
        if (selectedColor) parts.push(selectedColor);
        if (selectedSize) parts.push(selectedSize);
        return parts.join('_');
    };
    const isInCart = product ? cartItems.some((item: any) => item.id === getCartId()) : false;

    const handleAddToCart = () => {
        if (!product) return;
        // Enforce the variation choice (same guard as Buy Now) — otherwise the cart line
        // silently gets a variant's price with no recorded color/size.
        if ((colorSwatches.length > 0 && !selectedColor) || (sizeList.length > 0 && !selectedSize)) {
            const need = [colorSwatches.length > 0 && !selectedColor ? 'color' : '', sizeList.length > 0 && !selectedSize ? 'size' : ''].filter(Boolean).join(' and ');
            toast.error(`Please select ${need} first`);
            return;
        }
        const cartId = getCartId();
        if (isInCart) { setAddedToCart(true); setTimeout(() => setAddedToCart(false), 2000); return; }
        const variantImage = activeVariant?.images?.[0] || allImages[selectedImage] || product.thumbnail;
        dispatch(addToCart({ id: cartId, productId: product._id, name: product.name, price: discountedPrice, mrp: activeVariant?.originalPrice || product.originalPrice || product.price, image: variantImage, category: product.category?.name || 'General', quantity, color: selectedColor || undefined, colorHex: activeVariant?.colorHex || undefined, size: selectedSize || undefined }));
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    const handleBuyNow = () => {
        if (!product || displayStock === 0) return;
        // Buy Now skips the cart, so enforce the variation choice here too — otherwise
        // an order could be placed without a required color/size.
        if ((colorSwatches.length > 0 && !selectedColor) || (sizeList.length > 0 && !selectedSize)) {
            const need = [colorSwatches.length > 0 && !selectedColor ? 'color' : '', sizeList.length > 0 && !selectedSize ? 'size' : ''].filter(Boolean).join(' and ');
            toast.error(`Please select ${need} before buying`);
            return;
        }
        const cartId = getCartId();
        if (!isInCart) {
            const variantImage = activeVariant?.images?.[0] || allImages[selectedImage] || product.thumbnail;
            dispatch(addToCart({ id: cartId, productId: product._id, name: product.name, price: discountedPrice, mrp: activeVariant?.originalPrice || product.originalPrice || product.price, image: variantImage, category: product.category?.name || 'General', quantity, color: selectedColor || undefined, colorHex: activeVariant?.colorHex || undefined, size: selectedSize || undefined }));
        }
        router.push('/checkout');
    };

    if (isLoading) {
        return (
            <div style={{ minHeight: '100vh', background: '#fff' }}>
                <div className="container mx-auto px-4 pb-6" style={{ paddingTop: '32px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        {[50, 80, 120].map(w => <div key={w} style={{ height: '14px', width: `${w}px`, background: '#e5e7eb', borderRadius: '4px' }} className="animate-pulse" />)}
                    </div>
                    <div style={{ background: '#fff', borderRadius: '6px', border: '1px solid #e5e7eb', padding: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 55%', aspectRatio: '1', background: '#f3f4f6', borderRadius: '6px' }} className="animate-pulse" />
                        <div style={{ flex: '1 1 40%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[60, 20, 80, 80, 40].map((h, i) => <div key={i} style={{ height: `${h}px`, background: '#f3f4f6', borderRadius: '6px' }} className="animate-pulse" />)}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isError || !product) {
        return (
            <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '6px', maxWidth: '380px', margin: '0 auto', border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😕</div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111', marginBottom: '0.5rem' }}>Product Not Found</h2>
                    <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '14px' }}>This product may have been removed or is no longer available.</p>
                    <Link href="/products" style={{ padding: '0.625rem 1.5rem', background: 'var(--color-primary)', color: '#fff', borderRadius: '6px', fontWeight: 600, textDecoration: 'none', fontSize: '14px' }}>Browse Products</Link>
                </div>
            </div>
        );
    }

    const baseImages = [product.thumbnail, ...(product.images || [])].filter(Boolean).map(resolveImageUrl);
    const variants = product.variants || [];
    const hasVariants = variants.length > 0;

    const colorSwatches = (() => {
        if (hasVariants) {
            const map = new Map<string, string>();
            variants.forEach((v: any) => { if (v.color) map.set(v.color, v.colorHex || v.color); });
            return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
        }
        if (product.colors?.length > 0) return product.colors.map((c: string, i: number) => ({ name: c, hex: product.colorHex?.[i] || c }));
        return [];
    })();

    const sizeList: string[] = (() => {
        if (hasVariants) return [...new Set(variants.filter((v: any) => v.size).map((v: any) => v.size))];
        return product.sizes?.length > 0 ? product.sizes : [];
    })();

    const colorImageMap = (() => {
        const map: Record<string, string[]> = {};
        if (hasVariants) {
            variants.forEach((v: any) => {
                if (v.color && v.images?.length > 0) {
                    if (!map[v.color]) map[v.color] = [];
                    v.images.forEach((img: string) => { 
                        const resolvedImg = resolveImageUrl(img);
                        if (!map[v.color].includes(resolvedImg)) map[v.color].push(resolvedImg); 
                    });
                }
            });
        } else if (colorSwatches.length > 0 && baseImages.length > 0) {
            colorSwatches.forEach((c: any, i: number) => { if (i < baseImages.length) map[c.name] = [baseImages[i]]; });
        }
        return map;
    })();

    const imageToColorMap = (() => {
        const map: Record<string, string> = {};
        Object.entries(colorImageMap).forEach(([colorName, imgs]) => { imgs.forEach(img => { map[img] = colorName; }); });
        return map;
    })();

    // Only resolve a variant AFTER the shopper has made a selection — otherwise the
    // page would show variant #1's price/stock (and skip the base offer window) before
    // anything is picked, disagreeing with the (empty) swatch/size selection UI.
    const hasVariantSelection = !!selectedColor || !!selectedSize;
    const activeVariant = hasVariants && hasVariantSelection
        ? (variants.find((v: any) => (!selectedColor || v.color === selectedColor) && (!selectedSize || v.size === selectedSize)) || null)
        : null;
    const availableSizesForColor = hasVariants && selectedColor ? variants.filter((v: any) => v.color === selectedColor).map((v: any) => v.size).filter(Boolean) : sizeList;
    const availableColorsForSize = hasVariants && selectedSize ? variants.filter((v: any) => v.size === selectedSize).map((v: any) => v.color).filter(Boolean) : colorSwatches.map((c: any) => c.name);

    const allImages = (() => {
        if (hasVariants) {
            const seen = new Set<string>(); const imgs: string[] = [];
            baseImages.forEach(img => { if (!seen.has(img)) { seen.add(img); imgs.push(img); } });
            const processedColors = new Set<string>();
            variants.forEach((v: any) => {
                const colorKey = v.color || `__no_color_${v.size}`;
                if (processedColors.has(colorKey)) return;
                processedColors.add(colorKey);
                (v.images || []).forEach((img: string) => { 
                    const resolvedImg = resolveImageUrl(img);
                    if (!seen.has(resolvedImg)) { seen.add(resolvedImg); imgs.push(resolvedImg); } 
                });
            });
            return imgs;
        }
        return baseImages;
    })();

    // Base-product offer respecting the validity window (offerStartDate/offerEndDate).
    // When the offer has expired or not yet started, the regular price is shown and no
    // discount applies. Variants carry their own pricing and are not gated by this window.
    const offerDisplay = getDisplayPrice(product);

    const discountedPrice = (() => {
        if (activeVariant) { const vd = activeVariant.discount || 0; return vd > 0 ? activeVariant.price - (activeVariant.price * vd) / 100 : activeVariant.price; }
        // `price` IS the offer price the customer pays — don't re-apply discount on top of it.
        // Offer active → offer price (product.price); offer inactive → regular (original) price.
        return offerDisplay.currentPrice;
    })();

    const displayStock = activeVariant ? activeVariant.stock : product.stock;

    const productDetails: { key: string; value: string }[] = [];
    if (product.sku) productDetails.push({ key: 'Model', value: product.sku });
    if (product.brand) productDetails.push({ key: 'Brand', value: product.brand.toUpperCase() });
    if (product.specifications?.length > 0) product.specifications.forEach((spec: any) => productDetails.push({ key: spec.key, value: spec.value }));
    if (product.material?.length > 0) productDetails.push({ key: 'Material', value: product.material.join(', ') });
    if (product.weight && String(product.weight).trim()) productDetails.push({ key: 'Weight', value: String(product.weight) });
    if (product.colors?.length > 0) productDetails.push({ key: 'Color', value: product.colors.join(', ') });
    if (product.sizes?.length > 0) productDetails.push({ key: 'Size', value: product.sizes.join(', ') });
    if (productDetails.length === 0) {
        productDetails.push({ key: 'Category', value: product.category?.name || 'General' });
        productDetails.push({ key: 'Stock', value: product.stock > 0 ? `${product.stock} available` : 'Out of Stock' });
    }

    // Daraz-style key specifications (only rows with a value)
    const keySpecs: { label: string; value: string }[] = [];
    if (product.brand) keySpecs.push({ label: 'Brand', value: String(product.brand) });
    if (product.model) keySpecs.push({ label: 'Model', value: String(product.model) });
    if (product.weight) keySpecs.push({ label: 'Weight', value: `${product.weight}` });
    // Box Size as "Length × Width × Height cm" from dimensions; fall back to the
    // legacy free-text boxSize string when no real dimensions are set.
    const dims = product.dimensions || {};
    const dimL = Number(dims.length) || 0;
    const dimW = Number(dims.width) || 0;
    const dimH = Number(dims.height) || 0;
    const hasDimensions = dimL > 0 || dimW > 0 || dimH > 0;
    if (hasDimensions) {
        keySpecs.push({ label: 'Box Size', value: `${dimL} × ${dimW} × ${dimH} cm` });
    } else if (product.boxSize && String(product.boxSize).trim()) {
        keySpecs.push({ label: 'Box Size', value: String(product.boxSize) });
    }
    // "Inside the Box" may be a string or an array of items
    const insideTheBoxItems: string[] = Array.isArray(product.insideTheBox)
        ? product.insideTheBox.filter((x: any) => x && String(x).trim())
        : (product.insideTheBox && String(product.insideTheBox).trim() ? [String(product.insideTheBox)] : []);
    const hasSpecsSection = keySpecs.length > 0 || insideTheBoxItems.length > 0;

    const getColorHex = (colorName: string) => {
        const map: Record<string, string> = { red: '#FF0000', orange: '#FF8C00', yellow: '#FFD700', green: '#00C853', blue: '#2196F3', black: '#000000', white: '#FFFFFF', pink: '#FF69B4', purple: '#9C27B0', brown: '#795548', gray: '#9E9E9E', grey: '#9E9E9E', navy: '#001F3F', teal: '#009688', maroon: '#800000', olive: '#808000', cyan: '#00BCD4', lime: '#76FF03', coral: '#FF7F50', gold: '#FFD700', silver: '#C0C0C0', beige: '#F5F5DC', cream: '#FFFDD0', khaki: '#F0E68C' };
        return map[colorName.toLowerCase()] || colorName;
    };

    const handleColorSelect = (colorName: string) => {
        if (selectedColor === colorName) { setSelectedColor(''); return; }
        setSelectedColor(colorName);
        if (selectedSize && hasVariants) {
            const sizesForNewColor = variants.filter((v: any) => v.color === colorName).map((v: any) => v.size).filter(Boolean);
            if (!sizesForNewColor.includes(selectedSize)) setSelectedSize('');
        }
        const colorImgs = colorImageMap[colorName];
        if (colorImgs?.length > 0) { const idx = allImages.indexOf(colorImgs[0]); if (idx >= 0) setSelectedImage(idx); }
    };

    const handleImageSelect = (imgIdx: number) => {
        setSelectedImage(imgIdx);
        const imgUrl = allImages[imgIdx];
        if (imgUrl && imageToColorMap[imgUrl]) setSelectedColor(imageToColorMap[imgUrl]);
    };

    const handleSizeSelect = (size: string) => {
        if (selectedSize === size) { setSelectedSize(''); return; }
        setSelectedSize(size);
    };

    return (
        <>
            <div style={{ minHeight: '100vh', background: '#fff' }}>
                <div className="container mx-auto px-2 sm:px-4 pb-8" style={{ paddingTop: '32px' }}>

                    {/* ── Fullscreen Modal ── */}
                    {isFullscreen && (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                            onClick={() => { setIsFullscreen(false); setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }}>
                            <button onClick={() => { setIsFullscreen(false); setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }}
                                style={{ position: 'absolute', top: '1rem', right: '1rem', width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                                <LuX size={22} />
                            </button>
                            {allImages.length > 1 && (
                                <div className="pd-zoom-thumbs" style={{ position: 'absolute', left: '11rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 10 }}>
                                    {allImages.map((img, idx) => (
                                        <button key={idx} onClick={(e) => { e.stopPropagation(); handleImageSelect(idx); setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }}
                                            style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '6px', overflow: 'hidden', border: selectedImage === idx ? '2px solid #fff' : '2px solid rgba(255,255,255,0.2)', opacity: selectedImage === idx ? 1 : 0.6, cursor: 'pointer', background: 'transparent', padding: 0, transform: selectedImage === idx ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.2s ease' }}>
                                            <SmartImage src={img} alt="" fill sizes="56px" className="object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '12px' }} onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => { if (selectedImage > 0) { setSelectedImage(p => p - 1); setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); } }} disabled={selectedImage === 0}
                                    style={{ background: selectedImage === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', cursor: selectedImage === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: selectedImage === 0 ? 0.3 : 1 }}>
                                    <LuChevronLeft size={24} color="#fff" />
                                </button>
                                <div style={{ position: 'relative', width: 'min(92vh, 90vw)', height: 'min(92vh, 90vw)', flexShrink: 0, overflow: 'hidden', borderRadius: '6px' }}
                                    onMouseDown={(e) => { if (zoomLevel > 1) { e.preventDefault(); isDraggingRef.current = true; hasDraggedRef.current = false; dragStartRef.current = { x: e.clientX - panOffsetRef.current.x, y: e.clientY - panOffsetRef.current.y }; } }}
                                    onMouseMove={(e) => { if (isDraggingRef.current && zoomLevel > 1) { hasDraggedRef.current = true; const o = { x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y }; panOffsetRef.current = o; setPanOffset({ ...o }); } }}
                                    onMouseUp={() => { isDraggingRef.current = false; }}
                                    onMouseLeave={() => { isDraggingRef.current = false; }}>
                                    <img src={allImages[selectedImage] || allImages[0]} alt={product.name} draggable={false}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px', transition: 'transform 0.1s ease', transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`, cursor: zoomLevel > 1 ? 'grab' : 'zoom-in', background: '#111', userSelect: 'none', transformOrigin: 'center center' }}
                                        onClick={(e) => { if (hasDraggedRef.current) { hasDraggedRef.current = false; return; } e.stopPropagation(); if (zoomLevel > 1) { setZoomLevel(1); const r = { x: 0, y: 0 }; panOffsetRef.current = r; setPanOffset(r); } else { setZoomLevel(1.8); } }}
                                        onWheel={(e) => { e.stopPropagation(); setZoomLevel(prev => { const n = Math.max(1, Math.min(2.5, prev + (e.deltaY < 0 ? 0.15 : -0.15))); if (n <= 1) { const r = { x: 0, y: 0 }; panOffsetRef.current = r; setPanOffset(r); } return n; }); }}
                                    />
                                    <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: '13px', fontWeight: 600, background: 'rgba(0,0,0,0.55)', padding: '4px 14px', borderRadius: '20px', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                                        {selectedImage + 1} / {allImages.length}
                                    </div>
                                </div>
                                <button onClick={() => { if (selectedImage < allImages.length - 1) { setSelectedImage(p => p + 1); setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); } }} disabled={selectedImage === allImages.length - 1}
                                    style={{ background: selectedImage === allImages.length - 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', cursor: selectedImage === allImages.length - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: selectedImage === allImages.length - 1 ? 0.3 : 1 }}>
                                    <LuChevronRight size={24} color="#fff" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Breadcrumb ── */}
                    <nav className="pd-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#9ca3af', padding: '4px 2px 10px', flexWrap: 'nowrap', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                        <Link href="/" style={{ color: '#9ca3af', textDecoration: 'none', flexShrink: 0 }}>Home</Link>
                        {product.category?.name && (<>
                            <LuChevronRight size={12} style={{ flexShrink: 0, color: '#cbd5e1' }} />
                            <Link href={`/products?category=${product.category._id}`} style={{ color: '#9ca3af', textDecoration: 'none', flexShrink: 0 }}>{product.category.name}</Link>
                        </>)}
                        <LuChevronRight size={12} style={{ flexShrink: 0, color: '#cbd5e1' }} />
                        <span style={{ color: '#555', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{product.name?.slice(0, 45)}{product.name?.length > 45 ? '...' : ''}</span>
                    </nav>

                    {/* ── TOP: 3-column ── */}
                    <div className="pd-top-grid" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>

                        {/* ════ COLUMN 1 — Gallery (~50%) ════ */}
                        <div className="pd-col-gallery" style={{ flex: '0 0 50%', maxWidth: '50%', display: 'flex', gap: '20px' }}>
                            {/* Thumbnails (Left) */}
                            <div style={{ display: 'flex', flexDirection: 'column', width: '120px', flexShrink: 0, justifyContent: 'center', gap: '8px', maxHeight: '100%' }}>
                                {allImages.length > 4 && (
                                    <button onClick={() => { if (colorSwatchRef.current) colorSwatchRef.current.scrollBy({ top: -140, behavior: 'smooth' }); }} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer', padding: '4px', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', flexShrink: 0 }}>
                                        <LuChevronUp size={18} />
                                    </button>
                                )}
                                
                                <div ref={colorSwatchRef} className="no-scrollbar pd-thumb-strip" style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: allImages.length > 4 ? 'auto' : 'visible', flex: allImages.length > 4 ? 1 : 'none', scrollBehavior: 'smooth', justifyContent: 'flex-start', height: allImages.length > 4 ? 0 : 'auto', minHeight: 0 }}>
                                    {allImages.map((img: string, idx: number) => (
                                        <button key={idx} onClick={() => handleImageSelect(idx)} onMouseEnter={() => handleImageSelect(idx)}
                                            style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0, border: selectedImage === idx ? '1px solid #111' : '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s ease', overflow: 'hidden', padding: 0, background: '#fff' }}>
                                            <SmartImage src={img} alt={`Product ${idx + 1}`} fill sizes="120px" className="object-cover" />
                                        </button>
                                    ))}
                                </div>

                                {allImages.length > 4 && (
                                    <button onClick={() => { if (colorSwatchRef.current) colorSwatchRef.current.scrollBy({ top: 140, behavior: 'smooth' }); }} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer', padding: '4px', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', flexShrink: 0 }}>
                                        <LuChevronDown size={18} />
                                    </button>
                                )}
                            </div>

                            {/* Main Image (Right) */}
                            <div className="pd-main-image-box" style={{ flex: 1, position: 'relative', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                                <div style={{ width: '100%', height: '100%', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }} onClick={() => setIsFullscreen(true)}>
                                    <SmartImage src={allImages[selectedImage] || allImages[0]} alt={product.name}
                                        fill sizes="(max-width: 1024px) 100vw, 45vw"
                                        className="object-cover"
                                    />
                                    <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'var(--color-primary)', borderRadius: '50%', padding: '7px', color: '#fff', opacity: 0, transition: 'opacity 0.3s' }} className="zoom-indicator">
                                        <LuZoomIn size={16} />
                                    </div>
                                    {offerDisplay.offerActive && offerDisplay.discount > 0 && (
                                        <div className="discount-badge" style={{ position: 'absolute', top: '10px', left: '10px', background: 'var(--color-primary)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '9999px', zIndex: 2 }}>
                                            -{offerDisplay.discount}% Off
                                        </div>
                                    )}
                                    {product.stock <= 5 && product.stock > 0 && (
                                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#f59e0b', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '9999px', zIndex: 2 }} className="animate-pulse">
                                            Only {product.stock} left!
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ════ COLUMN 2 — Info (~50%) ════ */}
                        <div className="pd-col-info" style={{ flex: '0 0 50%', maxWidth: '50%', background: '#fff', padding: '0 10px' }}>
                            {/* Title */}
                            <h1 className="pd-title" style={{ fontSize: '17px', fontWeight: 600, color: '#222', margin: '0 0 10px', lineHeight: 1.45 }}>{product.name}</h1>
                            {product.tagline && <p style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 500, margin: '0 0 8px' }}>{product.tagline}</p>}

                            {/* Brand badge */}
                            {product.brand && (
                                <Link href={`/products?search=${encodeURIComponent(product.brand)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eef0f2', color: '#374151', fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '6px', textDecoration: 'none', marginBottom: '10px' }}>
                                    Brand: {product.brand} <LuChevronRight size={12} />
                                </Link>
                            )}

                            {/* Sold · seller · rating */}
                            <div className="pd-stats-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', fontSize: '13px', color: '#777', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span>{formatCompact(product.soldCount || product.totalSold || 0)}+ sold</span>
                                    {product.brand && (<>
                                        <span style={{ color: '#e5e7eb' }}>|</span>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            Sourced from <span style={{ fontWeight: 700, color: '#374151' }}>{product.brand}</span>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#4a1a7c', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '9999px' }}>★ Star seller</span>
                                        </span>
                                    </>)}
                                </div>
                                <button onClick={() => setShowRatingModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#111' }}>{(product.rating || 0).toFixed(1)}</span>
                                    <div style={{ display: 'flex', gap: '1px' }}>{[1,2,3,4,5].map(s => <LuStar key={s} size={13} style={{ color: '#111', fill: s <= Math.round(product.rating || 0) ? '#111' : 'none' }} />)}</div>
                                </button>
                            </div>

                            {/* Best-selling badge */}
                            {product.category?.name && (
                                <Link href={`/products?category=${product.category._id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#0a8a00', color: '#fff', fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', textDecoration: 'none', marginBottom: '14px' }}>
                                    #1 BEST-SELLING ITEM <span style={{ fontWeight: 500 }}>in {product.category.name}</span> <LuChevronRight size={12} />
                                </Link>
                            )}

                            {/* PRICE block */}
                            {(() => {
                                // Variant pricing wins when a variant is selected; otherwise the base
                                // product price is gated by its offer-validity window.
                                const showOffer = activeVariant ? true : offerDisplay.offerActive;
                                const strikePrice = activeVariant?.originalPrice || (showOffer ? product.originalPrice : undefined);
                                const offerDiscount = activeVariant ? (activeVariant.discount || 0) : (showOffer ? offerDisplay.discount : 0);
                                return (
                            <div style={{ marginBottom: '14px' }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                                    <span className="pd-price" style={{ fontSize: '30px', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-0.5px' }}>
                                        ৳{discountedPrice.toLocaleString()}
                                    </span>
                                    {strikePrice && strikePrice > discountedPrice && (
                                        <span style={{ fontSize: '14px', color: '#9ca3af', textDecoration: 'line-through' }}>Was: ৳{strikePrice.toLocaleString()}</span>
                                    )}
                                    {offerDiscount > 0 && (
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', border: '1px solid var(--color-primary)', padding: '1px 7px', borderRadius: '4px' }}>{offerDiscount}% OFF</span>
                                    )}
                                </div>
                                {/* Lowest-price + offer-validity badges */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', border: '1px solid #f59e0b', background: '#fffbeb', padding: '2px 8px', borderRadius: '4px' }}>Lowest price in 30 days</span>
                                    {!activeVariant && offerDisplay.offerActive && offerDisplay.offerEndDate && (
                                        <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                            <LuClock size={12} /> Till {offerDisplay.offerEndDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    )}
                                </div>
                                {/* Stock & SKU */}
                                <div style={{ display: 'flex', gap: '7px', marginTop: '10px', flexWrap: 'wrap' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: displayStock > 5 ? 'rgba(34,197,94,0.08)' : displayStock > 0 ? '#fffbeb' : '#fef2f2', color: displayStock > 5 ? '#16a34a' : displayStock > 0 ? '#d97706' : '#dc2626', border: `1px solid ${displayStock > 5 ? 'rgba(34,197,94,0.2)' : displayStock > 0 ? '#fde68a' : '#fecaca'}` }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                                        {displayStock > 5 ? 'In Stock' : displayStock > 0 ? `Only ${displayStock} left` : 'Out of Stock'}
                                    </span>
                                    {product.sku && <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, background: '#f3f4f6', color: '#666' }}>SKU: {product.sku}</span>}
                                </div>
                            </div>
                                );
                            })()}

                            {/* Free shipping / credit strip */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap', background: '#fdf4ee', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#16a34a' }}><LuCircleCheck size={15} /> Free shipping</span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#16a34a' }}><LuCircleCheck size={15} /> ৳500 Credit for delay <LuChevronRight size={13} style={{ color: '#9ca3af' }} /></span>
                            </div>

                            {/* Color Family */}
                            {colorSwatches.length > 0 && (
                                <div style={{ marginBottom: '14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#888' }}>Color Family</span>
                                        {selectedColor && <span style={{ fontSize: '12px', color: '#111', fontWeight: 600 }}>{selectedColor}</span>}
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {colorSwatches.map((color: any, idx: number) => {
                                            const isAvailable = availableColorsForSize.includes(color.name);
                                            const isSelected = selectedColor === color.name;
                                            return (
                                                <button key={idx} onClick={() => handleColorSelect(color.name)} title={color.name}
                                                    style={{ width: '30px', height: '30px', background: getColorHex(color.hex || color.name), border: isSelected ? '2.5px solid var(--color-primary)' : '2px solid #e0e0e0', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.2s', boxShadow: isSelected ? '0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent)' : 'none', opacity: !isAvailable ? 0.45 : 1, position: 'relative', overflow: 'hidden', padding: 0, flexShrink: 0 }}>
                                                    {!isAvailable && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top right, transparent calc(50% - 1px), rgba(180,180,180,0.7) calc(50% - 1px), rgba(180,180,180,0.7) calc(50% + 1px), transparent calc(50% + 1px))', pointerEvents: 'none' }} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Size */}
                            {sizeList.length > 0 && (
                                <div style={{ marginBottom: '14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#888' }}>Size</span>
                                        {selectedSize && <span style={{ fontSize: '12px', color: '#111', fontWeight: 600 }}>{selectedSize}</span>}
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {sizeList.map((size: string, idx: number) => {
                                            const isAvailable = availableSizesForColor.includes(size);
                                            const isSelected = selectedSize === size;
                                            return (
                                                <button key={idx} onClick={() => isAvailable && handleSizeSelect(size)}
                                                    style={{ minWidth: '44px', height: '36px', padding: '0 12px', background: isSelected ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)' : !isAvailable ? '#f9fafb' : '#fff', color: isSelected ? 'var(--color-primary)' : !isAvailable ? '#ccc' : '#333', border: isSelected ? '2px solid var(--color-primary)' : !isAvailable ? '1px solid #eee' : '1px solid #d1d5db', borderRadius: '4px', cursor: !isAvailable ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '13px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !isAvailable ? 0.5 : 1 }}>
                                                    {size}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Quantity */}
                            <div style={{ marginBottom: '16px' }}>
                                <span style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '8px' }}>Quantity: <span style={{ fontWeight: 600, color: '#111' }}>1pc</span></span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#555' }}>Qty</span>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden', height: '40px' }}>
                                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: '38px', height: '100%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}><LuMinus size={15} /></button>
                                        <span style={{ width: '44px', textAlign: 'center', fontSize: '15px', fontWeight: 700, color: '#111', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{quantity}</span>
                                        <button onClick={() => setQuantity(quantity + 1)} style={{ width: '38px', height: '100%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}><LuPlus size={15} /></button>
                                    </div>
                                </div>
                            </div>

                            {/* Big orange Add to Cart (Temu-style) */}
                            {(() => {
                                const headlineDiscount = activeVariant ? (activeVariant.discount || 0) : (offerDisplay.offerActive ? offerDisplay.discount : 0);
                                return (
                            <button onClick={handleAddToCart} disabled={displayStock === 0}
                                style={{ width: '100%', padding: '11px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1px', background: displayStock === 0 ? '#9ca3af' : '#fb7701', border: 'none', color: '#fff', cursor: displayStock === 0 ? 'not-allowed' : 'pointer', borderRadius: '9999px', transition: 'all 0.2s', marginBottom: '10px', lineHeight: 1.2 }}>
                                <span style={{ fontSize: '16px', fontWeight: 800 }}>
                                    {addedToCart ? 'Added to cart ✓' : displayStock === 0 ? 'Out of Stock' : headlineDiscount > 0 ? `-${headlineDiscount}% now! Add to cart!` : 'Add to cart!'}
                                </span>
                                {!addedToCart && displayStock > 0 && <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.92 }}>Lowest price in half year</span>}
                            </button>
                                );
                            })()}

                            {/* Buy Now (secondary) */}
                            <button onClick={handleBuyNow} disabled={displayStock === 0}
                                style={{ width: '100%', padding: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#fff', border: '2px solid var(--color-primary)', color: 'var(--color-primary)', fontWeight: 700, fontSize: '15px', cursor: displayStock === 0 ? 'not-allowed' : 'pointer', borderRadius: '9999px', transition: 'all 0.2s', marginBottom: '18px', opacity: displayStock === 0 ? 0.5 : 1 }}>
                                <LuShoppingBag size={16} /> Buy Now
                            </button>

                            {/* Delivery card */}
                            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 14px', marginBottom: '14px' }}>
                                <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 700, color: '#16a34a', margin: '0 0 8px' }}><LuTruck size={16} /> Free shipping <LuChevronRight size={14} style={{ color: '#9ca3af' }} /></p>
                                <p style={{ fontSize: '12px', color: '#555', margin: '0 0 4px', lineHeight: 1.6 }}><span style={{ color: '#16a34a', fontWeight: 600 }}>Standard: FREE.</span> Usually ships out in 1–5 days.</p>
                                {shipsFrom && <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>Ships from {shipsFrom}</p>}
                            </div>

                            {/* Safe payments */}
                            <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#16a34a', margin: '0 0 12px' }}>
                                <LuShield size={15} /> Safe payments · Secure privacy <LuChevronRight size={13} style={{ color: '#9ca3af' }} />
                            </p>

                            {/* Order guarantee badges */}
                            <div style={{ marginBottom: '6px' }}>
                                <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#16a34a', margin: '0 0 8px' }}>
                                    <LuRefreshCw size={15} /> Order guarantee <LuChevronRight size={13} style={{ color: '#9ca3af' }} />
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {['Free returns', '৳500 Credit for delay', 'Return if item damaged', '18-day no update refund'].map((b) => (
                                        <span key={b} style={{ fontSize: '11px', fontWeight: 600, color: '#15803d', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', padding: '3px 9px', borderRadius: '6px' }}>{b}</span>
                                    ))}
                                </div>
                            </div>

                            {/* EXTRA INFO ACCORDION (Added for layout match) */}
                            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {/* Accordion 0 - Shipping & Returns */}
                                <details style={{ width: '100%' }}>
                                    <summary style={{ fontSize: '13px', fontWeight: 700, color: '#111', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', listStyle: 'none', background: '#f9fafb', padding: '12px 16px', borderRadius: '4px' }}>
                                        <LuMapPin size={14} style={{ color: '#6b7280' }} /> Shipping & Returns
                                        <LuChevronDown size={14} style={{ marginLeft: 'auto', color: '#9ca3af' }} />
                                    </summary>
                                    <div style={{ padding: '16px 4px 4px', fontSize: '12px', color: '#555', lineHeight: 1.6 }}>
                                        <p style={{ marginBottom: '8px' }}>Free shipping and returns available on all orders!</p>
                                        <p style={{ fontWeight: 600 }}>We ship all US domestic orders within <span style={{ color: '#111' }}>5-10 business days</span></p>
                                    </div>
                                </details>

                                {/* Accordion 1 - Materials */}
                                {product.materialsInfo && (
                                    <details style={{ width: '100%' }}>
                                        <summary style={{ fontSize: '13px', fontWeight: 700, color: '#111', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', listStyle: 'none', background: '#f9fafb', padding: '12px 16px', borderRadius: '4px' }}>
                                            <LuCircleCheck size={14} style={{ color: '#6b7280' }} /> Materials
                                            <LuChevronDown size={14} style={{ marginLeft: 'auto', color: '#9ca3af' }} />
                                        </summary>
                                        <div style={{ padding: '16px 4px 4px', fontSize: '12px', color: '#555', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: product.materialsInfo }} />
                                    </details>
                                )}

                                {/* Accordion 2 - Size Chart */}
                                {product.sizeChart && (
                                    <details open style={{ width: '100%' }}>
                                        <summary style={{ fontSize: '13px', fontWeight: 700, color: '#111', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', listStyle: 'none', background: '#f9fafb', padding: '12px 16px', borderRadius: '4px' }}>
                                            <LuMapPin size={14} style={{ color: '#6b7280' }} /> Size Chart
                                            <LuChevronDown size={14} style={{ marginLeft: 'auto', color: '#9ca3af' }} />
                                        </summary>
                                        <div style={{ padding: '16px 4px 4px', fontSize: '12px', color: '#555', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: product.sizeChart }} />
                                    </details>
                                )}

                                {/* Accordion 3 - Care Instructions */}
                                {product.careInstructions && (
                                    <details style={{ width: '100%' }}>
                                        <summary style={{ fontSize: '13px', fontWeight: 700, color: '#111', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', listStyle: 'none', background: '#f9fafb', padding: '12px 16px', borderRadius: '4px' }}>
                                            <LuHeart size={14} style={{ color: '#6b7280' }} /> Care Instructions
                                            <LuChevronDown size={14} style={{ marginLeft: 'auto', color: '#9ca3af' }} />
                                        </summary>
                                        <div style={{ padding: '16px 4px 4px', fontSize: '12px', color: '#555', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: product.careInstructions }} />
                                    </details>
                                )}

                            </div>

                            {/* SHARE (Moved outside the accordion container) */}
                            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-start' }}>
                                <button onClick={() => setShowSharePopup(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, background: '#fff', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', color: '#111', padding: '10px 20px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                                >
                                    <LuShare2 size={15} /> SHARE
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ════ BELOW: Tabs (Description & Reviews) ════ */}
                    <div style={{ marginTop: '40px' }}>
                        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', gap: '4px' }}>
                            <button onClick={() => setActiveBottomTab('description')}
                                style={{ background: activeBottomTab === 'description' ? '#fff' : '#f9fafb', color: activeBottomTab === 'description' ? 'var(--color-primary)' : '#6b7280', fontSize: '15px', fontWeight: 700, padding: '12px 32px', borderRadius: '6px 6px 0 0', border: '1px solid #e5e7eb', borderBottom: activeBottomTab === 'description' ? '2px solid var(--color-primary)' : '1px solid transparent', cursor: 'pointer', marginBottom: '-1px', transition: 'all 0.2s' }}>
                                Description
                            </button>
                            <button onClick={() => setActiveBottomTab('reviews')}
                                style={{ background: activeBottomTab === 'reviews' ? '#fff' : '#f9fafb', color: activeBottomTab === 'reviews' ? 'var(--color-primary)' : '#6b7280', fontSize: '15px', fontWeight: 700, padding: '12px 32px', borderRadius: '6px 6px 0 0', border: '1px solid #e5e7eb', borderBottom: activeBottomTab === 'reviews' ? '2px solid var(--color-primary)' : '1px solid transparent', cursor: 'pointer', marginBottom: '-1px', transition: 'all 0.2s' }}>
                                Reviews ({reviews?.length || product.reviewCount || 0})
                            </button>
                        </div>
                        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderTop: 'none', padding: '24px', position: 'relative' }}>
                            
                            {/* ── DESCRIPTION CONTENT ── */}
                            <div style={{ display: activeBottomTab === 'description' ? 'block' : 'none' }}>
                                <div style={{ maxHeight: detailsExpanded ? 'none' : '600px', overflow: 'hidden', position: 'relative' }}>
                                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#111', margin: '0 0 16px' }}>About this item</h3>
                                {/* ── Highlights ── */}
                                {product.highlights?.length > 0 && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                            <span style={{ width: '3px', height: '16px', background: 'var(--color-primary)', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
                                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111', margin: 0 }}>Highlights</h3>
                                        </div>
                                        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {product.highlights.map((h: string, i: number) => (
                                                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#444', lineHeight: 1.5 }}>
                                                    <LuCircleCheck size={14} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
                                                    <span>{h}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {/* ── Specifications (Daraz-style) ── */}
                                {hasSpecsSection && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                            <span style={{ width: '3px', height: '16px', background: 'var(--color-primary)', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
                                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111', margin: 0 }}>Specifications</h3>
                                        </div>

                                        {keySpecs.length > 0 && (
                                            <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden', marginBottom: insideTheBoxItems.length > 0 ? '16px' : 0 }}>
                                                {keySpecs.map((spec, i) => (
                                                    <div key={spec.label} style={{ display: 'flex', fontSize: '13px', borderBottom: i < keySpecs.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                                                        <span style={{ flex: '0 0 32%', padding: '10px 14px', background: '#f8f9fa', fontWeight: 600, color: '#555', borderRight: '1px solid #f0f0f0' }}>{spec.label}</span>
                                                        <span style={{ flex: 1, padding: '10px 14px', color: '#374151' }}>{spec.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Inside the Box */}
                                        {insideTheBoxItems.length > 0 && (
                                            <div>
                                                <p style={{ fontSize: '12px', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>What's in the Box</p>
                                                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    {insideTheBoxItems.map((item, i) => (
                                                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#444', lineHeight: 1.5 }}>
                                                            <LuCircleCheck size={14} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
                                                            <span>{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── Description ── */}
                                {product.description ? (
                                    <div style={{ fontSize: '14px', color: '#444', lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: product.description }} />
                                ) : (
                                    !hasSpecsSection && <p style={{ fontSize: '13px', color: '#aaa', textAlign: 'center', padding: '20px 0' }}>No description available.</p>
                                )}

                                {/* fade overlay when collapsed */}
                                {!detailsExpanded && (
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '90px', background: 'linear-gradient(to bottom, rgba(255,255,255,0), #fff)', pointerEvents: 'none' }} />
                                )}
                            </div>
                            {(hasSpecsSection || product.description) && (
                                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                                    <button onClick={() => setDetailsExpanded(v => !v)}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#fff', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', fontWeight: 700, fontSize: '13px', cursor: 'pointer', borderRadius: '4px', padding: '8px 28px' }}>
                                        {detailsExpanded ? 'VIEW LESS' : 'VIEW MORE'} {detailsExpanded ? <LuChevronUp size={15} /> : <LuChevronDown size={15} />}
                                    </button>
                                </div>
                            )}
                            </div>
                            
                            {/* ── REVIEWS CONTENT ── */}
                            <div style={{ display: activeBottomTab === 'reviews' ? 'block' : 'none' }}>
                                <div style={{ padding: '0 0 14px', borderBottom: '1px solid #f0f0f0' }}>
                                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111', margin: 0 }}>Ratings &amp; Reviews of {product.name}</h2>
                                </div>
                                <div style={{ padding: '18px 0' }}>
                            {/* Average + breakdown */}
                            {(() => {
                                const avg = reviews.length > 0 ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length : (product.rating || 0);
                                const totalCount = reviews.length || product.reviewCount || 0;
                                return (
                                    <div className="pd-rating-summary" style={{ display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '20px', paddingBottom: '18px', borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap' }}>
                                        <div style={{ textAlign: 'center', flexShrink: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', justifyContent: 'center' }}>
                                                <span style={{ fontSize: '44px', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>{avg.toFixed(1)}</span>
                                                <span style={{ fontSize: '16px', color: '#9ca3af', fontWeight: 600 }}>/5</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '2px', marginTop: '7px', justifyContent: 'center' }}>
                                                {[1,2,3,4,5].map(s => <LuStar key={s} size={16} style={{ color: '#f59e0b', fill: s <= Math.round(avg) ? '#f59e0b' : 'none' }} />)}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>{totalCount} Rating{totalCount !== 1 ? 's' : ''}</div>
                                        </div>
                                        <div style={{ flex: 1, minWidth: '200px' }}>
                                            {[5,4,3,2,1].map(star => {
                                                const count = reviews.length > 0
                                                    ? reviews.filter((r: any) => r.rating === star).length
                                                    : (product.ratingBreakdown?.[star] || 0);
                                                const denom = reviews.length || product.reviewCount || 1;
                                                const pct = (count / denom) * 100;
                                                return (
                                                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                                        <span style={{ fontSize: '12px', color: '#9ca3af', width: '10px' }}>{star}</span>
                                                        <LuStar size={12} style={{ color: '#f59e0b', fill: '#f59e0b', flexShrink: 0 }} />
                                                        <div style={{ flex: 1, height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b', borderRadius: '4px' }} />
                                                        </div>
                                                        <span style={{ fontSize: '12px', color: '#9ca3af', width: '24px', textAlign: 'right' }}>{count}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Write Review */}
                            <div style={{ marginBottom: '18px', padding: '14px', background: '#fafafa', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                <p style={{ fontSize: '14px', fontWeight: 700, color: '#111', marginBottom: '10px' }}>Write a Review</p>
                                {isAuthenticated ? (
                                    <div>
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '10px' }}>
                                            {[1,2,3,4,5].map(star => (
                                                <button key={star} type="button" onClick={() => setCmtRating(star)} onMouseEnter={() => setCmtHoverRating(star)} onMouseLeave={() => setCmtHoverRating(0)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                                                    <LuStar size={22} style={{ color: '#f59e0b', fill: star <= (cmtHoverRating || cmtRating) ? '#f59e0b' : 'none', transition: 'fill 0.15s' }} />
                                                </button>
                                            ))}
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', marginLeft: '6px' }}>{cmtRating}/5</span>
                                        </div>
                                        <textarea value={cmtText} onChange={(e) => setCmtText(e.target.value)} placeholder="Share your experience..." rows={3}
                                            style={{ width: '100%', padding: '9px 11px', border: '1.5px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', outline: 'none', resize: 'vertical', background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' }}
                                            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'} onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                        />
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                                            {cmtSuccess && <span style={{ fontSize: '12px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}><LuCircleCheck size={12} /> Review submitted!</span>}
                                            <button onClick={async () => { if (!cmtText.trim()) return; setCmtSubmitting(true); try { await createReviewMutation({ product: product._id, rating: cmtRating, comment: cmtText.trim() }).unwrap(); setCmtText(''); setCmtRating(5); setCmtSuccess(true); setTimeout(() => setCmtSuccess(false), 3000); } catch (err: any) { alert(err?.data?.message || 'Failed to submit'); } setCmtSubmitting(false); }} disabled={cmtSubmitting || !cmtText.trim()}
                                                style={{ marginLeft: 'auto', padding: '7px 16px', borderRadius: '6px', border: 'none', background: cmtSubmitting || !cmtText.trim() ? '#e5e7eb' : 'var(--color-primary)', color: cmtSubmitting || !cmtText.trim() ? '#9ca3af' : '#fff', fontSize: '13px', fontWeight: 700, cursor: cmtSubmitting || !cmtText.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <LuSend size={12} /> {cmtSubmitting ? 'Submitting...' : 'Submit'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                                        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Please login to write a review</p>
                                        <button onClick={() => router.push('/login')} style={{ padding: '7px 20px', borderRadius: '6px', border: '2px solid var(--color-primary)', background: 'transparent', color: 'var(--color-primary)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Login to Review</button>
                                    </div>
                                )}
                            </div>

                            {/* Review list */}
                            {reviews.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                    {reviews.map((r: any, i: number) => (
                                        <div key={i} style={{ padding: '16px 0', borderBottom: i < reviews.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>
                                                        {(r.userName || r.user?.firstName || 'A').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>{r.userName || `${r.user?.firstName || ''} ${r.user?.lastName || ''}`.trim() || 'Anonymous'}</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                                            <div style={{ display: 'flex', gap: '2px' }}>
                                                                {[1,2,3,4,5].map(s => <LuStar key={s} size={11} style={{ color: s <= r.rating ? '#f59e0b' : '#d1d5db', fill: s <= r.rating ? '#f59e0b' : 'none' }} />)}
                                                            </div>
                                                            {r.isVerifiedPurchase && (
                                                                <span style={{ fontSize: '11px', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                                                                    <LuCircleCheck size={11} /> Verified Purchase
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span style={{ fontSize: '11px', color: '#9ca3af' }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
                                            </div>
                                            {r.comment && <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.6, margin: '6px 0 0', paddingLeft: '44px' }}>{r.comment}</p>}
                                            {/* review images */}
                                            {r.images?.length > 0 && (
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', paddingLeft: '44px', flexWrap: 'wrap' }}>
                                                    {r.images.map((img: string, ii: number) => (
                                                        <SmartImage key={ii} src={img} alt="review" width={60} height={60} style={{ objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                                    <LuStar size={28} style={{ color: '#e5e7eb', display: 'block', margin: '0 auto 8px' }} />
                                    <p style={{ fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>No reviews yet</p>
                                    <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '3px' }}>Be the first to review this product</p>
                                </div>
                            )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ════ BELOW: You may also like ════ */}
                    {relatedProducts.length > 0 && (
                        <div style={{ marginTop: '40px', background: '#fff', padding: '16px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ width: '3px', height: '16px', background: 'var(--color-primary)', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
                                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111', margin: 0 }}>You may also like</h2>
                                    </div>
                                    {product?.category?.name && <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px', paddingLeft: '11px' }}>More from <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{product.category.name}</span></p>}
                                </div>
                                {product?.category?._id && (
                                    <Link href={`/products?category=${product.category._id}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)', background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)', padding: '5px 12px', borderRadius: '9999px', textDecoration: 'none' }}>
                                        View All <LuChevronRight size={14} />
                                    </Link>
                                )}
                            </div>
                            <div className="pd-related-grid grid grid-cols-4 gap-2 overflow-hidden">
                                {relatedProducts.slice(0, 4).map((item: any) => (
                                    <NewProductCard key={item._id} product={{ id: item._id, slug: item.slug, name: item.name, image: item.thumbnail, price: item.discount > 0 ? item.price - (item.price * item.discount) / 100 : item.price, originalPrice: item.originalPrice, mrp: item.originalPrice || item.price, discount: item.discount, offerStartDate: item.offerStartDate, offerEndDate: item.offerEndDate, rating: item.rating, reviews: item.reviewCount, categoryName: item.category?.name || product?.category?.name, priceType: item.priceType, likeCount: item.likeCount || 0, commentCount: item.commentCount || 0, shareCount: item.shareCount || 0, viewCount: item.viewCount || 0, reviewCount: item.reviewCount || 0, variants: item.variants }} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Rating Modal ── */}
                    {showRatingModal && (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowRatingModal(false)}>
                            <div style={{ background: '#fff', borderRadius: '6px', maxWidth: '480px', width: '100%', maxHeight: '80vh', overflowY: 'auto', padding: '22px', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => setShowRatingModal(false)} style={{ position: 'absolute', top: '12px', right: '12px', width: '30px', height: '30px', borderRadius: '50%', background: '#f3f4f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <LuX size={15} />
                                </button>
                                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 14px', color: '#111' }}>Ratings & Reviews</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px', padding: '14px', background: '#f9fafb', borderRadius: '6px' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '34px', fontWeight: 800, color: '#111' }}>{product.rating?.toFixed(1) || '0.0'}</div>
                                        <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', marginTop: '4px' }}>
                                            {[1,2,3,4,5].map(star => <LuStar key={star} size={13} style={{ color: '#f59e0b', fill: star <= Math.round(product.rating || 0) ? '#f59e0b' : 'none' }} />)}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px' }}>{reviews.length || product.reviewCount || 0} ratings</div>
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {[5,4,3,2,1].map(star => {
                                            const count = reviews.filter((r: any) => r.rating === star).length;
                                            const pct = Math.round((count / (reviews.length || 1)) * 100);
                                            return (
                                                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px' }}>
                                                    <span style={{ width: '12px', fontWeight: 600, color: '#555' }}>{star}</span>
                                                    <LuStar size={10} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                                                    <div style={{ flex: 1, height: '7px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b', borderRadius: '3px' }} />
                                                    </div>
                                                    <span style={{ width: '28px', textAlign: 'right', color: '#9ca3af', fontSize: '11px' }}>{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {reviews.length > 0 ? reviews.map((review: any, idx: number) => (
                                        <div key={idx} style={{ padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                                            <div style={{ display: 'flex', gap: '2px', marginBottom: '5px' }}>
                                                {[1,2,3,4,5].map(star => <LuStar key={star} size={10} style={{ color: '#f59e0b', fill: star <= (review.rating || 0) ? '#f59e0b' : 'none' }} />)}
                                            </div>
                                            {review.comment && <p style={{ fontSize: '12px', color: '#555', margin: 0, lineHeight: 1.6 }}>{review.comment}</p>}
                                        </div>
                                    )) : (
                                        <div style={{ textAlign: 'center', padding: '18px', color: '#9ca3af', fontSize: '13px' }}>No reviews yet. Be the first to review!</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <style>{`
                div:hover > .zoom-indicator { opacity: 1 !important; }
                div:hover > .discount-badge { opacity: 1 !important; }
                .pd-thumb-strip::-webkit-scrollbar { display: none; }
                .pd-thumb-strip { -ms-overflow-style: none; scrollbar-width: none; }
                .pd-breadcrumb::-webkit-scrollbar { display: none; }

                /* Tablet: gallery on top, info + delivery side-by-side */
                @media (max-width: 1023px) {
                    .pd-top-grid { flex-wrap: wrap !important; }
                    .pd-col-gallery { flex: 0 0 100% !important; max-width: 100% !important; }
                    .pd-col-info { flex: 1 1 55% !important; max-width: none !important; }
                    .pd-col-delivery { flex: 1 1 40% !important; max-width: none !important; }
                }
                /* Mobile: full stack */
                @media (max-width: 767px) {
                    .pd-top-grid { flex-direction: column !important; gap: 10px !important; }
                    .pd-col-gallery, .pd-col-info, .pd-col-delivery { flex: 0 0 100% !important; max-width: 100% !important; width: 100% !important; }
                    .pd-breadcrumb { font-size: 11px !important; gap: 4px !important; -ms-overflow-style: none !important; scrollbar-width: none !important; }
                    .pd-stats-row { gap: 8px !important; flex-wrap: wrap !important; font-size: 12px !important; }
                    .pd-related-grid { grid-template-columns: repeat(2, 1fr) !important; }
                    .pd-title { font-size: 16px !important; }
                    .pd-price { font-size: 22px !important; }
                    .pd-rating-summary { gap: 18px !important; }
                    .pd-zoom-thumbs { display: none !important; }
                }
                @media (max-width: 480px) {
                    .pd-rating-summary { flex-direction: column !important; align-items: stretch !important; }
                }
            `}</style>

                    {/* ── Share Popup ── */}
                    {showSharePopup && (() => {
                        const productUrl = typeof window !== 'undefined' ? window.location.href : '';
                        const shareText = `${product.name} - Tk.${product.price}`;
                        const shareLinks = [
                            { name: 'Facebook', icon: FaFacebookF, color: '#1877F2', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${encodeURIComponent(shareText)}` },
                            { name: 'WhatsApp', icon: FaWhatsapp, color: '#25D366', url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n' + productUrl)}` },
                            { name: 'Messenger', icon: FaFacebookMessenger, color: '#0078FF', url: `https://www.facebook.com/dialog/send?link=${encodeURIComponent(productUrl)}&app_id=966242223397117&redirect_uri=${encodeURIComponent(productUrl)}` },
                            { name: 'X', icon: FaXTwitter, color: '#000000', url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(shareText)}` },
                            { name: 'Telegram', icon: FaTelegramPlane, color: '#0088cc', url: `https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(shareText)}` },
                            { name: 'LinkedIn', icon: FaLinkedinIn, color: '#0A66C2', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(productUrl)}` },
                            { name: 'Pinterest', icon: FaPinterestP, color: '#E60023', url: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(productUrl)}&media=${encodeURIComponent(allImages[0])}&description=${encodeURIComponent(shareText)}` },
                            { name: 'Instagram', icon: FaInstagram, color: '#E1306C', url: `https://www.instagram.com/` },
                            { name: 'TikTok', icon: FaTiktok, color: '#000000', url: `https://www.tiktok.com/` },
                            { name: 'Email', icon: FaEnvelope, color: '#555555', url: `mailto:?subject=${encodeURIComponent(product.name)}&body=${encodeURIComponent(shareText + '\n\n' + productUrl)}` },
                        ];
                        return (
                            <div className='fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4' onClick={() => setShowSharePopup(false)}>
                                <div className='bg-white rounded-md w-full max-w-[600px] max-h-[88vh] flex flex-col overflow-hidden shadow-2xl' onClick={(e) => e.stopPropagation()}>
                                    <div className='flex items-center justify-between px-4 py-2.5 border-b border-gray-200 shrink-0'>
                                        <h3 className='text-[15px] font-bold text-gray-900 truncate pr-4'>{product.name}</h3>
                                        <button onClick={() => setShowSharePopup(false)} className='w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 shrink-0'><LuX size={18} /></button>
                                    </div>
                                    <div className='shrink-0 border-b border-gray-200'>
                                        <div className='relative w-full h-[240px] bg-gray-50'>
                                            <SmartImage src={allImages[0]} alt={product.name} fill sizes="600px" className='object-contain' />
                                        </div>
                                    </div>
                                    <div className='px-4 pt-3 pb-1'><p className='text-[13px] font-bold text-gray-900'>Share With</p></div>
                                    <div className='px-4 py-2 overflow-y-auto flex-1'>
                                        <div className='grid grid-cols-5 gap-3'>
                                            {shareLinks.map((link) => (
                                                <a key={link.name} href={link.url} target='_blank' rel='noopener noreferrer' className='flex flex-col items-center gap-1.5 py-2 rounded-md hover:bg-gray-50 transition-colors'>
                                                    <div className='w-10 h-10 rounded-full flex items-center justify-center text-white' style={{ background: link.color }}>
                                                        <link.icon size={16} />
                                                    </div>
                                                    <span className='text-[10px] text-gray-500 font-medium'>{link.name}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                    <div className='px-4 py-3 border-t border-gray-100 shrink-0'>
                                        <div className='flex items-center bg-gray-100 rounded-md overflow-hidden'>
                                            <input type='text' value={productUrl} readOnly className='flex-1 bg-transparent text-xs text-gray-600 outline-none px-3 py-2.5 truncate' />
                                            <button onClick={() => { navigator.clipboard.writeText(productUrl); setShareLinkCopied(true); setTimeout(() => setShareLinkCopied(false), 2000); }} className='px-4 py-2.5 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap' style={{ background: 'var(--color-primary)' }}>
                                                {shareLinkCopied ? <><LuCircleCheck size={12} /> Copied!</> : <><LuCopy size={12} /> Copy</>}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* ── Comments Modal ── */}
                    {showCommentsModal && product && (
                        <CommentsPopup productId={product._id} productName={product.name} productImage={allImages[0]} onClose={() => setShowCommentsModal(false)} />
                    )}

                    {/* ── Download Modal ── */}
                    {showDownloadModal && (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} onClick={() => setShowDownloadModal(false)}>
                            <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '6px', padding: '20px', maxWidth: '560px', width: '100%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111', margin: 0, display: 'flex', alignItems: 'center', gap: '7px' }}>
                                        <LuDownload size={15} /> Download Images
                                    </h3>
                                    <button onClick={() => setShowDownloadModal(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LuX size={15} /></button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                    {allImages.map((img: string, idx: number) => (
                                        <div key={idx} onClick={async () => { try { const res = await fetch(img); const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${product.name || 'product'}-image-${idx + 1}.jpg`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); } catch { window.open(img, '_blank'); } }}
                                            style={{ aspectRatio: '1/1', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer', border: '2px solid #e5e7eb', position: 'relative', transition: 'all 0.2s' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; (e.currentTarget.querySelector('.dl-overlay') as HTMLElement).style.opacity = '1'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; (e.currentTarget.querySelector('.dl-overlay') as HTMLElement).style.opacity = '0'; }}>
                                            <SmartImage src={img} alt={`Image ${idx + 1}`} fill sizes="150px" className="object-cover" />
                                            <div className="dl-overlay" style={{ position: 'absolute', inset: 0, background: 'color-mix(in srgb, var(--color-primary) 50%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                                                <LuDownload size={22} color="#fff" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Inquiry Modal ── */}
                    {showInquiryModal && (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} onClick={() => { setShowInquiryModal(false); setInquirySuccess(false); }}>
                            <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '6px', padding: '20px', maxWidth: '460px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111', margin: 0, display: 'flex', alignItems: 'center', gap: '7px' }}><LuMessageSquare size={15} /> Send Inquiry</h3>
                                    <button onClick={() => { setShowInquiryModal(false); setInquirySuccess(false); }} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LuX size={15} /></button>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', padding: '10px', background: '#f9fafb', borderRadius: '6px', marginBottom: '14px' }}>
                                    <SmartImage src={product.thumbnail} alt={product.name} width={52} height={52} style={{ objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                                    <div>
                                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#111', margin: '0 0 3px', lineHeight: 1.3 }}>{product.name}</p>
                                        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>৳{discountedPrice.toLocaleString()}</p>
                                    </div>
                                </div>
                                {inquirySuccess ? (
                                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                                        <LuCircleCheck size={44} color="var(--color-primary)" style={{ display: 'block', margin: '0 auto 10px' }} />
                                        <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '4px' }}>Inquiry Sent!</p>
                                        <p style={{ fontSize: '13px', color: '#6b7280' }}>{"We'll get back to you soon."}</p>
                                    </div>
                                ) : (
                                    <form onSubmit={async (e) => { e.preventDefault(); if (!inquiryName.trim() || !inquiryContact.trim() || !inquiryPhone.trim() || !inquiryMessage.trim()) return; setInquirySubmitting(true); try { await createInquiry({ product: product._id, name: inquiryName.trim(), phone: inquiryPhone.trim(), email: inquiryContact.trim(), message: inquiryMessage.trim() }).unwrap(); setInquirySuccess(true); setInquiryName(''); setInquiryContact(''); setInquiryPhone(''); setInquiryMessage(''); } catch (err) { console.error(err); } finally { setInquirySubmitting(false); } }}>
                                        {[
                                            { label: 'Your Name *', value: inquiryName, setter: setInquiryName, type: 'text', placeholder: 'Enter your name' },
                                            { label: 'Email Address *', value: inquiryContact, setter: setInquiryContact, type: 'email', placeholder: 'name@example.com' },
                                            { label: 'Phone Number *', value: inquiryPhone, setter: setInquiryPhone, type: 'tel', placeholder: '01XXXXXXXXX' },
                                        ].map(({ label, value, setter, type, placeholder }) => (
                                            <div key={label} style={{ marginBottom: '10px' }}>
                                                <label style={{ fontSize: '12px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '4px' }}>{label}</label>
                                                <input value={value} onChange={(e) => setter(e.target.value)} placeholder={placeholder} required type={type}
                                                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #e5e7eb', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                                                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'} onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                                                />
                                            </div>
                                        ))}
                                        <div style={{ marginBottom: '14px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '4px' }}>Your Query *</label>
                                            <textarea value={inquiryMessage} onChange={(e) => setInquiryMessage(e.target.value)} placeholder="Write your question..." required rows={4}
                                                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #e5e7eb', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                                                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'} onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                                            />
                                        </div>
                                        <button type="submit" disabled={inquirySubmitting}
                                            style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer', opacity: inquirySubmitting ? 0.7 : 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            {inquirySubmitting ? 'Submitting...' : 'Submit Inquiry'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

// Compact sold-count formatter: 400000 → "400K", 1500000 → "1.5M".
function formatCompact(n: number): string {
    if (!n || n < 1000) return String(n || 0);
    if (n < 1_000_000) {
        const k = n / 1000;
        return `${k % 1 === 0 ? k : k.toFixed(1)}K`;
    }
    const m = n / 1_000_000;
    return `${m % 1 === 0 ? m : m.toFixed(1)}M`;
}

function FiShareSvg({ isLiked, likeCount }: { isLiked: boolean; likeCount: number }) {
    return (
        <>
            <LuHeart size={14} style={{ fill: isLiked ? '#ef4444' : 'none' }} />
            <span>{likeCount}</span>
        </>
    );
}
