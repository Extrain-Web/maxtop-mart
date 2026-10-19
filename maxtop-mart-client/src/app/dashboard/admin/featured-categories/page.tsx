"use client";

import React, { useEffect, useRef, useState } from 'react';
import SmartImage from '@/components/shared/SmartImage';
import { LuPlus, LuTrash2, LuArrowUp, LuArrowDown, LuSave, LuStar, LuEye, LuEyeOff, LuImage, LuLoader } from 'react-icons/lu';
import { toast } from 'react-hot-toast';
import { useGetSiteContentQuery, useUpdateSiteContentMutation } from '@/redux/api/siteContentApi';
import { useGetCategoriesQuery } from '@/redux/api/categoryApi';
import { useUploadImageMutation } from '@/redux/api/uploadApi';

interface FeaturedCategory {
    imageUrl: string;
    name: string;
    categoryId?: string;
    active?: boolean;
    order?: number;
}

export default function FeaturedCategoriesPage() {
    const { data: scRes, isLoading: loadingContent } = useGetSiteContentQuery({});
    const [updateContent, { isLoading: saving }] = useUpdateSiteContentMutation();
    const { data: catRes } = useGetCategoriesQuery({});
    const [uploadImage] = useUploadImageMutation();

    const categories: any[] = catRes?.data || [];
    
    const [items, setItems] = useState<FeaturedCategory[]>([]);
    
    // Only Parent Categories that are not already featured
    const parentCategories = categories.filter(c => !c.parent && !items.some(item => item.categoryId === c._id));
    const hydrated = useRef(false);

    // Hydrate the local editor once from the server
    useEffect(() => {
        if (!hydrated.current && scRes?.data) {
            setItems((scRes.data.featuredCategories || []) as FeaturedCategory[]);
            hydrated.current = true;
        }
    }, [scRes]);

    // ── Add form ──
    const [newCategoryId, setNewCategoryId] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const categoryName = (id?: string) => categories.find((c) => c._id === id)?.name || '';

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!newCategoryId) {
            toast.error('Please select a parent category first!');
            return;
        }

        setIsUploading(true);
        const fd = new FormData();
        fd.append('image', file);
        try {
            const res = await uploadImage(fd).unwrap();
            const uploadedUrl = res.data.url;
            const name = categoryName(newCategoryId);
            
            setItems((prev) => [...prev, { imageUrl: uploadedUrl, name, categoryId: newCategoryId, active: true }]);
            setNewCategoryId('');
            toast.success(`${name} added to featured!`);
        } catch {
            toast.error('Image upload failed. Try again.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleUpdateImage = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const toastId = toast.loading('Uploading new image...');
        const fd = new FormData();
        fd.append('image', file);
        try {
            const res = await uploadImage(fd).unwrap();
            const uploadedUrl = res.data.url;
            setItems((prev) => prev.map((it, i) => i === idx ? { ...it, imageUrl: uploadedUrl } : it));
            toast.success('Image updated successfully!', { id: toastId });
        } catch {
            toast.error('Image update failed. Try again.', { id: toastId });
        }
    };

    const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
    const toggleActive = (idx: number) => setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, active: it.active === false } : it)));
    const move = (idx: number, dir: -1 | 1) => {
        setItems((prev) => {
            const next = [...prev];
            const j = idx + dir;
            if (j < 0 || j >= next.length) return prev;
            [next[idx], next[j]] = [next[j], next[idx]];
            return next;
        });
    };

    const handleSave = async () => {
        // Renumber order to match the visible order before saving.
        const payload = items.map((it, i) => ({
            imageUrl: it.imageUrl,
            name: it.name,
            categoryId: it.categoryId || '',
            active: it.active !== false,
            order: i,
        }));
        try {
            await updateContent({ featuredCategories: payload }).unwrap();
            toast.success('Featured categories saved', {
                style: { borderRadius: '8px', background: 'var(--color-primary)', color: '#fff' },
            });
        } catch (err: any) {
            toast.error(err?.data?.message || 'Could not save');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-md border border-gray-200 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <LuStar size={20} className="text-[var(--color-primary)]" /> Featured Categories
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Select a parent category and upload an image to add it to the featured strip.
                        <span className="ml-1 font-semibold text-[var(--color-primary)]">Recommended image size: 200x200 pixels (1:1 ratio, transparent PNG)</span>
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-2 bg-[var(--color-primary)] text-white rounded-md text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition-all shadow-md flex items-center gap-2 disabled:opacity-60 whitespace-nowrap"
                >
                    <LuSave size={16} /> {saving ? 'Saving…' : 'Save changes'}
                </button>
            </div>

            {/* Add new - Minimalist */}
            <div className="bg-white rounded-md border border-gray-200 shadow-sm p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Select Parent Category</label>
                        <select
                            value={newCategoryId}
                            onChange={(e) => setNewCategoryId(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm bg-white outline-none focus:border-[var(--color-primary)] cursor-pointer"
                        >
                            <option value="">— Select Category —</option>
                            {parentCategories.map((c) => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleFileSelect} 
                        />
                        <button
                            onClick={() => {
                                if(!newCategoryId) return toast.error('Please select a parent category first!');
                                fileInputRef.current?.click();
                            }}
                            disabled={isUploading}
                            className="w-full sm:w-auto px-6 py-2.5 rounded-md text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isUploading ? <LuLoader size={16} className="animate-spin" /> : <LuPlus size={16} />} 
                            {isUploading ? 'Uploading...' : 'Upload Image & Add'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Current list */}
            <div className="bg-white rounded-md border border-gray-200 shadow-sm p-5">
                <p className="text-sm font-bold text-gray-800 mb-4">Current featured categories ({items.length})</p>
                {loadingContent ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {[...Array(6)].map((_, i) => <div key={i} className="aspect-[4/5] rounded-md bg-gray-100 animate-pulse" />)}
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <LuStar size={36} className="mx-auto mb-3 text-gray-200" />
                        <p className="text-sm">No featured categories yet. Select one above.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {items.map((it, idx) => (
                            <div key={idx} className={`border rounded-md overflow-hidden bg-white shadow-sm flex flex-col group ${it.active === false ? 'border-gray-200 opacity-60' : 'border-gray-200 hover:border-[var(--color-primary)] transition-colors'}`}>
                                <div className="aspect-[4/3] bg-gray-50 overflow-hidden relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <SmartImage src={it.imageUrl} alt={it.name} width={200} height={200} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
                                    
                                    {/* Image Update Overlay */}
                                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white">
                                        <LuImage size={24} className="mb-1" />
                                        <span className="text-xs font-bold">Update</span>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={(e) => handleUpdateImage(idx, e)} 
                                        />
                                    </label>
                                </div>
                                <div className="p-2.5 flex flex-col flex-1">
                                    <p className="font-semibold text-xs text-gray-800 truncate" title={it.name}>{it.name}</p>
                                    <div className="flex items-center gap-1 mt-auto pt-2 border-t border-gray-100">
                                        <button onClick={() => move(idx, -1)} disabled={idx === 0} title="Move up" className="p-1 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"><LuArrowUp size={14} /></button>
                                        <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1} title="Move down" className="p-1 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"><LuArrowDown size={14} /></button>
                                        <button onClick={() => toggleActive(idx)} title={it.active === false ? 'Show' : 'Hide'} className="p-1 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                                            {it.active === false ? <LuEyeOff size={14} /> : <LuEye size={14} />}
                                        </button>
                                        <button onClick={() => removeItem(idx)} title="Remove from featured" className="p-1 rounded text-red-400 hover:bg-red-50 hover:text-red-600 ml-auto"><LuTrash2 size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

