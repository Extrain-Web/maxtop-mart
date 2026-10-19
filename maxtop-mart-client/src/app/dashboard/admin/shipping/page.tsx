"use client";

import React, { useState } from 'react';
import {
    LuMapPin, LuPlus, LuSquarePen, LuTrash2, LuRefreshCw, LuX, LuLayers, LuCircleCheck,
} from 'react-icons/lu';
import {
    useGetZonesQuery,
    useCreateZoneMutation,
    useUpdateZoneMutation,
    useDeleteZoneMutation,
} from '@/redux/api/shippingApi';
import toast from 'react-hot-toast';
import bdGeo from '@/lib/bdGeo.json';
import Select from 'react-select';

/**
 * Delivery Zones — define what delivery costs where.
 *
 * Each zone matches a Division → District → Upazila (any level can be left
 * blank to apply more broadly) and carries a price + estimated delivery time.
 * At checkout the customer's address is matched to the most specific active
 * zone to compute shipping. Live shipment/courier status is NOT shown here —
 * that lives on the Courier / Shipments board (no more duplication).
 */

const selectStyles = {
    control: (base: any, state: any) => ({
        ...base,
        minHeight: '38px',
        borderRadius: '0.375rem',
        borderColor: state.isFocused ? 'var(--color-primary)' : '#e5e7eb',
        boxShadow: 'none',
        backgroundColor: '#fff',
        fontSize: '14px',
        '&:hover': { borderColor: '#d1d5db' },
    }),
    option: (base: any, state: any) => ({
        ...base,
        backgroundColor: state.isSelected ? 'var(--color-primary)' : state.isFocused ? '#fff1ea' : 'transparent',
        color: state.isSelected ? 'white' : '#374151',
        cursor: 'pointer',
        fontSize: '14px',
    }),
    menu: (base: any) => ({ ...base, zIndex: 70 }),
};

