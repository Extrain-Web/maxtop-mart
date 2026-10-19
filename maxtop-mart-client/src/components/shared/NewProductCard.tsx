"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SmartImage from '@/components/shared/SmartImage';

import {
    useGetProductReviewsQuery,
    usePublicCreateReviewMutation,
    useLikeReviewMutation,
    useReplyToReviewMutation,
    useLikeReplyMutation,
} from '@/redux/api/reviewApi';
import { useToggleWishlistMutation, useGetWishlistQuery } from '@/redux/api/userApi';
import { useAppDispatch, useAppSelector } from '@/redux';
import { addToCart } from '@/redux/slices/cartSlice';
import { toggleWishlist } from '@/redux/slices/wishlistSlice';
import { LuStar, LuX, LuCopy, LuCheck, LuSend, LuThumbsUp, LuCornerDownRight, LuHeart, LuShoppingBag, LuShoppingCart } from 'react-icons/lu';
import { getDisplayPrice } from '@/utils/offerPrice';

interface Product {
    _id?: string;
    id: string | number;
    slug?: string;
    name: string;
    image: string;
    price: number;
    originalPrice?: number;
    mrp?: number;
    discount?: number | string;
    offerStartDate?: string | Date | null;
    offerEndDate?: string | Date | null;
    rating?: number;
    reviews?: number;
    categoryName?: string;
    variants?: any[];

    priceType?: 'negotiable' | 'fixed';
    sold?: number;
    soldCount?: number;
    totalSold?: number;
    likeCount?: number;
    commentCount?: number;
    shareCount?: number;
    viewCount?: number;
    reviewCount?: number;
}

interface NewProductCardProps {
    product: Product;
}

const formatCount = (n: number): string => {
    if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K';
    return String(n);
};

