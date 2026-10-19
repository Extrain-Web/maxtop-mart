"use client";

import React, { useMemo, useState } from 'react';
import SmartImage from '@/components/shared/SmartImage';
import Link from 'next/link';
import {
    LuPlus, LuSquarePen, LuTrash2, LuSearch, LuShoppingBag, LuEye,
    LuBox, LuChartColumn, LuCloudUpload, LuRefreshCw, LuChevronLeft, LuChevronRight, LuX,
} from 'react-icons/lu';
import { useGetProductsQuery, useDeleteProductMutation } from '@/redux/api/productApi';
import { useGetAdminCategoriesQuery } from '@/redux/api/categoryApi';
import { toast } from 'react-hot-toast';
import BulkUploadModal from './BulkUploadModal';

const PER_PAGE = 10;

const ProductsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryId, setCategoryId] = useState('');     // parent / root category
    const [subCategoryId, setSubCategoryId] = useState(''); // child of the selected parent
    const [page, setPage] = useState(1);
    const [showBulkUpload, setShowBulkUpload] = useState(false);

    // The backend matches ?category=<id> against a product's primary OR sub category,
    // so the most specific selection wins.
    const effectiveCategory = subCategoryId || categoryId || undefined;

    const { data: productsData, isLoading, isFetching, refetch } = useGetProductsQuery({
        searchTerm: searchTerm || undefined,
        category: effectiveCategory,
        page,
        limit: PER_PAGE,
    });
    const { data: catData } = useGetAdminCategoriesQuery(undefined);
    const [deleteProduct] = useDeleteProductMutation();

    const products = productsData?.data || [];
    const meta = productsData?.meta || {};

    // Split categories into roots + their children for the cascading filter.
    const allCats: any[] = catData?.data || [];
    const rootCats = useMemo(() => allCats.filter((c) => !c.parent), [allCats]);
    const subCats = useMemo(
        () => (categoryId ? allCats.filter((c) => (c.parent?._id || c.parent) === categoryId) : []),
        [allCats, categoryId],
    );

    const resetTo = (fn: () => void) => { fn(); setPage(1); };
    const clearFilters = () => { setSearchTerm(''); setCategoryId(''); setSubCategoryId(''); setPage(1); };
    const hasFilters = !!(searchTerm || categoryId || subCategoryId);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await deleteProduct(id).unwrap();
            toast.success('Product deleted successfully');
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to delete product');
        }
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0 }).format(amount || 0);

    const stats = [
        { label: 'Total Products', value: meta.total || 0, icon: LuShoppingBag, tint: 'bg-blue-50 text-blue-600' },
        { label: 'Active', value: products.filter((p: any) => p.status === 'active').length, icon: LuBox, tint: 'bg-green-50 text-green-600' },
        { label: 'Low Stock', value: products.filter((p: any) => (p.stock ?? 0) <= (p.lowStockThreshold ?? 5)).length, icon: LuChartColumn, tint: 'bg-amber-50 text-amber-600' },
        { label: 'Featured', value: products.filter((p: any) => p.isFeatured).length, icon: LuEye, tint: 'bg-purple-50 text-purple-600' },
    ];

    const StatusBadge = ({ status }: { status: string }) => {
        const cls = status === 'active' ? 'bg-green-50 text-green-700'
            : status === 'draft' ? 'bg-gray-100 text-gray-600'
                : 'bg-red-50 text-red-700';
        return <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide ${cls}`}>{status}</span>;
    };

    const StockMeter = ({ product }: { product: any }) => {
        const low = product.stock <= (product.lowStockThreshold ?? 5);
        return (
            <div className="flex flex-col gap-1">
                <p className={`text-sm font-bold ${low ? 'text-red-600' : 'text-gray-700'}`}>{product.stock} units</p>
                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full ${product.stock === 0 ? 'bg-red-500' : low ? 'bg-amber-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(100, (product.stock / 50) * 100)}%` }}
                    />
                </div>
            </div>
        );
    };

    const ActionButtons = ({ id, full }: { id: string; full?: boolean }) => (
        <div className={`flex items-center gap-2 ${full ? '' : 'justify-end'}`}>
            <Link
                href={`/dashboard/admin/products/new?id=${id}`}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 transition-all ${full ? 'flex-1' : ''}`}
                title="Edit product"
            >
                <LuSquarePen size={14} /> Edit
            </Link>
            <button
                onClick={() => handleDelete(id)}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all ${full ? 'flex-1' : ''}`}
                title="Delete product"
            >
                <LuTrash2 size={14} /> Delete
            </button>
        </div>
    );

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Products Management</h1>
                    <p className="text-[13px] text-gray-500">Manage inventory, pricing and product visibility</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowBulkUpload(true)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 rounded-md text-[13px] font-semibold hover:bg-gray-50 transition-all"
                    >
                        <LuCloudUpload size={16} /> <span className="hidden sm:inline">Bulk Upload (CSV)</span><span className="sm:hidden">CSV</span>
                    </button>
                    <Link
                        href="/dashboard/admin/products/new"
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-primary text-white rounded-md text-[13px] font-semibold hover:bg-primary-dark transition-all shadow-sm"
                    >
                        <LuPlus size={16} /> Add New Product
                    </Link>
                </div>
            </div>

            {showBulkUpload && <BulkUploadModal onClose={() => setShowBulkUpload(false)} />}

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {stats.map((s) => (
                    <div key={s.label} className="bg-white p-3.5 rounded-lg border border-gray-200 flex items-center gap-3">
                        <span className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${s.tint}`}><s.icon size={20} /></span>
                        <div className="min-w-0">
                            <p className="text-xl font-bold text-gray-900 leading-none">{s.value}</p>
                            <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mt-1 truncate">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white p-3 rounded-lg border border-gray-200 flex flex-col lg:flex-row lg:items-center gap-2.5">
                <div className="relative flex-1 min-w-0">
                    <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search products by name or SKU…"
                        className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-md outline-none focus:border-primary transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => resetTo(() => setSearchTerm(e.target.value))}
                    />
                </div>

                <div className="grid grid-cols-2 lg:flex gap-2.5">
                    {/* Category (root) */}
                    <select
                        value={categoryId}
                        onChange={(e) => resetTo(() => { setCategoryId(e.target.value); setSubCategoryId(''); })}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-700 outline-none focus:border-primary lg:min-w-[170px]"
                    >
                        <option value="">All categories</option>
                        {rootCats.map((c) => (<option key={c._id} value={c._id}>{c.name}</option>))}
                    </select>

                    {/* Sub-category (children of selected root) */}
                    <select
                        value={subCategoryId}
                        onChange={(e) => resetTo(() => setSubCategoryId(e.target.value))}
                        disabled={!categoryId || subCats.length === 0}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-700 outline-none focus:border-primary disabled:bg-gray-50 disabled:text-gray-400 lg:min-w-[170px]"
                    >
                        <option value="">{!categoryId ? 'All sub-categories' : subCats.length ? 'All sub-categories' : 'No sub-categories'}</option>
                        {subCats.map((c) => (<option key={c._id} value={c._id}>{c.name}</option>))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    {hasFilters && (
                        <button onClick={clearFilters} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-medium text-gray-500 hover:bg-gray-100">
                            <LuX size={15} /> Clear
                        </button>
                    )}
                    <button onClick={() => refetch()} className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md text-[13px] font-medium text-gray-700 hover:bg-gray-50">
                        <LuRefreshCw size={15} className={isFetching ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-16 text-center text-gray-500">
                        <div className="animate-spin w-9 h-9 border-[3px] border-primary border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-sm">Loading products…</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-primary-lightest rounded-xl flex items-center justify-center mx-auto mb-4">
                            <LuShoppingBag size={32} className="text-[var(--color-primary)]" />
                        </div>
                        <h3 className="text-base font-bold text-gray-800">No products found</h3>
                        <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
                            {hasFilters ? 'Try changing your search or filters.' : 'Start adding products to see them listed here.'}
                        </p>
                        {hasFilters ? (
                            <button onClick={clearFilters} className="inline-flex items-center gap-2 mt-5 px-5 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-dark">
                                <LuX size={16} /> Clear filters
                            </button>
                        ) : (
                            <Link href="/dashboard/admin/products/new" className="inline-flex items-center gap-2 mt-5 px-5 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-dark">
                                <LuPlus size={18} /> Add your first product
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop / tablet table */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        {['Product', 'Category', 'Price', 'Stock', 'Status'].map((h) => (
                                            <th key={h} className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                                        ))}
                                        <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {products.map((product: any) => (
                                        <tr key={product._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
                                                        {product.thumbnail
                                                            ? <SmartImage src={product.thumbnail} alt={product.name} width={80} height={80} className="w-full h-full object-cover" />
                                                            : <LuShoppingBag size={20} className="text-gray-400" />}
                                                    </div>
                                                    <div className="min-w-0 max-w-[240px]">
                                                        <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                                                        <p className="text-[11px] text-gray-400 mt-0.5 font-mono truncate">SKU: {product.sku || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="text-sm text-gray-700 font-medium">{product.category?.name || 'Uncategorized'}</p>
                                                {product.subCategory?.name && <p className="text-[11px] text-gray-400 mt-0.5">{product.subCategory.name}</p>}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="font-bold text-gray-900">{formatCurrency(product.price)}</p>
                                                {product.originalPrice > product.price && (
                                                    <p className="text-xs text-gray-400 line-through">{formatCurrency(product.originalPrice)}</p>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5"><StockMeter product={product} /></td>
                                            <td className="px-5 py-3.5"><StatusBadge status={product.status} /></td>
                                            <td className="px-5 py-3.5"><ActionButtons id={product._id} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="lg:hidden divide-y divide-gray-100">
                            {products.map((product: any) => (
                                <div key={product._id} className="p-4 flex gap-3">
                                    <div className="w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
                                        {product.thumbnail
                                            ? <SmartImage src={product.thumbnail} alt={product.name} width={96} height={96} className="w-full h-full object-cover" />
                                            : <LuShoppingBag size={24} className="text-gray-400" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{product.name}</p>
                                            <StatusBadge status={product.status} />
                                        </div>
                                        <p className="text-[11px] text-gray-400 font-mono mt-0.5 truncate">SKU: {product.sku || 'N/A'}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {product.category?.name || 'Uncategorized'}{product.subCategory?.name ? ` › ${product.subCategory.name}` : ''}
                                        </p>
                                        <div className="flex items-end justify-between gap-3 mt-2">
                                            <div>
                                                <p className="font-bold text-gray-900">{formatCurrency(product.price)}</p>
                                                {product.originalPrice > product.price && (
                                                    <p className="text-[11px] text-gray-400 line-through">{formatCurrency(product.originalPrice)}</p>
                                                )}
                                            </div>
                                            <StockMeter product={product} />
                                        </div>
                                        <div className="mt-3"><ActionButtons id={product._id} full /></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Pagination */}
                {meta.totalPages > 1 && (
                    <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-3">
                        <p className="text-[13px] text-gray-500">
                            <span className="font-semibold text-gray-800">{(page - 1) * PER_PAGE + 1}</span>–<span className="font-semibold text-gray-800">{Math.min(page * PER_PAGE, meta.total)}</span> of <span className="font-semibold text-gray-800">{meta.total}</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="p-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"><LuChevronLeft size={16} /></button>
                            <span className="text-[13px] text-gray-600 px-1">{page} / {meta.totalPages}</span>
                            <button disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)} className="p-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"><LuChevronRight size={16} /></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductsPage;
