"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { halloweenCategories } from '@/data/halloweenDeals';
import { useGetProductsQuery } from '@/redux/api/productApi';
import { FaStar, FaShoppingCart, FaQuestionCircle } from 'react-icons/fa';

const HalloweenDeals: React.FC = () => {
    // Real catalog products — so each card opens its own product details page.
    const { data } = useGetProductsQuery({ limit: 30, sort: '-createdAt' });
    const products = data?.data || [];

    return (
        <section className="container mx-auto px-4 py-8 bg-white">
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold flex items-center justify-center gap-2 mb-1">
                    <span>🦇</span> Halloween Deals <span>🦇</span>
                </h2>
                <h3 className="text-2xl font-black uppercase tracking-wide">Explore Your Interests</h3>
            </div>

            {/* Categories scroll */}
            <div className="flex overflow-x-auto gap-3 pb-4 mb-6 scrollbar-hide snap-x">
                {halloweenCategories.map((cat, idx) => (
                    <button
                        key={idx}
                        className={`snap-center flex-shrink-0 px-5 py-2 rounded-full border border-gray-300 text-sm font-medium ${idx === 0 ? 'bg-white text-black' : 'bg-white text-gray-700 hover:border-gray-400'}`}
                        style={{ minWidth: "max-content" }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Products grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {products.map((product: any) => {
                    const img = product.thumbnail || (Array.isArray(product.images) ? product.images[0] : '') || '';
                    const href = `/product/${product.slug || product.id || product._id}`;
                    const sold = product.soldCount ?? product.totalSold ?? 0;
                    const reviews = product.reviewCount ?? 0;
                    const rating = Math.round(Number(product.rating) || 0);
                    const tag = product.tag || (product.isNewProduct ? 'New' : product.isOnSale ? 'Sale' : '');
                    const subCat = product.subCategory || product.brand || 'Store';
                    const showCompare = Number(product.originalPrice) > Number(product.price);

                    return (
                        <Link key={product._id || product.id} href={href} className="flex flex-col group cursor-pointer">
                            <div className="relative aspect-square mb-2 overflow-hidden bg-gray-100 rounded-sm">
                                {img && (
                                    <Image
                                        src={img}
                                        alt={product.name || 'Product'}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                                    />
                                )}
                                {tag && (
                                    <div className={`absolute top-0 left-0 px-2 py-0.5 text-xs font-bold text-white ${tag === 'Halloween' ? 'bg-[#ff6600]' : 'bg-gray-500'}`}>
                                        {tag}
                                    </div>
                                )}
                            </div>

                            <h4 className="text-sm text-gray-800 line-clamp-2 leading-tight mb-1">
                                {product.name}
                            </h4>

                            <div className="flex items-center justify-between mt-auto">
                                <div className="flex flex-col">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-[#ff6600] font-bold text-lg">৳{product.price}</span>
                                        <span className="text-xs text-gray-500 font-medium">{sold} sold</span>
                                    </div>

                                    {showCompare && (
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <span className="line-through">Compare at: ৳{product.originalPrice}</span>
                                            <FaQuestionCircle size={10} />
                                        </div>
                                    )}

                                    <div className="text-[10px] uppercase font-bold mt-1 text-gray-500 truncate">
                                        <span className="text-[#ff6600]">BEST-SELLING ITEM</span> in {subCat}
                                    </div>

                                    <div className="flex items-center gap-1 mt-1">
                                        <div className="flex text-black text-[10px]">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <FaStar key={i} className={i < rating ? '' : 'text-gray-300'} />
                                            ))}
                                        </div>
                                        <span className="text-xs text-gray-600">{reviews}</span>
                                    </div>

                                    {product.isFeatured && (
                                        <div className="mt-1">
                                            <span className="inline-flex items-center gap-1 bg-[#603982] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                                                <FaStar size={8} /> Star seller
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); }}
                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 self-end mb-2"
                                    aria-label="Add to cart"
                                >
                                    <FaShoppingCart className="text-gray-700" size={14} />
                                </button>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
};

export default HalloweenDeals;
