"use client";

import React, { useState, useRef, useEffect } from 'react';
import SmartImage, { resolveImageUrl } from '@/components/shared/SmartImage';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    LuHeart, LuShoppingCart, LuMinus, LuPlus, LuCircleCheck,
    LuStar, LuX, LuZoomIn, LuCopy, LuShare2, LuDownload,
    LuChevronUp, LuChevronDown, LuMessageSquare,
    LuChevronRight, LuChevronLeft, LuSend,
    LuMapPin, LuTruck, LuRefreshCw, LuShield, LuClock, LuShoppingBag,
    LuScale, LuCamera, LuInfo, LuCheck
} from 'react-icons/lu';
import { useGetProductBySlugQuery, useGetRelatedProductsQuery, useIncrementProductStatMutation } from '@/redux/api/productApi';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import { useGetProductReviewsQuery, useCreateReviewMutation } from '@/redux/api/reviewApi';
import { useAppDispatch, useAppSelector } from '@/redux';
import { addToCart } from '@/redux/slices/cartSlice';
import { useCreateInquiryMutation } from '@/redux/api/inquiryApi';
import { useWishlist } from '@/hooks/useWishlist';
import { toast } from 'react-hot-toast';
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
    const { isAuthenticated, user } = useAppSelector((state: any) => state.auth);
    const [createInquiry] = useCreateInquiryMutation();
    const [incrementStat] = useIncrementProductStatMutation();
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const { isInWishlist, toggle: toggleWishlistItem } = useWishlist();
    const [addedToCart, setAddedToCart] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [promoCopied, setPromoCopied] = useState(false);
    const [skuCopied, setSkuCopied] = useState(false);
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
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

    const thumbStripRef = useRef<HTMLDivElement>(null);
    const relatedScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [slug]);

    const anyModalOpen = showSharePopup || showCommentsModal || showRatingModal || isFullscreen;
    useEffect(() => {
        if (anyModalOpen) { document.body.style.overflow = 'hidden'; }
        else { document.body.style.overflow = ''; }
        return () => { document.body.style.overflow = ''; };
    }, [anyModalOpen]);

    const { data: productData, isLoading, isError } = useGetProductBySlugQuery(slug as string, { skip: !slug });
    const product = productData?.data;
    const isWishlisted = product ? isInWishlist(product._id || product.id) : false;

    const { data: relatedData } = useGetRelatedProductsQuery(
        { id: product?._id, categoryId: product?.category?._id },
        { skip: !product?._id || !product?.category?._id }
    );
    const relatedProducts = relatedData?.data || [];

    const { data: siteContentRes } = useGetSiteContentQuery(undefined);
    const shipsFrom: string = siteContentRes?.data?.contact?.address || 'Dhaka, Bangladesh';

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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white text-gray-800">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex gap-3 mb-6">
                        {[70, 110, 150].map((w) => (
                            <div key={w} style={{ width: `${w}px` }} className="h-4 bg-gray-200 rounded animate-pulse" />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        <div className="lg:col-span-5 h-[460px] bg-gray-100 rounded-2xl animate-pulse border border-gray-200" />
                        <div className="lg:col-span-4 flex flex-col gap-3">
                            <div className="h-6 w-32 bg-gray-200 rounded-full animate-pulse" />
                            <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                            <div className="h-40 w-full bg-gray-100 rounded-xl animate-pulse mt-4 border border-gray-200" />
                        </div>
                        <div className="lg:col-span-3 flex flex-col gap-3">
                            <div className="h-44 bg-gray-100 rounded-2xl animate-pulse border border-gray-200" />
                            <div className="h-20 bg-gray-100 rounded-2xl animate-pulse border border-gray-200" />
                            <div className="h-40 bg-gray-100 rounded-2xl animate-pulse border border-gray-200" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isError || !product) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="text-center p-8 bg-[#f8f9fa] rounded-2xl max-w-sm w-full border border-gray-200 shadow-md">
                    <div className="text-5xl mb-3">😕</div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Product Not Found</h2>
                    <p className="text-gray-500 mb-6 text-sm">This product may have been removed or is no longer available.</p>
                    <Link href="/products" className="inline-block px-6 py-2.5 bg-[#ffdd00] text-black font-extrabold rounded-xl hover:bg-[#e6c700] transition">
                        Browse Products
                    </Link>
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
        if (hasVariants) return [...new Set(variants.filter((v: any) => v.size).map((v: any) => v.size))] as string[];
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
            return imgs.length > 0 ? imgs : baseImages;
        }
        return baseImages.length > 0 ? baseImages : ['/images/placeholder.png'];
    })();

    const offerDisplay = getDisplayPrice(product);

    const discountedPrice = (() => {
        if (activeVariant) {
            const vd = activeVariant.discount || 0;
            return vd > 0 ? activeVariant.price - (activeVariant.price * vd) / 100 : activeVariant.price;
        }
        return offerDisplay.currentPrice;
    })();

    const strikePrice = activeVariant?.originalPrice || (offerDisplay.offerActive ? product.originalPrice : (product.originalPrice > discountedPrice ? product.originalPrice : undefined));
    const discountPercent = activeVariant
        ? (activeVariant.discount || (strikePrice ? Math.round(((strikePrice - discountedPrice) / strikePrice) * 100) : 0))
        : (offerDisplay.discount || (strikePrice ? Math.round(((strikePrice - discountedPrice) / strikePrice) * 100) : 0));

    const displayStock = activeVariant ? activeVariant.stock : product.stock;

    const handleAddToCart = () => {
        if (!product) return;
        if ((colorSwatches.length > 0 && !selectedColor) || (sizeList.length > 0 && !selectedSize)) {
            const need = [colorSwatches.length > 0 && !selectedColor ? 'color' : '', sizeList.length > 0 && !selectedSize ? 'size' : ''].filter(Boolean).join(' and ');
            toast.error(`Please select ${need} first`);
            return;
        }
        const cartId = getCartId();
        if (isInCart) {
            setAddedToCart(true);
            setTimeout(() => setAddedToCart(false), 2000);
            return;
        }
        const variantImage = activeVariant?.images?.[0] || allImages[selectedImage] || product.thumbnail;
        dispatch(addToCart({
            id: cartId,
            productId: product._id,
            name: product.name,
            price: discountedPrice,
            mrp: activeVariant?.originalPrice || product.originalPrice || product.price,
            image: variantImage,
            category: product.category?.name || 'General',
            quantity,
            color: selectedColor || undefined,
            colorHex: activeVariant?.colorHex || undefined,
            size: selectedSize || undefined
        }));
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    const handleBuyNow = () => {
        if (!product || displayStock === 0) return;
        if ((colorSwatches.length > 0 && !selectedColor) || (sizeList.length > 0 && !selectedSize)) {
            const need = [colorSwatches.length > 0 && !selectedColor ? 'color' : '', sizeList.length > 0 && !selectedSize ? 'size' : ''].filter(Boolean).join(' and ');
            toast.error(`Please select ${need} before buying`);
            return;
        }
        const cartId = getCartId();
        if (!isInCart) {
            const variantImage = activeVariant?.images?.[0] || allImages[selectedImage] || product.thumbnail;
            dispatch(addToCart({
                id: cartId,
                productId: product._id,
                name: product.name,
                price: discountedPrice,
                mrp: activeVariant?.originalPrice || product.originalPrice || product.price,
                image: variantImage,
                category: product.category?.name || 'General',
                quantity,
                color: selectedColor || undefined,
                colorHex: activeVariant?.colorHex || undefined,
                size: selectedSize || undefined
            }));
        }
        router.push('/checkout');
    };

    const handleColorSelect = (colorName: string) => {
        if (selectedColor === colorName) { setSelectedColor(''); return; }
        setSelectedColor(colorName);
        if (selectedSize && hasVariants) {
            const sizesForNewColor = variants.filter((v: any) => v.color === colorName).map((v: any) => v.size).filter(Boolean);
            if (!sizesForNewColor.includes(selectedSize)) setSelectedSize('');
        }
        const colorImgs = colorImageMap[colorName];
        if (colorImgs?.length > 0) {
            const idx = allImages.indexOf(colorImgs[0]);
            if (idx >= 0) setSelectedImage(idx);
        }
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

    const scrollToSimilar = () => {
        const el = document.getElementById('this-might-also-work');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    const scrollToSpecs = () => {
        setActiveBottomTab('description');
        const el = document.getElementById('product-specs-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    const copySku = () => {
        const article = product.sku || product._id?.slice(-8) || '4514702933';
        navigator.clipboard.writeText(article);
        setSkuCopied(true);
        toast.success(`Market Article copied: ${article}`);
        setTimeout(() => setSkuCopied(false), 2000);
    };

    const copyPromo = () => {
        navigator.clipboard.writeText('HOME15C');
        setPromoCopied(true);
        toast.success('Promo code HOME15C copied!');
        setTimeout(() => setPromoCopied(false), 2000);
    };

    const scrollRelated = (direction: 'left' | 'right') => {
        if (relatedScrollRef.current) {
            const amount = direction === 'left' ? -320 : 320;
            relatedScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        }
    };

    const marketArticle = product.sku || product._id?.slice(-10) || '4514702933';
    const dims = product.dimensions || {};
    const dimL = Number(dims.length) || 0;
    const dimW = Number(dims.width) || 0;
    const dimH = Number(dims.height) || 0;
    const dimensionsText = dimL > 0 || dimW > 0 ? `${dimL || 92}×${dimW || 33} cm` : (product.boxSize || '92×33 cm');
    const maxHeightText = dimH > 0 ? `${dimH} cm` : (product.weight ? `${product.weight} kg` : '13 cm');
    const designText = product.material?.join(', ') || product.model || 'tabletop, folding';
    const colorText = selectedColor || (colorSwatches[0]?.name) || (product.colors?.[0]) || 'soft gray';

    return (
        <div className="min-h-screen bg-white text-gray-800 font-sans antialiased selection:bg-[#ffdd00] selection:text-black">
            <div className="container mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6 max-w-[1440px]">

                {/* ════════════ TOP BREADCRUMB & UTILITY ROW ════════════ */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 text-[13px] border-b border-gray-200">
                    {/* Left: Breadcrumbs */}
                    <nav className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-gray-500 no-scrollbar">
                        <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
                        <span className="text-gray-400">›</span>
                        {product.category?.name && (
                            <>
                                <Link href={`/products?category=${product.category._id}`} className="hover:text-gray-900 transition-colors">
                                    {product.category.name}
                                </Link>
                                <span className="text-gray-400">›</span>
                            </>
                        )}
                        {product.brand && (
                            <>
                                <Link href={`/products?search=${encodeURIComponent(product.brand)}`} className="hover:text-gray-900 transition-colors">
                                    {product.brand}
                                </Link>
                                <span className="text-gray-400">›</span>
                            </>
                        )}
                        <span className="text-gray-800 font-semibold truncate max-w-[280px] sm:max-w-[400px]">
                            {product.name}
                        </span>
                    </nav>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-4 text-xs font-semibold text-gray-600 shrink-0">
                        <button
                            type="button"
                            onClick={() => toast('Product added to comparison', { icon: '⚖️' })}
                            className="flex items-center gap-1.5 hover:text-gray-900 transition-colors cursor-pointer"
                        >
                            <LuScale size={15} /> Compare
                        </button>

                        <button
                            type="button"
                            onClick={() => toggleWishlistItem(product._id || product.id)}
                            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${isWishlisted ? 'text-[#ff5226]' : 'hover:text-gray-900'}`}
                        >
                            <LuHeart size={15} className={isWishlisted ? 'fill-[#ff5226]' : ''} />
                            {isWishlisted ? 'In favorites' : 'Add to favorites'}
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowSharePopup(true)}
                            className="flex items-center gap-1.5 hover:text-gray-900 transition-colors cursor-pointer"
                        >
                            <LuShare2 size={15} /> Share
                        </button>
                    </div>
                </div>

                {/* ════════════ MAIN 3-COLUMN PRODUCT SECTION ════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 pt-5 items-start">

                    {/* ────────────────── COLUMN 1: GALLERY (5 cols) ────────────────── */}
                    <div className="lg:col-span-5 flex flex-row items-start gap-3 sm:gap-4">
                        {/* Vertical Thumbnail Strip (Left) */}
                        <div className="flex flex-col items-center gap-2 w-16 sm:w-20 shrink-0">
                            {allImages.length > 4 && (
                                <button
                                    onClick={() => thumbStripRef.current?.scrollBy({ top: -110, behavior: 'smooth' })}
                                    className="w-full py-1 rounded-lg bg-[#f4f5f7] hover:bg-gray-200 text-gray-600 flex items-center justify-center transition border border-gray-200"
                                    aria-label="Scroll up"
                                >
                                    <LuChevronUp size={16} />
                                </button>
                            )}

                            <div
                                ref={thumbStripRef}
                                className="flex flex-col gap-2.5 max-h-[460px] overflow-y-auto no-scrollbar scroll-smooth w-full"
                            >
                                {allImages.map((img: string, idx: number) => {
                                    const isSelected = selectedImage === idx;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleImageSelect(idx)}
                                            onMouseEnter={() => handleImageSelect(idx)}
                                            className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#f4f5f7] p-1 transition-all shrink-0 cursor-pointer ${
                                                isSelected
                                                    ? 'ring-2 ring-gray-900 ring-offset-2 ring-offset-white scale-102 border-transparent'
                                                    : 'border border-gray-200 opacity-80 hover:opacity-100 hover:border-gray-300'
                                            }`}
                                        >
                                            <SmartImage
                                                src={img}
                                                alt={`${product.name} ${idx + 1}`}
                                                fill
                                                sizes="80px"
                                                className="object-contain p-0.5"
                                            />
                                        </button>
                                    );
                                })}
                            </div>

                            {allImages.length > 4 && (
                                <button
                                    onClick={() => thumbStripRef.current?.scrollBy({ top: 110, behavior: 'smooth' })}
                                    className="w-full py-1 rounded-lg bg-[#f4f5f7] hover:bg-gray-200 text-gray-600 flex items-center justify-center transition border border-gray-200"
                                    aria-label="Scroll down"
                                >
                                    <LuChevronDown size={16} />
                                </button>
                            )}
                        </div>

                        {/* Large Main Preview Image (Right) */}
                        <div className="relative flex-1 rounded-2xl bg-[#f4f5f7] overflow-hidden border border-gray-200 shadow-sm group">
                            {/* Top Left Watermark / Brand text */}
                            {product.brand && (
                                <div className="absolute top-3.5 left-4 z-10 pointer-events-none">
                                    <span className="text-[13px] font-bold text-gray-500 tracking-wider uppercase">
                                        {product.brand}
                                    </span>
                                </div>
                            )}

                            {/* Top Right: "Similar" Camera Button */}
                            <button
                                type="button"
                                onClick={scrollToSimilar}
                                className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 transition shadow cursor-pointer"
                                title="View similar products"
                            >
                                <LuCamera size={14} /> Similar
                            </button>

                            {/* Main Product Canvas */}
                            <div
                                className="relative w-full aspect-square flex items-center justify-center p-6 cursor-zoom-in"
                                onClick={() => setIsFullscreen(true)}
                            >
                                <SmartImage
                                    src={allImages[selectedImage] || allImages[0]}
                                    alt={product.name}
                                    fill
                                    sizes="(max-width: 1024px) 100vw, 42vw"
                                    className="object-contain transition-transform duration-300 group-hover:scale-103"
                                    priority
                                />

                                {/* Subtle zoom icon on hover */}
                                <div className="absolute bottom-3 right-3 p-2 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <LuZoomIn size={16} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ────────────────── COLUMN 2: INFO & SPECS (4 cols) ────────────────── */}
                    <div className="lg:col-span-4 flex flex-col gap-3.5 pr-0 lg:pr-2">
                        {/* Top Badges Row */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Orange/Red Deal pill: "DISCOUNTS OF THE WEEK >" */}
                            <div className="inline-flex items-center gap-1.5 bg-[#ff5226] text-white text-[11px] font-extrabold px-3 py-1 rounded-md uppercase tracking-wide shadow-xs">
                                <span>Discounts of the week</span>
                                <LuChevronRight size={13} strokeWidth={3} />
                            </div>

                            {/* White ORIGINAL pill */}
                            <div className="inline-flex items-center bg-[#1f2937] text-white text-[11px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                                ORIGINAL
                            </div>
                        </div>

                        {/* Title: BRAND > Product Name */}
                        <h1 className="text-lg sm:text-[21px] font-bold text-gray-900 leading-snug">
                            {product.brand && (
                                <span className="uppercase text-gray-500 font-extrabold mr-1.5">
                                    {product.brand} ›
                                </span>
                            )}
                            <span>{product.name}</span>
                        </h1>

                        {/* Rating & Sales Row: ★★★★★ 4.8 (100) · 873 bought */}
                        <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
                            <div className="flex items-center gap-1 text-[#ffb800]">
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <LuStar
                                            key={star}
                                            size={13}
                                            className={star <= Math.round(product.rating || 5) ? 'fill-[#ffb800] text-[#ffb800]' : 'text-gray-300'}
                                        />
                                    ))}
                                </div>
                                <span className="font-bold text-gray-900 ml-0.5">
                                    {(product.rating || 4.8).toFixed(1)}
                                </span>
                            </div>
                            <span className="text-gray-500">
                                ({reviews.length || product.reviewCount || 100})
                            </span>
                            <span className="text-gray-300">·</span>
                            <span className="text-gray-700 font-medium">
                                {formatCompact(product.soldCount || product.totalSold || 873)} bought
                            </span>
                        </div>

                        {/* Specifications List with Dotted Leader Lines */}
                        <div className="mt-2 space-y-2.5 text-xs bg-[#f4f5f7] p-3.5 rounded-xl border border-gray-200">
                            {/* Market Article / SKU */}
                            <div className="flex items-baseline">
                                <span className="text-gray-500 shrink-0">Market Article</span>
                                <span className="flex-1 mx-2 border-b border-dotted border-gray-300 mb-1" />
                                <span className="text-gray-900 font-medium flex items-center gap-1 shrink-0">
                                    {marketArticle}
                                    <button
                                        type="button"
                                        onClick={copySku}
                                        className="text-gray-400 hover:text-gray-900 p-0.5 transition cursor-pointer"
                                        title="Copy article"
                                    >
                                        {skuCopied ? <LuCheck size={12} className="text-green-600" /> : <LuCopy size={12} />}
                                    </button>
                                </span>
                            </div>

                            {/* Product Color */}
                            <div className="flex items-baseline">
                                <span className="text-gray-500 shrink-0">Product color</span>
                                <span className="flex-1 mx-2 border-b border-dotted border-gray-300 mb-1" />
                                <span className="text-gray-900 font-medium capitalize shrink-0">{colorText}</span>
                            </div>

                            {/* Design / Model */}
                            <div className="flex items-baseline">
                                <span className="text-gray-500 shrink-0">Design</span>
                                <span className="flex-1 mx-2 border-b border-dotted border-gray-300 mb-1" />
                                <span className="text-gray-900 font-medium shrink-0">{designText}</span>
                            </div>

                            {/* Dimensions */}
                            <div className="flex items-baseline">
                                <span className="text-gray-500 shrink-0">Dimensions (LxW)</span>
                                <span className="flex-1 mx-2 border-b border-dotted border-gray-300 mb-1" />
                                <span className="text-gray-900 font-medium shrink-0">{dimensionsText}</span>
                            </div>

                            {/* Maximum height / Weight */}
                            <div className="flex items-baseline">
                                <span className="text-gray-500 shrink-0">Maximum height</span>
                                <span className="flex-1 mx-2 border-b border-dotted border-gray-300 mb-1" />
                                <span className="text-gray-900 font-medium shrink-0">{maxHeightText}</span>
                            </div>
                        </div>

                        {/* Variants Selector (Color & Size) */}
                        {colorSwatches.length > 0 && (
                            <div className="mt-1 pt-2 border-t border-gray-200">
                                <span className="text-xs text-gray-600 block mb-1.5 font-medium">Choose Color:</span>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {colorSwatches.map((color: any, idx: number) => {
                                        const isSelected = selectedColor === color.name;
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handleColorSelect(color.name)}
                                                className={`text-xs px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${
                                                    isSelected
                                                        ? 'bg-gray-900 text-white border-gray-900 font-bold'
                                                        : 'bg-[#f4f5f7] text-gray-700 border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full border border-black/20"
                                                    style={{ backgroundColor: color.hex || color.name }}
                                                />
                                                {color.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {sizeList.length > 0 && (
                            <div className="mt-1">
                                <span className="text-xs text-gray-600 block mb-1.5 font-medium">Choose Size:</span>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {sizeList.map((size: string, idx: number) => {
                                        const isSelected = selectedSize === size;
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handleSizeSelect(size)}
                                                className={`text-xs px-3 py-1 rounded-lg border transition cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-[#ffdd00] text-black border-[#ffdd00] font-bold'
                                                        : 'bg-[#f4f5f7] text-gray-700 border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                {size}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* "All characteristics" Button */}
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={scrollToSpecs}
                                className="px-3.5 py-1.5 rounded-lg border border-gray-300 hover:border-gray-500 bg-[#f4f5f7] hover:bg-gray-100 text-gray-800 text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1"
                            >
                                All characteristics
                            </button>
                        </div>
                    </div>

                    {/* ────────────────── COLUMN 3: BUY BOX & SIDEBAR CARDS (3 cols) ────────────────── */}
                    {/* Different contrasting card background (#f4f5f7 / #eef0f3) so it pops beautifully on white page! */}
                    <div className="lg:col-span-3 flex flex-col gap-3">

                        {/* ── CARD 1: PRICE & ACTIONS ── */}
                        <div className="bg-[#f4f5f7] rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-col gap-3.5">
                            {/* Price Header */}
                            <div className="flex items-baseline justify-between gap-2">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-[#15803d] tracking-tight">
                                        ৳{discountedPrice.toLocaleString()}
                                    </span>
                                    <span className="text-[11px] font-bold text-green-700 px-1.5 py-0.5 bg-green-100 rounded">
                                        = Pay
                                    </span>
                                </div>

                                <div className="flex items-center gap-1.5 text-xs text-gray-500 shrink-0">
                                    {strikePrice && strikePrice > discountedPrice && (
                                        <span className="line-through text-gray-400">
                                            ৳{strikePrice.toLocaleString()}
                                        </span>
                                    )}
                                    {discountPercent > 0 && (
                                        <span className="text-xs font-bold text-green-600">
                                            -{discountPercent}%
                                        </span>
                                    )}
                                    <LuChevronRight size={14} className="text-gray-400" />
                                </div>
                            </div>

                            {/* Quantity Selector */}
                            <div className="flex items-center justify-between py-1 border-t border-gray-200 text-xs text-gray-700">
                                <span className="font-medium">Quantity</span>
                                <div className="flex items-center bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
                                    <button
                                        type="button"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 text-gray-700 cursor-pointer"
                                    >
                                        <LuMinus size={12} />
                                    </button>
                                    <span className="w-8 text-center font-bold text-gray-900 text-xs">{quantity}</span>
                                    <button
                                        type="button"
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 text-gray-700 cursor-pointer"
                                    >
                                        <LuPlus size={12} />
                                    </button>
                                </div>
                            </div>

                            {/* Buttons Row: Buy now (Dark pill) + Add to cart (Yellow pill) */}
                            <div className="flex items-center gap-2.5 pt-1">
                                <button
                                    type="button"
                                    onClick={handleBuyNow}
                                    disabled={displayStock === 0}
                                    className="flex-1 py-3 px-3 rounded-xl bg-[#2a2927] hover:bg-black active:scale-98 text-white font-bold text-xs sm:text-sm text-center transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                                >
                                    Buy now
                                </button>

                                <button
                                    type="button"
                                    onClick={handleAddToCart}
                                    disabled={displayStock === 0}
                                    className="flex-1 py-3 px-3 rounded-xl bg-[#ffdd00] hover:bg-[#ebd000] active:scale-98 text-black font-extrabold text-xs sm:text-sm text-center transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {addedToCart ? 'Added ✓' : displayStock === 0 ? 'Sold out' : 'Add to cart'}
                                </button>
                            </div>
                        </div>

                        {/* ── CARD 2: PROMO CODE ── */}
                        <div className="bg-[#f4f5f7] rounded-2xl p-3.5 border border-gray-200 shadow-sm flex items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <span className="px-2 py-1 rounded bg-white border border-gray-200 text-xs font-black text-gray-900 shrink-0 shadow-2xs">
                                    -15%
                                </span>
                                <div className="leading-tight min-w-0">
                                    <p className="text-xs font-bold text-gray-900 truncate">Promo code HOME15C</p>
                                    <p className="text-[10.5px] text-gray-500">Until 10:10 pm · Limited time</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={copyPromo}
                                className="w-8 h-8 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center transition shrink-0 cursor-pointer shadow-2xs"
                                title="Copy promo code"
                            >
                                {promoCopied ? <LuCheck size={14} className="text-green-600" /> : <LuCopy size={14} />}
                            </button>
                        </div>

                        {/* ── CARD 3: LOG IN AND IT WILL BECOME CHEAPER ── */}
                        <div className="bg-[#f4f5f7] rounded-2xl p-3.5 border border-gray-200 shadow-sm flex items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-[#ff5226] flex items-center justify-center text-white shrink-0 shadow-2xs">
                                    <span className="text-xs font-bold">👤</span>
                                </div>
                                <div className="leading-tight min-w-0">
                                    <p className="text-xs font-bold text-gray-900 truncate">
                                        {isAuthenticated ? `Welcome, ${user?.name?.split(' ')[0] || 'Member'}` : 'Log in and it will become cheaper'}
                                    </p>
                                    <p className="text-[10.5px] text-gray-500">
                                        {isAuthenticated ? 'Loyalty member perks active' : 'More discounts in the account'}
                                    </p>
                                </div>
                            </div>
                            {!isAuthenticated ? (
                                <Link
                                    href="/login"
                                    className="px-3 py-1.5 rounded-lg bg-[#2a2927] hover:bg-black text-white text-xs font-bold transition shrink-0 shadow-2xs"
                                >
                                    Login
                                </Link>
                            ) : (
                                <span className="text-[10px] font-bold text-green-700 px-2 py-1 rounded bg-green-100 border border-green-200">
                                    Active
                                </span>
                            )}
                        </div>

                        {/* ── CARD 4: MARKET DELIVERY ── */}
                        <div className="bg-[#f4f5f7] rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-col gap-2.5 text-xs">
                            <h3 className="font-bold text-gray-900 text-sm">Market Delivery</h3>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-gray-800">
                                    <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
                                    <span className="font-semibold">Tomorrow, on click ৳0</span>
                                </div>
                            </div>

                            <p className="text-gray-500 text-[11px] leading-relaxed">
                                {shipsFrom} · 15-30 minutes by courier at a convenient time
                            </p>

                            <div className="flex items-center justify-between pt-1 border-t border-gray-200 text-[11px] text-gray-600">
                                <span>14 days for return</span>
                                <Link href="/refund" className="text-gray-500 hover:text-gray-900 flex items-center gap-0.5">
                                    About returns <LuChevronRight size={12} />
                                </Link>
                            </div>

                            <div className="flex items-center gap-2 pt-1 border-t border-gray-200 text-[11px] text-gray-500">
                                <LuMapPin size={14} className="text-gray-700 shrink-0" />
                                <span className="flex-1 truncate">Please provide the address</span>
                                <LuChevronRight size={13} className="shrink-0" />
                            </div>
                        </div>

                        {/* ── CARD 5: SELLER / BRAND SHOP ── */}
                        <div className="bg-[#f4f5f7] rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-col gap-2.5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-[#ff5226] text-white flex items-center justify-center font-black text-sm shadow-2xs">
                                        M
                                    </div>
                                    <div className="leading-tight">
                                        <div className="flex items-center gap-1">
                                            <p className="font-bold text-gray-900 text-xs">Maxtop Mart</p>
                                            <LuInfo size={12} className="text-gray-400" />
                                        </div>
                                        <p className="text-[10px] text-gray-500">Official Brand Shop</p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => toast('Shop favorited!', { icon: '❤️' })}
                                    className="text-gray-400 hover:text-red-500 transition p-1 cursor-pointer"
                                    title="Favorite Shop"
                                >
                                    <LuHeart size={16} />
                                </button>
                            </div>

                            {/* Seller Stats */}
                            <div className="flex items-center justify-between text-[11px] text-gray-600 pt-1 border-t border-gray-200">
                                <span className="flex items-center gap-1 font-semibold text-gray-900">
                                    <LuStar size={11} className="fill-[#ffb800] text-[#ffb800]" /> 4.8
                                </span>
                                <span>1.2M ratings</span>
                                <span>11.7M orders</span>
                                <span>636.5K subs</span>
                            </div>
                        </div>

                        {/* ── CARD 6: PROMO AD BANNER ── */}
                        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/70 p-3.5 border border-amber-200/70 flex items-center justify-between shadow-2xs">
                            <div className="leading-tight max-w-[65%]">
                                <span className="text-[9px] uppercase tracking-wider text-amber-700 font-bold block mb-0.5">
                                    Maxtop Lifestyle
                                </span>
                                <p className="text-xs font-bold text-gray-900">Everything in order</p>
                                <p className="text-[10px] text-gray-600 mt-0.5">Premium household essentials</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-amber-200/60 flex items-center justify-center text-xl shrink-0">
                                🏠
                            </div>
                        </div>

                    </div>
                </div>

                {/* ════════════ BOTTOM SECTION 1: "This might also work" CAROUSEL ════════════ */}
                <div id="this-might-also-work" className="mt-12 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                            This might also work
                        </h2>

                        {relatedProducts.length > 4 && (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => scrollRelated('left')}
                                    className="w-8 h-8 rounded-full bg-[#f4f5f7] hover:bg-gray-200 border border-gray-200 text-gray-800 flex items-center justify-center transition cursor-pointer"
                                    aria-label="Scroll left"
                                >
                                    <LuChevronLeft size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => scrollRelated('right')}
                                    className="w-8 h-8 rounded-full bg-[#f4f5f7] hover:bg-gray-200 border border-gray-200 text-gray-800 flex items-center justify-center transition cursor-pointer"
                                    aria-label="Scroll right"
                                >
                                    <LuChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Carousel Strip */}
                    <div
                        ref={relatedScrollRef}
                        className="flex gap-3.5 overflow-x-auto pb-3 pt-1 no-scrollbar scroll-smooth"
                    >
                        {(relatedProducts.length > 0 ? relatedProducts : [1, 2, 3, 4, 5]).map((item: any, idx: number) => {
                            const isReal = typeof item === 'object' && item._id;
                            const cardSlug = isReal ? item.slug || item._id : slug;
                            const cardName = isReal ? item.name : `${product.name} (Alternative ${idx + 1})`;
                            const cardImage = isReal ? (item.thumbnail || item.images?.[0] || allImages[0]) : allImages[0];
                            const cardPrice = isReal ? (item.price || discountedPrice) : discountedPrice;
                            const cardBrand = isReal ? (item.brand || product.brand || 'MAXTOP') : (product.brand || 'MAXTOP');

                            return (
                                <Link
                                    key={isReal ? item._id : idx}
                                    href={`/product/${cardSlug}`}
                                    className="relative flex-none w-[170px] sm:w-[200px] bg-[#f4f5f7] rounded-2xl p-2.5 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 group flex flex-col"
                                >
                                    {/* Product Image Canvas */}
                                    <div className="relative w-full aspect-square rounded-xl bg-white overflow-hidden p-2 flex items-center justify-center mb-2.5 border border-gray-100">
                                        {/* Brand watermark top left */}
                                        <span className="absolute top-2 left-2 text-[10px] font-bold text-gray-400 uppercase z-10">
                                            {cardBrand}
                                        </span>

                                        {/* Heart icon top right */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (isReal) toggleWishlistItem(item._id);
                                            }}
                                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80 hover:bg-white border border-gray-200 shadow-2xs flex items-center justify-center text-gray-600 hover:text-red-500 z-10 transition cursor-pointer"
                                        >
                                            <LuHeart size={12} />
                                        </button>

                                        <SmartImage
                                            src={cardImage}
                                            alt={cardName}
                                            fill
                                            sizes="200px"
                                            className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>

                                    {/* Card Info */}
                                    <div className="flex-1 flex flex-col justify-between">
                                        <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-black transition-colors">
                                            {cardName}
                                        </p>

                                        <div className="mt-2 flex items-baseline gap-1.5">
                                            <span className="text-sm font-extrabold text-[#15803d]">
                                                ৳{cardPrice.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* ════════════ BOTTOM SECTION 2: TABS (Description & Reviews) ════════════ */}
                <div id="product-specs-section" className="mt-12">
                    <div className="flex border-b border-gray-200 gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveBottomTab('description')}
                            className={`py-3 px-6 text-sm font-bold rounded-t-xl transition cursor-pointer ${
                                activeBottomTab === 'description'
                                    ? 'bg-[#f4f5f7] text-gray-900 border-t-2 border-[#ffdd00] border-x border-gray-200'
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            Characteristics & Description
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveBottomTab('reviews')}
                            className={`py-3 px-6 text-sm font-bold rounded-t-xl transition cursor-pointer ${
                                activeBottomTab === 'reviews'
                                    ? 'bg-[#f4f5f7] text-gray-900 border-t-2 border-[#ffdd00] border-x border-gray-200'
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            Customer Reviews ({reviews.length || product.reviewCount || 0})
                        </button>
                    </div>

                    <div className="bg-[#f4f5f7] rounded-b-2xl p-5 sm:p-7 border border-gray-200 text-gray-700 text-sm">
                        {activeBottomTab === 'description' ? (
                            <div className="space-y-6">
                                {/* Highlights */}
                                {product.highlights?.length > 0 && (
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-[#ffdd00] rounded-sm" /> Product Highlights
                                        </h3>
                                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                                            {product.highlights.map((h: string, i: number) => (
                                                <li key={i} className="flex items-start gap-2 text-gray-700">
                                                    <LuCircleCheck size={16} className="text-[#15803d] shrink-0 mt-0.5" />
                                                    <span>{h}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Full Specifications Table */}
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <span className="w-1.5 h-4 bg-[#ffdd00] rounded-sm" /> Full Specifications
                                    </h3>
                                    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-xs">
                                        {[
                                            { label: 'Market Article', val: marketArticle },
                                            { label: 'Brand', val: product.brand || 'MAXTOP' },
                                            { label: 'Model', val: product.model || product.sku || '-' },
                                            { label: 'Category', val: product.category?.name || 'General' },
                                            { label: 'Design / Material', val: designText },
                                            { label: 'Color Options', val: colorSwatches.map((c: any) => c.name).join(', ') || colorText },
                                            { label: 'Dimensions (LxWxH)', val: dimensionsText },
                                            { label: 'Weight / Height', val: maxHeightText },
                                            { label: 'Stock Status', val: displayStock > 0 ? `${displayStock} available` : 'Out of Stock' },
                                        ].map((row, i) => (
                                            <div
                                                key={row.label}
                                                className={`flex text-xs sm:text-sm py-2.5 px-4 ${
                                                    i % 2 === 0 ? 'bg-white' : 'bg-[#f4f5f7]'
                                                }`}
                                            >
                                                <span className="w-40 sm:w-56 text-gray-500 font-medium shrink-0">{row.label}</span>
                                                <span className="text-gray-900 font-semibold flex-1">{row.val}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Rich Description */}
                                {product.description && (
                                    <div className="pt-2">
                                        <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                                            <span className="w-1.5 h-4 bg-[#ffdd00] rounded-sm" /> Overview
                                        </h3>
                                        <div
                                            className="text-gray-700 leading-relaxed text-sm prose max-w-none"
                                            dangerouslySetInnerHTML={{ __html: product.description }}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Reviews Tab */
                            <div className="space-y-6">
                                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900">Ratings & Reviews</h3>
                                        <p className="text-xs text-gray-500">Feedback from verified customers</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-3xl font-black text-gray-900">
                                            {(product.rating || 4.8).toFixed(1)}
                                        </span>
                                        <div className="flex gap-0.5 text-[#ffb800]">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <LuStar key={s} size={14} className="fill-[#ffb800]" />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Write review */}
                                {isAuthenticated ? (
                                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
                                        <p className="text-xs font-bold text-gray-900">Write a Review</p>
                                        <div className="flex items-center gap-1 text-[#ffb800]">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setCmtRating(s)}
                                                    onMouseEnter={() => setCmtHoverRating(s)}
                                                    onMouseLeave={() => setCmtHoverRating(0)}
                                                    className="p-1 cursor-pointer"
                                                >
                                                    <LuStar
                                                        size={20}
                                                        className={s <= (cmtHoverRating || cmtRating) ? 'fill-[#ffb800] text-[#ffb800]' : 'text-gray-300'}
                                                    />
                                                </button>
                                            ))}
                                            <span className="text-xs font-bold text-gray-700 ml-2">{cmtRating}/5</span>
                                        </div>
                                        <textarea
                                            value={cmtText}
                                            onChange={(e) => setCmtText(e.target.value)}
                                            rows={3}
                                            placeholder="Share your experience with this item..."
                                            className="w-full bg-[#f4f5f7] border border-gray-200 rounded-lg p-2.5 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-[#ffdd00]"
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                disabled={cmtSubmitting || !cmtText.trim()}
                                                onClick={async () => {
                                                    if (!cmtText.trim()) return;
                                                    setCmtSubmitting(true);
                                                    try {
                                                        await createReviewMutation({
                                                            product: product._id,
                                                            rating: cmtRating,
                                                            comment: cmtText.trim()
                                                        }).unwrap();
                                                        setCmtText('');
                                                        toast.success('Review submitted successfully!');
                                                    } catch (err: any) {
                                                        toast.error(err?.data?.message || 'Failed to submit review');
                                                    } finally {
                                                        setCmtSubmitting(false);
                                                    }
                                                }}
                                                className="px-4 py-2 rounded-lg bg-[#ffdd00] hover:bg-[#ebd000] text-black font-bold text-xs transition cursor-pointer disabled:opacity-50"
                                            >
                                                {cmtSubmitting ? 'Submitting...' : 'Submit Review'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 bg-white rounded-xl border border-gray-200 shadow-xs">
                                        <p className="text-xs text-gray-500 mb-2">Please log in to write a review</p>
                                        <Link href="/login" className="inline-block px-4 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-bold">
                                            Login
                                        </Link>
                                    </div>
                                )}

                                {/* Reviews List */}
                                <div className="space-y-3">
                                    {reviews.length > 0 ? (
                                        reviews.map((r: any, idx: number) => (
                                            <div key={idx} className="p-3.5 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-1.5">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-bold text-gray-900">
                                                        {r.userName || r.user?.firstName || 'Verified Customer'}
                                                    </span>
                                                    <span className="text-gray-400 text-[11px]">
                                                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent'}
                                                    </span>
                                                </div>
                                                <div className="flex gap-0.5 text-[#ffb800]">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <LuStar
                                                            key={s}
                                                            size={11}
                                                            className={s <= r.rating ? 'fill-[#ffb800]' : 'text-gray-300'}
                                                        />
                                                    ))}
                                                </div>
                                                <p className="text-xs text-gray-700 leading-relaxed">{r.comment}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center py-6 text-xs text-gray-400">No reviews yet. Be the first to review!</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* ════════════ FULLSCREEN ZOOM MODAL ════════════ */}
            {isFullscreen && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
                    onClick={() => { setIsFullscreen(false); setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }}
                >
                    <button
                        onClick={() => { setIsFullscreen(false); setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer z-20"
                    >
                        <LuX size={22} />
                    </button>

                    <div className="relative w-full max-w-4xl max-h-[85vh] aspect-square flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <SmartImage
                            src={allImages[selectedImage] || allImages[0]}
                            alt={product.name}
                            fill
                            sizes="100vw"
                            className="object-contain"
                        />
                    </div>
                </div>
            )}

            {/* ════════════ SHARE POPUP MODAL ════════════ */}
            {showSharePopup && (() => {
                const productUrl = typeof window !== 'undefined' ? window.location.href : '';
                const shareText = `${product.name} - ৳${discountedPrice}`;
                const shareLinks = [
                    { name: 'Facebook', icon: FaFacebookF, color: '#1877F2', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}` },
                    { name: 'WhatsApp', icon: FaWhatsapp, color: '#25D366', url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + productUrl)}` },
                    { name: 'Messenger', icon: FaFacebookMessenger, color: '#0078FF', url: `https://www.facebook.com/dialog/send?link=${encodeURIComponent(productUrl)}` },
                    { name: 'X', icon: FaXTwitter, color: '#000000', url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}` },
                    { name: 'Telegram', icon: FaTelegramPlane, color: '#0088cc', url: `https://t.me/share/url?url=${encodeURIComponent(productUrl)}` },
                    { name: 'LinkedIn', icon: FaLinkedinIn, color: '#0A66C2', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(productUrl)}` },
                    { name: 'Email', icon: FaEnvelope, color: '#555555', url: `mailto:?subject=${encodeURIComponent(product.name)}&body=${encodeURIComponent(productUrl)}` },
                ];

                return (
                    <div
                        className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs"
                        onClick={() => setShowSharePopup(false)}
                    >
                        <div
                            className="bg-white text-gray-900 rounded-2xl w-full max-w-md overflow-hidden border border-gray-200 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                                <h3 className="text-sm font-bold truncate">Share this product</h3>
                                <button
                                    onClick={() => setShowSharePopup(false)}
                                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition cursor-pointer"
                                >
                                    <LuX size={16} />
                                </button>
                            </div>

                            <div className="p-4 grid grid-cols-4 gap-3">
                                {shareLinks.map((item) => (
                                    <a
                                        key={item.name}
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-gray-50 transition"
                                    >
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-xs"
                                            style={{ backgroundColor: item.color }}
                                        >
                                            <item.icon size={16} />
                                        </div>
                                        <span className="text-[10px] text-gray-600 font-medium">{item.name}</span>
                                    </a>
                                ))}
                            </div>

                            <div className="p-4 border-t border-gray-200 bg-[#f8f9fa]">
                                <div className="flex items-center bg-white rounded-xl overflow-hidden border border-gray-200 p-1 shadow-2xs">
                                    <input
                                        type="text"
                                        value={productUrl}
                                        readOnly
                                        className="flex-1 bg-transparent px-3 text-xs text-gray-600 outline-none truncate"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(productUrl);
                                            setShareLinkCopied(true);
                                            toast.success('Link copied to clipboard!');
                                            setTimeout(() => setShareLinkCopied(false), 2000);
                                        }}
                                        className="px-3.5 py-1.5 bg-[#ffdd00] hover:bg-[#ebd000] text-black text-xs font-bold rounded-lg transition cursor-pointer"
                                    >
                                        {shareLinkCopied ? 'Copied!' : 'Copy Link'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

function formatCompact(n: number): string {
    if (!n || n < 1000) return String(n || 0);
    if (n < 1_000_000) {
        const k = n / 1000;
        return `${k % 1 === 0 ? k : k.toFixed(1)}K`;
    }
    const m = n / 1_000_000;
    return `${m % 1 === 0 ? m : m.toFixed(1)}M`;
}