const ZoneModal = ({ onClose, onSubmit, editingZone }: { onClose: () => void; onSubmit: (d: any) => void; editingZone?: any }) => {
    const [name, setName] = useState(editingZone?.name || '');
    const [division, setDivision] = useState(editingZone?.division || '');
    const [district, setDistrict] = useState(editingZone?.district || '');
    const [upazila, setUpazila] = useState(editingZone?.upazilas?.[0] || '');
    const [price, setPrice] = useState<number | ''>(editingZone?.price ?? '');
    const [estimatedDays, setEstimatedDays] = useState(editingZone?.estimatedDays || '3-5 days');
    const [isActive, setIsActive] = useState(editingZone?.isActive ?? true);

    const divisions = (bdGeo as any[]).map((d) => ({ value: d.name, label: d.name }));
    const districts = ((bdGeo as any[]).find((d) => d.name === division)?.districts || []).map((d: any) => ({ value: d.name, label: d.name }));
    const upazilas = (((bdGeo as any[]).find((d) => d.name === division)?.districts || []).find((d: any) => d.name === district)?.upazilas || [])
        .map((u: any) => ({ value: u.name, label: u.name }));

    const submit = () => {
        if (!name.trim()) return toast.error('Give the zone a name');
        if (price === '' || Number(price) < 0) return toast.error('Enter a valid delivery price');
        onSubmit({ name: name.trim(), division, district, upazilas: upazila ? [upazila] : [], price: Number(price), estimatedDays, isActive });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="px-5 py-3.5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
                    <h3 className="font-bold text-gray-900">{editingZone ? 'Edit' : 'Create'} Delivery Zone</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400"><LuX size={18} /></button>
                </div>

                <div className="p-5 grid grid-cols-2 gap-3.5">
                    <div className="col-span-2">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Zone name</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:border-[var(--color-primary)] outline-none text-sm"
                            placeholder="e.g. Dhaka City"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Division</label>
                        <Select
                            options={divisions}
                            value={division ? { value: division, label: division } : null}
                            onChange={(v: any) => { setDivision(v?.value || ''); setDistrict(''); setUpazila(''); }}
                            styles={selectStyles}
                            placeholder="All Bangladesh (leave empty)"
                            isClearable
                        />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">District</label>
                        <Select
                            options={districts}
                            value={district ? { value: district, label: district } : null}
                            onChange={(v: any) => { setDistrict(v?.value || ''); setUpazila(''); }}
                            styles={selectStyles}
                            placeholder="All districts"
                            isDisabled={!division}
                            isClearable
                        />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Upazila / Area</label>
                        <Select
                            options={upazilas}
                            value={upazila ? { value: upazila, label: upazila } : null}
                            onChange={(v: any) => setUpazila(v?.value || '')}
                            styles={selectStyles}
                            placeholder="All upazilas"
                            isDisabled={!district}
                            isClearable
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Delivery price (৳)</label>
                        <input
                            type="number"
                            min={0}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:border-[var(--color-primary)] outline-none text-sm"
                            placeholder="e.g. 60"
                            value={price}
                            onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Delivery time</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md focus:border-[var(--color-primary)] outline-none text-sm"
                            placeholder="e.g. 1-3 days"
                            value={estimatedDays}
                            onChange={(e) => setEstimatedDays(e.target.value)}
                        />
                    </div>

                    <label className="col-span-2 flex items-center gap-2 mt-1 cursor-pointer">
                        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 accent-[var(--color-primary)]" />
                        <span className="text-sm font-medium text-gray-700">Zone is active</span>
                    </label>
                </div>

                <div className="px-5 py-3.5 border-t border-gray-100 flex justify-end gap-2 sticky bottom-0 bg-white">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700">Cancel</button>
                    <button onClick={submit} className="px-5 py-2 bg-[var(--color-primary)] text-white rounded-md text-sm font-bold hover:bg-[var(--color-primary-dark)]">
                        Save zone
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function DeliveryZonesPage() {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);

    const { data: zonesData, isLoading, refetch } = useGetZonesQuery(undefined);
    const [createZone] = useCreateZoneMutation();
    const [updateZone] = useUpdateZoneMutation();
    const [deleteZone] = useDeleteZoneMutation();

    const zones: any[] = zonesData?.data || [];
    const activeCount = zones.filter((z) => z.isActive).length;

    const openCreate = () => { setEditing(null); setModalOpen(true); };
    const openEdit = (z: any) => { setEditing(z); setModalOpen(true); };

    const submit = async (data: any) => {
        try {
            if (editing) { await updateZone({ id: editing._id, ...data }).unwrap(); toast.success('Zone updated'); }
            else { await createZone(data).unwrap(); toast.success('Zone created'); }
            setModalOpen(false); setEditing(null);
        } catch (err: any) {
            toast.error(err?.data?.message || 'Could not save the zone');
        }
    };

    const remove = async (id: string) => {
        if (!window.confirm('Delete this delivery zone?')) return;
        try { await deleteZone(id).unwrap(); toast.success('Zone deleted'); }
        catch (err: any) { toast.error(err?.data?.message || 'Failed to delete zone'); }
    };

    const locationOf = (z: any) =>
        [z.division, z.district, z.upazilas?.join(', ')].filter(Boolean).join(' › ') || 'All Bangladesh';

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-lg bg-primary-lightest flex items-center justify-center">
                        <LuMapPin className="text-[var(--color-primary)]" size={18} />
                    </span>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Delivery Zones</h1>
                        <p className="text-[13px] text-gray-500">Set delivery cost &amp; time per area — applied automatically at checkout</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => refetch()} className="px-3 py-2 bg-white border border-gray-200 rounded-md text-[13px] font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <LuRefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <button onClick={openCreate} className="px-3.5 py-2 bg-[var(--color-primary)] text-white rounded-md text-[13px] font-semibold hover:bg-[var(--color-primary-dark)] flex items-center gap-2">
                        <LuPlus size={15} /> Add Zone
                    </button>
                </div>
            </div>

            {/* Compact stats */}
            <div className="grid grid-cols-2 gap-3 sm:max-w-md">
                <div className="bg-white rounded-lg border border-gray-200 p-3.5 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center"><LuLayers size={18} /></span>
                    <span><span className="block text-xl font-bold text-gray-900 leading-none">{zones.length}</span><span className="block text-xs text-gray-500 mt-1">Total zones</span></span>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-3.5 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center"><LuCircleCheck size={18} /></span>
                    <span><span className="block text-xl font-bold text-gray-900 leading-none">{activeCount}</span><span className="block text-xs text-gray-500 mt-1">Active</span></span>
                </div>
            </div>

            {/* Zones table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                {['Zone', 'Coverage', 'Price', 'Delivery time', 'Status'].map((h) => (
                                    <th key={h} className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                                <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                [...Array(4)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {[...Array(6)].map((__, j) => (<td key={j} className="px-4 py-3.5"><div className="h-4 bg-gray-100 rounded w-24" /></td>))}
                                    </tr>
                                ))
                            ) : zones.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <LuMapPin size={44} className="mx-auto text-gray-200 mb-3" />
                                        <p className="text-gray-500">No delivery zones yet — add your first one</p>
                                    </td>
                                </tr>
                            ) : (
                                zones.map((z) => (
                                    <tr key={z._id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3.5"><p className="font-semibold text-gray-900 text-sm">{z.name}</p></td>
                                        <td className="px-4 py-3.5"><p className="text-sm text-gray-600">{locationOf(z)}</p></td>
                                        <td className="px-4 py-3.5"><p className="font-bold text-gray-900">৳{Number(z.price).toLocaleString()}</p></td>
                                        <td className="px-4 py-3.5"><p className="text-sm text-gray-600">{z.estimatedDays}</p></td>
                                        <td className="px-4 py-3.5">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${z.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {z.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button onClick={() => openEdit(z)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 transition-all" title="Edit zone"><LuSquarePen size={14} /> Edit</button>
                                                <button onClick={() => remove(z._id)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all" title="Delete zone"><LuTrash2 size={14} /> Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* key remounts the modal so fields reset between create/edit of different zones */}
            {modalOpen && (
                <ZoneModal
                    key={editing?._id || 'new'}
                    editingZone={editing}
                    onClose={() => { setModalOpen(false); setEditing(null); }}
                    onSubmit={submit}
                />
            )}
        </div>
    );
}