const NewProductCard: React.FC<NewProductCardProps> = ({ product }) => {

    const [toggleWishlistApi] = useToggleWishlistMutation();
    const dispatch = useAppDispatch();
    const productId = String(product._id || product.id);
    const router = useRouter();

    // Extract unique colors and sizes from variants
    const colors = Array.from(new Set((product.variants || []).map(v => v.colorHex || v.color).filter(Boolean)));
    const sizes = Array.from(new Set((product.variants || []).map(v => v.size).filter(Boolean)));

    const [selectedColor, setSelectedColor] = useState<string>(colors[0] || '');
    const [selectedSize, setSelectedSize] = useState<string>(sizes[0] || '');

    // Auth + cart state
    const { isAuthenticated } = useAppSelector((state: any) => state.auth);
    const cartItems = useAppSelector((state: any) => state.cart.items);
    const isInCart = cartItems.some((item: any) => item.id === productId);

    // Wishlist state — server for logged-in users, Redux for guests
    const localWishlist = useAppSelector((state: any) => state.wishlist.items);
    const { data: serverWishlist } = useGetWishlistQuery({}, { skip: !isAuthenticated });
    const serverItems: any[] = serverWishlist?.data || [];
    const isInWishlist = isAuthenticated
        ? serverItems.some((item: any) => String(item._id || item.id) === productId)
        : localWishlist.some((item: any) => item.id === productId);
    const [wishlistAnim, setWishlistAnim] = useState(false);
    const [showAlreadyAdded, setShowAlreadyAdded] = useState(false);



    const handleWishlistToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setWishlistAnim(true);
        setTimeout(() => setWishlistAnim(false), 400);
        if (isAuthenticated) {
            try {
                await toggleWishlistApi(productId).unwrap();
            } catch (err) {
                console.error('Wishlist toggle failed:', err);
            }
        } else {
            dispatch(toggleWishlist({
                id: productId,
                name: product.name,
                price: product.price,
                mrp: product.originalPrice || product.mrp || product.price,
                image: product.image,
                category: product.categoryName || '',
                rating: product.rating || 0,
            }));
        }
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isInCart) {
            setShowAlreadyAdded(true);
            setTimeout(() => setShowAlreadyAdded(false), 1500);
            return;
        }
        dispatch(addToCart({
            id: productId,
            productId: productId,
            name: product.name,
            price: product.price,
            mrp: product.originalPrice || product.mrp || product.price,
            image: product.image,
            category: product.categoryName || 'General',
            color: selectedColor,
            size: selectedSize
        }));
    };

    const handleOrderNow = (e: React.MouseEvent) => {
        handleAddToCart(e);
        if (!isInCart) {
            router.push('/checkout');
        } else {
            router.push('/checkout');
        }
    };

    // Respect the offer-validity window: while the offer is active the card shows
    // the offer price + discount; once it expires (or before it starts) it falls
    // back to the regular price with no discount badge. With no offer dates the
    // result is unchanged from before (offerActive = true).
    const display = getDisplayPrice({
        price: product.price,
        originalPrice: product.originalPrice ?? product.mrp ?? undefined,
        discount: typeof product.discount === 'string' ? Number(product.discount) || 0 : (product.discount ?? 0),
        offerStartDate: product.offerStartDate,
        offerEndDate: product.offerEndDate,
    });
    const currentPrice = display.currentPrice;
    const oldPrice = display.originalPrice;
    const discountPercent = display.offerActive && oldPrice && oldPrice > currentPrice
        ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100)
        : 0;
    const soldCount = product.sold || product.soldCount || product.totalSold || 0;

    return (
        <>
            <div className='bg-white rounded-none p-3 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.1)] transition-all duration-300 group flex flex-col h-full border border-transparent hover:border-gray-100'>
                
                {/* Image Section */}
                <div className='bg-[#f8f9fa] rounded-none aspect-square relative overflow-hidden flex items-center justify-center mb-4'>
                    {/* Discount badge */}
                    {discountPercent > 0 && (
                        <span className='absolute top-3 left-3 z-10 bg-[#f43f5e] text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm'>
                            -{discountPercent}%
                        </span>
                    )}

                    <Link href={`/product/${product.slug || product.id}`} className='w-full h-full block relative'>
                        <SmartImage
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw'
                            className='object-cover group-hover:scale-105 transition-transform duration-500'
                        />
                    </Link>

                    {/* Right side floating icons */}
                    <div className='absolute top-3 right-3 flex flex-col gap-2 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out z-10'>
                        <button
                            onClick={handleWishlistToggle}
                            className={`w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-slate-700 hover:text-pink-500 hover:scale-110 transition-transform duration-200 ${wishlistAnim ? 'scale-125' : ''}`}
                            title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                        >
                            <LuHeart
                                size={14}
                                className="transition-colors"
                                style={{ fill: isInWishlist ? '#f43f5e' : 'none', color: isInWishlist ? '#f43f5e' : 'currentColor' }}
                            />
                        </button>
                        <button
                            onClick={handleAddToCart}
                            className='w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-slate-700 hover:text-[var(--color-primary)] hover:scale-110 transition-transform duration-200 relative'
                            title={isInCart ? 'Already in Cart' : 'Add to Cart'}
                        >
                            <LuShoppingCart size={15} />
                            {isInCart && <span className='absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full ring-2 ring-white' />}
                        </button>
                    </div>

                    {/* Bottom Order Now Button */}
                    <div className='absolute bottom-3 left-3 right-3 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out z-10'>
                        <button
                            onClick={handleOrderNow}
                            className='w-full py-2.5 bg-white text-gray-800 text-[11px] font-extrabold rounded-none shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:bg-gray-50 transition-colors duration-300 uppercase tracking-widest flex items-center justify-center gap-1.5'
                        >
                            <LuShoppingBag size={14} className="mb-0.5" /> Order Now
                        </button>
                    </div>
                </div>

                {/* Product Info */}
                <Link href={`/product/${product.slug || product.id}`} className='flex flex-col flex-1 px-1 pb-1'>
                    {/* Category */}
                    <span className='text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5'>
                        {product.categoryName || 'GENERAL'}
                    </span>
                    
                    {/* Name */}
                    <h3 className='text-[13px] font-bold text-gray-800 line-clamp-2 leading-[1.35] min-h-[2.7em] mb-2.5 group-hover:text-[var(--color-primary)] transition-colors'>
                        {product.name}
                    </h3>
                    
                    {/* Rating Stars */}
                    <div className='flex items-center gap-[3px] mb-3'>
                        {[1, 2, 3, 4, 5].map(star => (
                            <LuStar 
                                key={star} 
                                size={11} 
                                className={star <= Math.round(product.rating || 0) ? "text-[#f59e0b] fill-[#f59e0b]" : "text-gray-200 fill-gray-200"} 
                            />
                        ))}
                    </div>
                    
                    {/* Variants */}
                    {(colors.length > 0 || sizes.length > 0) && (
                        <div className="flex flex-col gap-1.5 mb-2" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                            {colors.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {colors.map((c: string) => (
                                        <button 
                                            key={c}
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedColor(c); }}
                                            className={`h-3.5 w-3.5 rounded-full ring-1 ring-offset-1 ${selectedColor === c ? 'ring-primary' : 'ring-black/10'}`}
                                            style={{ background: c }}
                                            title={c}
                                        />
                                    ))}
                                </div>
                            )}
                            {sizes.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {sizes.map((s: string) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedSize(s); }}
                                            className={`text-[9px] px-1.5 py-0.5 border rounded font-medium ${selectedSize === s ? 'border-primary text-primary bg-primary/5' : 'border-gray-200 text-gray-600'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Price */}
                    <div className='flex items-baseline gap-2 mt-auto'>
                        <span className='text-[15px] font-bold text-[#f43f5e]'>৳{currentPrice.toLocaleString()}</span>
                        {oldPrice && oldPrice > currentPrice && (
                            <span className='text-[12px] text-gray-400 line-through font-medium'>৳{oldPrice.toLocaleString()}</span>
                        )}
                    </div>
                </Link>
            </div>
        </>
    );
};


/* ═══════════════════════════════════════════════ */
/* ═══ COMMENTS POPUP — with write comment ═══ */
/* ═══════════════════════════════════════════════ */

// localStorage helpers — track which reviews/replies this device has liked
const LIKED_REVIEWS_KEY = 'maxtopmart_liked_reviews';
const LIKED_REPLIES_KEY = 'maxtopmart_liked_replies';

const getLikedSet = (key: string): Set<string> => {
    if (typeof window === 'undefined') return new Set();
    try {
        const raw = localStorage.getItem(key);
        return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
};
const addToLikedSet = (key: string, id: string) => {
    if (typeof window === 'undefined') return;
    const set = getLikedSet(key);
    set.add(id);
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
};

const CommentsPopup: React.FC<{
    productId: string;
    productName: string;
    productImage: string;
    onClose: () => void;
}> = ({ productId, productName, productImage, onClose }) => {
    const { data: reviewsData, isLoading } = useGetProductReviewsQuery({ productId });
    const [publicCreateReview] = usePublicCreateReviewMutation();
    const [likeReview] = useLikeReviewMutation();
    const [replyToReview] = useReplyToReviewMutation();
    const [likeReply] = useLikeReplyMutation();
    const reviews = reviewsData?.data || [];

    const [newComment, setNewComment] = useState('');
    const [newRating, setNewRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Like tracking (per-device via localStorage)
    const [likedReviews, setLikedReviews] = useState<Set<string>>(() => getLikedSet(LIKED_REVIEWS_KEY));
    const [likedReplies, setLikedReplies] = useState<Set<string>>(() => getLikedSet(LIKED_REPLIES_KEY));

    // Reply UI state — which review has reply box open + text
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isReplying, setIsReplying] = useState(false);

    const handleSubmitComment = async () => {
        if (!newComment.trim()) return;
        setIsSubmitting(true);
        try {
            await publicCreateReview({
                product: productId,
                rating: newRating,
                comment: newComment.trim(),
                userName: 'Anonymous'
            }).unwrap();
            setNewComment('');
            setNewRating(5);
            setSubmitSuccess(true);
            setTimeout(() => setSubmitSuccess(false), 3000);
        } catch (err) {
            console.error('Failed to submit review:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLikeReview = async (reviewId: string) => {
        if (likedReviews.has(reviewId)) return;
        addToLikedSet(LIKED_REVIEWS_KEY, reviewId);
        setLikedReviews(prev => new Set(prev).add(reviewId));
        try { await likeReview(reviewId).unwrap(); } catch (e) { console.error(e); }
    };

    const handleLikeReply = async (reviewId: string, replyId: string) => {
        const key = `${reviewId}_${replyId}`;
        if (likedReplies.has(key)) return;
        addToLikedSet(LIKED_REPLIES_KEY, key);
        setLikedReplies(prev => new Set(prev).add(key));
        try { await likeReply({ reviewId, replyId }).unwrap(); } catch (e) { console.error(e); }
    };

    const handleSubmitReply = async (reviewId: string) => {
        const text = replyText.trim();
        if (!text) return;
        setIsReplying(true);
        try {
            await replyToReview({ reviewId, text, userName: 'Anonymous' }).unwrap();
            setReplyText('');
            setReplyingTo(null);
        } catch (e) { console.error(e); }
        finally { setIsReplying(false); }
    };

    return (
        <div
            className='fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4'
            onClick={onClose}
        >
            <div
                className='bg-white rounded-lg w-full max-w-[620px] max-h-[88vh] flex flex-col overflow-hidden shadow-2xl'
                onClick={(e) => e.stopPropagation()}
                style={{ animation: 'fbModalIn 0.2s ease-out' }}
            >
                {/* ── Header ── */}
                <div className='flex items-center justify-between px-4 py-2.5 border-b border-gray-200 shrink-0'>
                    <h3 className='text-[15px] font-bold text-gray-900 truncate pr-4'>{productName}</h3>
                    <button
                        onClick={onClose}
                        className='w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors shrink-0'
                    >
                        <LuX size={18} />
                    </button>
                </div>

                {/* ── Product image — full view ── */}
                <div className='shrink-0 border-b border-gray-200'>
                    <div className='relative w-full h-[280px] bg-gray-50'>
                        <SmartImage
                            src={productImage}
                            alt={productName}
                            fill
                            sizes='620px'
                            className='object-contain'
                        />
                    </div>
                    {/* Stats bar */}
                    <div className='flex items-center justify-between px-4 py-1.5 text-xs text-gray-500'>
                        <span>{reviews.length} {reviews.length === 1 ? 'Comment' : 'Comments'}</span>
                    </div>
                </div>

                {/* ── Comments List — scrollable ── */}
                <div className='flex-1 overflow-y-auto px-4 py-2 space-y-2.5' style={{ minHeight: '60px' }}>
                    {isLoading ? (
                        <div className='flex items-center justify-center py-8'>
                            <div className='w-6 h-6 border-2 border-gray-200 border-t-[var(--color-primary)] rounded-full animate-spin' />
                        </div>
                    ) : reviews.length > 0 ? (
                        <>
                            <p className='text-[11px] font-semibold text-gray-400 uppercase tracking-wide'>Most relevant</p>
                            {reviews.map((review: any) => {
                                const reviewId = review._id;
                                const isLiked = likedReviews.has(reviewId);
                                const likeCount = review.likes || 0;
                                const replies = review.replies || [];
                                const isReplyOpen = replyingTo === reviewId;

                                return (
                                    <div key={reviewId} className='flex gap-2'>
                                        <div className='flex-1 min-w-0'>
                                            <div className='bg-gray-100 rounded-2xl px-3 py-2'>
                                                {review.comment && (
                                                    <p className='text-[12px] text-gray-800 leading-snug'>{review.comment}</p>
                                                )}
                                            </div>
                                            <div className='flex items-center gap-3 px-3 mt-0.5 text-[10px] text-gray-400'>
                                                <span className='flex gap-0.5'>
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <LuStar key={star} size={9} style={{
                                                            color: '#f59e0b',
                                                            fill: star <= (review.rating || 0) ? '#f59e0b' : 'none'
                                                        }} />
                                                    ))}
                                                </span>
                                                <button
                                                    onClick={() => handleLikeReview(reviewId)}
                                                    className={`font-medium hover:underline flex items-center gap-1 ${isLiked ? 'text-[var(--color-secondary)]' : ''}`}
                                                    disabled={isLiked}
                                                >
                                                    <LuThumbsUp size={10} style={{ fill: isLiked ? 'var(--color-secondary)' : 'none' }} />
                                                    <span>Like{likeCount > 0 ? ` (${likeCount})` : ''}</span>
                                                </button>
                                                <button
                                                    onClick={() => { setReplyingTo(isReplyOpen ? null : reviewId); setReplyText(''); }}
                                                    className='font-medium hover:underline'
                                                >
                                                    Reply{replies.length > 0 ? ` (${replies.length})` : ''}
                                                </button>
                                            </div>

                                            {/* ── Replies list ── */}
                                            {replies.length > 0 && (
                                                <div className='mt-1.5 ml-1 space-y-1.5'>
                                                    {replies.map((reply: any) => {
                                                        const replyKey = `${reviewId}_${reply._id}`;
                                                        const isReplyLiked = likedReplies.has(replyKey);
                                                        return (
                                                            <div key={reply._id} className='flex gap-2'>
                                                                <LuCornerDownRight size={12} className='text-gray-300 mt-1.5 shrink-0' />
                                                                <div className='flex-1 min-w-0'>
                                                                    <div className='bg-gray-50 rounded-2xl px-3 py-1.5'>
                                                                        <p className='text-[11px] text-gray-800 leading-snug'>{reply.text}</p>
                                                                    </div>
                                                                    <div className='flex items-center gap-3 px-3 mt-0.5 text-[10px] text-gray-400'>
                                                                        <button
                                                                            onClick={() => handleLikeReply(reviewId, reply._id)}
                                                                            className={`font-medium hover:underline flex items-center gap-1 ${isReplyLiked ? 'text-[var(--color-secondary)]' : ''}`}
                                                                            disabled={isReplyLiked}
                                                                        >
                                                                            <LuThumbsUp size={9} style={{ fill: isReplyLiked ? 'var(--color-secondary)' : 'none' }} />
                                                                            <span>Like{reply.likes > 0 ? ` (${reply.likes})` : ''}</span>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* ── Reply input ── */}
                                            {isReplyOpen && (
                                                <div className='flex gap-2 mt-2 ml-1'>
                                                    <LuCornerDownRight size={12} className='text-gray-300 mt-2 shrink-0' />
                                                    <div className='flex-1 flex items-center bg-gray-100 rounded-full px-3 py-1'>
                                                        <input
                                                            type='text'
                                                            autoFocus
                                                            value={replyText}
                                                            onChange={e => setReplyText(e.target.value)}
                                                            onKeyDown={e => { if (e.key === 'Enter' && replyText.trim()) handleSubmitReply(reviewId); }}
                                                            placeholder='Write a reply...'
                                                            className='flex-1 bg-transparent text-[11px] text-gray-700 outline-none'
                                                        />
                                                        <button
                                                            onClick={() => handleSubmitReply(reviewId)}
                                                            disabled={!replyText.trim() || isReplying}
                                                            className='text-[var(--color-primary)] font-semibold text-[11px] ml-2 disabled:opacity-30 flex items-center gap-1'
                                                        >
                                                            {isReplying ? (
                                                                <div className='w-3 h-3 border-2 border-gray-300 border-t-[var(--color-primary)] rounded-full animate-spin' />
                                                            ) : (
                                                                <LuSend size={11} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    ) : (
                        <div className='text-center py-6'>
                            <p className='text-sm text-gray-500'>No comments yet</p>
                            <p className='text-xs text-gray-400 mt-1'>Be the first to comment!</p>
                        </div>
                    )}
                </div>

                {/* ── Comment Input — bottom bar ── */}
                <div className='border-t border-gray-200 px-4 py-2.5 shrink-0 bg-white'>
                    {submitSuccess && (
                        <div className='mb-2 text-center text-xs text-green-600 font-medium bg-green-50 py-1.5 rounded-lg'>
                            ✅ Comment posted!
                        </div>
                    )}

                    <div className='flex items-start gap-2.5'>
                        {/* Comment + Rating */}
                        <div className='flex-1 min-w-0 bg-gray-100 rounded-2xl px-3 py-1.5'>
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && newComment.trim()) handleSubmitComment(); }}
                                placeholder="Write a comment..."
                                className='w-full bg-transparent text-[12px] text-gray-700 font-normal placeholder-gray-400 placeholder:font-normal outline-none py-1'
                            />
                            {/* Rating + Send row */}
                            <div className='flex items-center justify-between mt-1 pt-1.5 border-t border-gray-200/60'>
                                <div className='flex items-center gap-1.5'>
                                    <span className='text-[11px] text-gray-400'>Rating</span>
                                    <div className='flex gap-px'>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                onClick={() => setNewRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                className='p-px transition-transform hover:scale-125'
                                            >
                                                <LuStar size={13} style={{
                                                    color: '#f59e0b',
                                                    fill: star <= (hoverRating || newRating) ? '#f59e0b' : 'none',
                                                    transition: 'all 0.15s ease'
                                                }} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={handleSubmitComment}
                                    disabled={!newComment.trim() || isSubmitting}
                                    className='text-[var(--color-primary)] font-semibold text-[13px] hover:text-[var(--color-primary-dark)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1'
                                >
                                    {isSubmitting ? (
                                        <div className='w-4 h-4 border-2 border-gray-300 border-t-[var(--color-primary)] rounded-full animate-spin' />
                                    ) : (
                                        <><LuSend size={13} /> Post</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fbModalIn {
                    from { transform: scale(0.95) translateY(10px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export { CommentsPopup };
export default NewProductCard;
