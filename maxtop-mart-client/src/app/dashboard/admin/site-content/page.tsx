"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useGetSiteContentQuery, useUpdateSiteContentMutation, useGetAllLegalPagesQuery, useUpdateLegalPageMutation } from '@/redux/api/siteContentApi';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';
import {
    LuPhone, LuMessageCircle, LuLayoutDashboard, LuFileText, LuImage,
    LuSave, LuPlus, LuTrash2, LuCircleCheck, LuArrowUp, LuArrowDown, LuCreditCard,
    LuStar, LuEye, LuEyeOff, LuLoader, LuSparkles
} from 'react-icons/lu';
import { FaFacebookF, FaInstagram, FaYoutube, FaLinkedinIn, FaTiktok, FaWhatsapp, FaTelegramPlane, FaPinterestP } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { SingleImageUploader, MultipleImageUploader } from '@/components/ui/ImageUploader';
import { useGetCategoriesQuery } from '@/redux/api/categoryApi';
import { useUploadImageMutation } from '@/redux/api/uploadApi';
import SmartImage from '@/components/shared/SmartImage';
import { FEATURE_ICONS, FEATURE_ICON_KEYS, featureIcon, DEFAULT_FEATURES, type FeatureItem } from '@/lib/featureIcons';
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false, loading: () => <div style={{ height: '350px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} /> });
import 'react-quill-new/dist/quill.snow.css';

/* ─── Styles ─── */
const card: React.CSSProperties = { background: '#fff', border: '1px solid #eee', borderRadius: '10px', padding: '20px', marginBottom: '16px' };
const label: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '5px' };
const input: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: '7px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const };
const btn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', borderRadius: '7px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s' };
const btnPrimary: React.CSSProperties = { ...btn, background: 'var(--color-primary)', color: '#fff' };
const btnDanger: React.CSSProperties = { ...btn, background: '#fef2f2', color: '#dc2626', padding: '6px 10px' };
const btnSmall: React.CSSProperties = { ...btn, background: '#f3f4f6', color: '#333', padding: '6px 12px', fontSize: '12px' };

/* ─── Tabs Config ─── */
const TABS = [
    { key: 'hero', label: '🖼️ Hero Slides', icon: LuImage },
    { key: 'features', label: '✨ Features Strip', icon: LuSparkles },
    { key: 'featured', label: 'Featured Categories', icon: LuStar },
    { key: 'contact', label: 'Contact Page', icon: LuPhone },
    { key: 'payment', label: 'Payment Numbers', icon: LuCreditCard },
    { key: 'floating', label: 'Floating Widget', icon: LuMessageCircle },
    { key: 'legal', label: 'Legal Pages', icon: LuFileText },
];

export default function SiteContentPage() {
    const { data: res, isLoading } = useGetSiteContentQuery({});
    const [updateContent, { isLoading: isSaving }] = useUpdateSiteContentMutation();
    const [activeTab, setActiveTab] = useState('hero');
    const [formData, setFormData] = useState<any>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (res?.data) {
            setFormData(JSON.parse(JSON.stringify(res.data)));
        }
    }, [res]);

    const handleSave = async () => {
        if (activeTab === 'legal' || activeTab === 'featured' || activeTab === 'features') return; // Legal pages, featured, and features have their own save
        try {
            const payload: any = {};
            if (activeTab === 'hero') {
                payload.heroSlides = formData.heroSlides;
            } else {
                payload[activeTab] = formData[activeTab];
            }
            await updateContent(payload).unwrap();
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
            toast.success('Saved successfully!');
        } catch {
            toast.error('Failed to save');
        }
    };

    if (isLoading || !formData) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#111', margin: 0 }}>Site Content</h1>
                    <p style={{ fontSize: '12px', color: '#888', margin: '2px 0 0' }}>Manage dynamic content across your website</p>
                </div>
                <button onClick={handleSave} disabled={isSaving} style={{ ...btnPrimary, opacity: isSaving ? 0.6 : 1 }}>
                    {saveSuccess ? <><LuCircleCheck size={14} /> Saved!</> : <><LuSave size={14} /> {isSaving ? 'Saving...' : 'Save Changes'}</>}
                </button>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', flexWrap: 'wrap', borderBottom: '1px solid #eee', paddingBottom: '1px' }}>
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 14px', border: 'none', cursor: 'pointer',
                            fontSize: '12.5px', fontWeight: activeTab === tab.key ? 700 : 500,
                            color: activeTab === tab.key ? 'var(--color-primary)' : '#888',
                            background: activeTab === tab.key ? 'var(--color-primary-lightest)' : 'transparent',
                            borderRadius: '6px 6px 0 0',
                            borderBottom: activeTab === tab.key ? '2px solid var(--color-primary)' : '2px solid transparent',
                            transition: 'all 0.15s',
                        }}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'hero' && <HeroSlidesTab data={formData} setData={setFormData} onSave={handleSave} isSaving={isSaving} />}
            {activeTab === 'features' && <FeaturesStripTab data={formData} />}
            {activeTab === 'featured' && <FeaturedCategoriesTab data={formData} />}
            {activeTab === 'contact' && <ContactTab data={formData} setData={setFormData} />}
            {activeTab === 'payment' && <PaymentTab data={formData} setData={setFormData} />}
            {activeTab === 'floating' && <FloatingTab data={formData} setData={setFormData} />}
            {activeTab === 'legal' && <LegalPagesTab />}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* ─── CONTACT TAB ─── */
function ContactTab({ data, setData }: { data: any; setData: any }) {
    const c = data.contact || {};

    const updateField = (field: string, value: any) => {
        setData((p: any) => ({ ...p, contact: { ...p.contact, [field]: value } }));
    };

    const SOCIAL_PLATFORMS = [
        { label: 'Facebook', color: '#1877F2', Icon: FaFacebookF },
        { label: 'Instagram', color: '#E4405F', Icon: FaInstagram },
        { label: 'YouTube', color: '#FF0000', Icon: FaYoutube },
        { label: 'Twitter/X', color: '#000000', Icon: FaXTwitter },
        { label: 'LinkedIn', color: '#0A66C2', Icon: FaLinkedinIn },
        { label: 'TikTok', color: '#000000', Icon: FaTiktok },
        { label: 'WhatsApp', color: '#25D366', Icon: FaWhatsapp },
        { label: 'Telegram', color: '#26A5E4', Icon: FaTelegramPlane },
        { label: 'Pinterest', color: '#E60023', Icon: FaPinterestP },
    ];

    const addSocial = () => updateField('socials', [...(c.socials || []), { label: SOCIAL_PLATFORMS[0].label, url: '', color: SOCIAL_PLATFORMS[0].color }]);
    const removeSocial = (idx: number) => updateField('socials', (c.socials || []).filter((_: any, i: number) => i !== idx));
    const updateSocial = (idx: number, field: string, value: string) => {
        const s = [...(c.socials || [])];
        s[idx] = { ...s[idx], [field]: value };
        if (field === 'label') {
            const p = SOCIAL_PLATFORMS.find(x => x.label === value);
            if (p) s[idx].color = p.color;
        }
        updateField('socials', s);
    };

    return (
        <div>
            {/* Status Badge */}
            <div style={{ ...card, background: 'var(--color-primary-lightest)', borderColor: '#bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LuCircleCheck size={16} color="#16a34a" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a' }}>Active — This data is used on the <strong>Contact Us</strong> page</span>
                </div>
            </div>

            {/* Basic Info */}
            <div style={card}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 14px' }}>Contact Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div><label style={label}>Phone Number</label><input value={c.phone || ''} onChange={e => updateField('phone', e.target.value)} style={input} /></div>
                    <div><label style={label}>WhatsApp Number</label><input value={c.whatsapp || ''} onChange={e => updateField('whatsapp', e.target.value)} style={input} /></div>
                    <div><label style={label}>Email</label><input value={c.email || ''} onChange={e => updateField('email', e.target.value)} style={input} /></div>
                    <div><label style={label}>Address</label><input value={c.address || ''} onChange={e => updateField('address', e.target.value)} style={input} /></div>
                </div>
            </div>

            {/* Social Links */}
            <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Social Media Links</h3>
                        <p style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>These will dynamically appear in the footer and anywhere else social icons are displayed.</p>
                    </div>
                    <button onClick={addSocial} style={btnSmall}><LuPlus size={13} /> Add</button>
                </div>
                {(c.socials || []).map((s: any, idx: number) => {
                    const selectedPlatform = SOCIAL_PLATFORMS.find(p => p.label === s.label) || SOCIAL_PLATFORMS[0];
                    const CurrentIcon = selectedPlatform.Icon;
                    return (
                        <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                            <div style={{ position: 'relative', width: '150px' }}>
                                <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: selectedPlatform.color, display: 'flex', pointerEvents: 'none' }}>
                                    <CurrentIcon size={14} />
                                </div>
                                <select 
                                    value={s.label} 
                                    onChange={e => updateSocial(idx, 'label', e.target.value)} 
                                    style={{ ...input, width: '100%', paddingLeft: '32px' }}
                                >
                                    {SOCIAL_PLATFORMS.map(p => (
                                        <option key={p.label} value={p.label}>{p.label}</option>
                                    ))}
                                </select>
                            </div>
                            <input value={s.url} onChange={e => updateSocial(idx, 'url', e.target.value)} placeholder="https://..." style={{ ...input, flex: 1 }} />
                            <button onClick={() => removeSocial(idx)} style={btnDanger}><LuTrash2 size={13} /></button>
                        </div>
                    );
                })}
                {(c.socials || []).length === 0 && <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', padding: '12px' }}>No socials added yet.</p>}
            </div>
        </div>
    );
}

/* ─── FLOATING TAB ─── */
function FloatingTab({ data, setData }: { data: any; setData: any }) {
    const f = data.floating || {};
    const update = (field: string, value: any) => setData((p: any) => ({ ...p, floating: { ...p.floating, [field]: value } }));

    return (
        <div style={card}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 6px' }}>Floating Contact Widget</h3>
            <p style={{ fontSize: '12px', color: '#888', margin: '0 0 16px' }}>Manage the floating WhatsApp/Messenger/Phone button that appears on every page.</p>
            
            <div style={{ marginBottom: '16px', padding: '10px', background: '#f3f4f6', borderRadius: '6px', fontSize: '12px', color: '#555' }}>
                <strong>Note:</strong> Phone and WhatsApp numbers are now managed centrally in the <strong>Contact Page</strong> tab.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                    <label style={label}>Show Phone in Chatbot</label>
                    <select value={f.showPhone ? 'true' : 'false'} onChange={e => update('showPhone', e.target.value === 'true')} style={input}>
                        <option value="true">Yes</option><option value="false">No</option>
                    </select>
                </div>
                <div>
                    <label style={label}>Show WhatsApp Bubble</label>
                    <select value={f.showWhatsapp ? 'true' : 'false'} onChange={e => update('showWhatsapp', e.target.value === 'true')} style={input}>
                        <option value="true">Yes</option><option value="false">No</option>
                    </select>
                </div>
                <div>
                    <label style={label}>Messenger Page Username</label>
                    <input value={f.messenger || ''} onChange={e => update('messenger', e.target.value)} placeholder="YOUR_PAGE_USERNAME" style={input} />
                </div>
                <div>
                    <label style={label}>Show Messenger</label>
                    <select value={f.showMessenger ? 'true' : 'false'} onChange={e => update('showMessenger', e.target.value === 'true')} style={input}>
                        <option value="true">Yes</option><option value="false">No</option>
                    </select>
                </div>
            </div>
        </div>
    );
}

/* ─── PAYMENT TAB ─── */
function PaymentTab({ data, setData }: { data: any; setData: any }) {
    const p = data.payment || {};
    const methods = p.methods || [];
    
    const TYPES = [
        { key: 'bkash', label: 'bKash', color: '#E2136E' },
        { key: 'nagad', label: 'Nagad', color: '#F47920' },
        { key: 'rocket', label: 'Rocket', color: '#8332AC' },
        { key: 'upay', label: 'Upay', color: '#2752A4' },
        { key: 'bank', label: 'Bank Account', color: '#0f172a' },
    ];

    const addMethod = () => {
        setData((prev: any) => ({
            ...prev,
            payment: {
                ...prev.payment,
                methods: [...(prev.payment?.methods || []), {
                    type: 'bkash',
                    providerName: '',
                    accountName: '',
                    accountNumber: '',
                    accountType: 'Personal',
                    branch: '',
                    routing: '',
                    active: true,
                }],
            },
        }));
    };

    const removeMethod = (idx: number) => {
        setData((prev: any) => ({
            ...prev,
            payment: {
                ...prev.payment,
                methods: prev.payment.methods.filter((_: any, i: number) => i !== idx),
            },
        }));
    };

    const updateMethod = (idx: number, field: string, value: any) => {
        setData((prev: any) => {
            const m = [...(prev.payment?.methods || [])];
            m[idx] = { ...m[idx], [field]: value };
            return {
                ...prev,
                payment: { ...prev.payment, methods: m },
            };
        });
    };

    const updateCOD = (value: boolean) => {
        setData((prev: any) => ({
            ...prev,
            payment: { ...prev.payment, cod: { ...prev.payment?.cod, active: value } },
        }));
    };

    const updateInstructions = (value: string) => {
        setData((prev: any) => ({ ...prev, payment: { ...prev.payment, instructions: value } }));
    };

    return (
        <div>
            {/* Info */}
            <div style={{ ...card, background: 'var(--color-primary-lightest)', borderColor: '#bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LuCircleCheck size={16} color="#16a34a" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a' }}>
                        These numbers appear on the <strong>Checkout</strong> page. Customers send money to the active number.
                    </span>
                </div>
            </div>

            {/* COD Toggle */}
            <div style={{ ...card, borderLeft: `3px solid #16a34a` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#16a34a' }} />
                        <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#16a34a' }}>Cash on Delivery</h3>
                        <span style={{ fontSize: '11px', color: '#888', fontWeight: 400 }}>— no payment number needed</span>
                    </div>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#555', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={p.cod?.active !== false}
                            onChange={e => updateCOD(e.target.checked)}
                            style={{ width: '15px', height: '15px', accentColor: '#16a34a', cursor: 'pointer' }}
                        />
                        {p.cod?.active !== false ? 'Active' : 'Hidden'}
                    </label>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 10px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Payment Methods</h3>
                <button onClick={addMethod} style={btnSmall}><LuPlus size={13} /> Add Method</button>
            </div>

            {/* Dynamic Methods */}
            {methods.map((m: any, idx: number) => {
                const t = TYPES.find(x => x.key === m.type) || TYPES[0];
                const isBank = m.type === 'bank';
                return (
                    <div key={idx} style={{ ...card, borderLeft: `3px solid ${t.color}`, position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isBank ? (
                                    <LuCreditCard size={24} color={t.color} />
                                ) : (
                                    m.logo ? <img src={m.logo} alt={t.label} style={{ height: '24px', width: 'auto', objectFit: 'contain' }} /> : <span style={{ fontSize: '14px', fontWeight: 800, color: t.color }}>{t.label}</span>
                                )}
                                <select
                                    value={m.type}
                                    onChange={e => updateMethod(idx, 'type', e.target.value)}
                                    style={{ ...input, width: '150px', padding: '4px 8px', height: 'auto' }}
                                >
                                    {TYPES.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#555', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={m.active !== false}
                                        onChange={e => updateMethod(idx, 'active', e.target.checked)}
                                        style={{ width: '15px', height: '15px', accentColor: t.color, cursor: 'pointer' }}
                                    />
                                    {m.active !== false ? 'Active' : 'Hidden'}
                                </label>
                                <button onClick={() => removeMethod(idx)} style={btnDanger}><LuTrash2 size={14} /></button>
                            </div>
                        </div>

                        {isBank ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div><label style={label}>Bank Name</label><input value={m.providerName || ''} onChange={e => updateMethod(idx, 'providerName', e.target.value)} placeholder="e.g. City Bank" style={input} /></div>
                                <div><label style={label}>Account Name</label><input value={m.accountName || ''} onChange={e => updateMethod(idx, 'accountName', e.target.value)} placeholder="e.g. John Doe" style={input} /></div>
                                <div><label style={label}>Account Number</label><input value={m.accountNumber || ''} onChange={e => updateMethod(idx, 'accountNumber', e.target.value)} placeholder="Account No" style={input} /></div>
                                <div><label style={label}>Branch (Optional)</label><input value={m.branch || ''} onChange={e => updateMethod(idx, 'branch', e.target.value)} placeholder="Branch Name" style={input} /></div>
                                <div><label style={label}>Routing No (Optional)</label><input value={m.routing || ''} onChange={e => updateMethod(idx, 'routing', e.target.value)} placeholder="Routing Number" style={input} /></div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={label}>{t.label} Number</label>
                                        <input value={m.accountNumber || ''} onChange={e => updateMethod(idx, 'accountNumber', e.target.value)} placeholder="01XXXXXXXXX" style={input} />
                                    </div>
                                    <div>
                                        <label style={label}>Account Type</label>
                                        <select value={m.accountType || 'Personal'} onChange={e => updateMethod(idx, 'accountType', e.target.value)} style={input}>
                                            <option value="Personal">Personal</option>
                                            <option value="Agent">Agent</option>
                                            <option value="Merchant">Merchant</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: '12px', marginTop: '4px' }}>
                                    <label style={label}>Official Logo (Optional)</label>
                                    <p style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>
                                        Upload the official logo here. Recommended size: <strong>100x40 transparent PNG</strong>.<br/>
                                        If you leave this empty, the text <strong>{t.label}</strong> will be shown in its official color.
                                    </p>
                                    <SingleImageUploader
                                        label="Logo"
                                        value={m.logo || ''}
                                        onChange={(url) => updateMethod(idx, 'logo', url || '')}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
            
            {methods.length === 0 && <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', padding: '12px' }}>No payment methods added yet.</p>}

            {/* Instructions */}
            <div style={card}>
                <label style={label}>Payment Instructions (shown to customer)</label>
                <textarea
                    value={p.instructions || ''}
                    onChange={e => updateInstructions(e.target.value)}
                    placeholder="e.g. Send Money to the number above, then submit your number, transaction ID and time."
                    rows={2}
                    style={{ ...input, resize: 'vertical' as const, fontFamily: 'inherit' }}
                />
            </div>
        </div>
    );
}


/* ─── LEGAL PAGES TAB ─── */
function LegalPagesTab() {
    const { data: legalRes, isLoading } = useGetAllLegalPagesQuery({});
    const [updateLegalPage, { isLoading: isSavingLegal }] = useUpdateLegalPageMutation();
    const [editingSlug, setEditingSlug] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');

    const pages = legalRes?.data || [];

    const LEGAL_PAGES = [
        { slug: 'terms', label: 'Terms & Conditions', icon: '📜', color: 'var(--color-primary)' },
        { slug: 'privacy', label: 'Privacy Policy', icon: '🛡️', color: '#2563eb' },
        { slug: 'refund', label: 'Refund Policy', icon: '🔄', color: '#d97706' },
    ];

    const startEdit = (slug: string) => {
        const page = pages.find((p: any) => p.slug === slug);
        setEditingSlug(slug);
        setEditTitle(page?.title || LEGAL_PAGES.find(l => l.slug === slug)?.label || '');
        setEditContent(page?.content || '');
    };

    const handleSaveLegal = async () => {
        if (!editingSlug) return;
        try {
            await updateLegalPage({ slug: editingSlug, data: { title: editTitle, content: editContent } }).unwrap();
            toast.success(`${editTitle} saved!`);
            setEditingSlug(null);
        } catch {
            toast.error('Failed to save');
        }
    };

    if (isLoading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ width: '28px', height: '28px', border: '3px solid #e5e7eb', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            </div>
        );
    }

    // Editing Mode
    if (editingSlug) {
        const meta = LEGAL_PAGES.find(l => l.slug === editingSlug);
        return (
            <div>
                <div style={{ ...card, borderColor: meta?.color + '40' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '20px' }}>{meta?.icon}</span>
                            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Editing: {meta?.label}</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => setEditingSlug(null)} style={{ ...btn, background: '#f3f4f6', color: '#555' }}>Cancel</button>
                            <button onClick={handleSaveLegal} disabled={isSavingLegal} style={{ ...btnPrimary, opacity: isSavingLegal ? 0.6 : 1 }}>
                                <LuSave size={13} /> {isSavingLegal ? 'Saving...' : 'Save Page'}
                            </button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <label style={label}>Page Title</label>
                        <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={input} placeholder="Page title..." />
                    </div>

                    <div>
                        <label style={label}>Page Content</label>
                        <div className="legal-editor-wrapper" style={{ background: '#fff', borderRadius: '8px', border: '1.5px solid #e5e7eb', overflow: 'hidden' }}>
                            <ReactQuill
                                theme="snow"
                                value={editContent}
                                onChange={(value: string) => setEditContent(value)}
                                placeholder="Write your page content here..."
                                modules={{
                                    toolbar: [
                                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                                        [{ 'font': [] }],
                                        [{ 'size': ['small', false, 'large', 'huge'] }],
                                        ['bold', 'italic', 'underline', 'strike'],
                                        [{ 'color': [] }, { 'background': [] }],
                                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                        [{ 'indent': '-1' }, { 'indent': '+1' }],
                                        [{ 'align': [] }],
                                        ['link', 'image', 'video'],
                                        ['blockquote', 'code-block'],
                                        ['clean'],
                                    ],
                                }}
                                style={{ minHeight: '400px' }}
                            />
                        </div>
                        <style>{`
                            .legal-editor-wrapper .ql-toolbar { border: none !important; border-bottom: 1px solid #e5e7eb !important; background: #f9fafb; padding: 10px 12px !important; }
                            .legal-editor-wrapper .ql-container { border: none !important; font-size: 14px; font-family: inherit; }
                            .legal-editor-wrapper .ql-editor { min-height: 400px; padding: 20px 24px; line-height: 1.8; }
                            .legal-editor-wrapper .ql-editor h1 { font-size: 22px; font-weight: 800; margin: 20px 0 10px; }
                            .legal-editor-wrapper .ql-editor h2 { font-size: 18px; font-weight: 700; margin: 18px 0 8px; }
                            .legal-editor-wrapper .ql-editor h3 { font-size: 15px; font-weight: 600; margin: 14px 0 6px; }
                            .legal-editor-wrapper .ql-editor p { margin-bottom: 10px; }
                            .legal-editor-wrapper .ql-editor img { max-width: 100%; border-radius: 8px; margin: 12px 0; }
                        `}</style>
                    </div>
                </div>
            </div>
        );
    }

    // List Mode
    return (
        <div>
            <div style={{ ...card, background: 'var(--color-primary-surface)', borderColor: '#bbf7d0' }}>
                <p style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600, margin: 0 }}>
                    ✅ These pages are live at: <strong>/terms</strong>, <strong>/privacy</strong>, <strong>/refund</strong>
                </p>
            </div>
            {LEGAL_PAGES.map(lp => {
                const page = pages.find((p: any) => p.slug === lp.slug);
                const hasContent = page?.content && page.content.length > 10;
                return (
                    <div key={lp.slug} style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '24px' }}>{lp.icon}</span>
                            <div>
                                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 2px', color: '#111' }}>{lp.label}</h4>
                                <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>
                                    {hasContent ? `${page.content.replace(/<[^>]+>/g, '').substring(0, 80)}...` : 'No content yet'}
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                                fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px',
                                background: hasContent ? 'var(--color-primary-lightest)' : '#fef2f2',
                                color: hasContent ? '#16a34a' : '#dc2626',
                                textTransform: 'uppercase',
                            }}>
                                {hasContent ? 'Published' : 'Empty'}
                            </span>
                            <button onClick={() => startEdit(lp.slug)} style={{ ...btnSmall, fontWeight: 700 }}>
                                ✏️ Edit
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ─── HERO SLIDES TAB ─── */
function HeroSlidesTab({ data, setData, onSave, isSaving }: { data: any; setData: any; onSave: () => void; isSaving: boolean }) {
    const slides = data.heroSlides || [];

    // The homepage carousel re-sorts slides by their numeric `order`, so every mutation
    // must renumber `order` to match the array position — otherwise reordering/removal
    // saves fine but the live homepage restores the original sequence.
    const renumber = (arr: any[]) => arr.map((s: any, i: number) => ({ ...s, order: i }));
    const commit = (arr: any[]) => setData((p: any) => ({ ...p, heroSlides: renumber(arr) }));

    const addSlide = (imageUrl: string) => {
        if (!imageUrl) return;
        commit([...slides, { imageUrl, active: true }]);
    };

    // Bulk-add: append every uploaded image as a new slide.
    const addSlides = (urls: string[]) => {
        const clean = (urls || []).filter(Boolean);
        if (!clean.length) return;
        commit([...slides, ...clean.map((imageUrl) => ({ imageUrl, active: true }))]);
    };

    const removeSlide = (idx: number) => {
        commit(slides.filter((_: any, i: number) => i !== idx));
    };

    const moveSlide = (idx: number, direction: 'up' | 'down') => {
        const newSlides = [...slides];
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= newSlides.length) return;
        [newSlides[idx], newSlides[swapIdx]] = [newSlides[swapIdx], newSlides[idx]];
        commit(newSlides);
    };

    const handleSaveHero = async () => {
        // Update heroSlides in formData then trigger parent save
        onSave();
    };

    return (
        <div>
            {/* Info */}
            <div style={{ ...card, background: '#fffbeb', borderColor: '#fde68a' }}>
                <p style={{ fontSize: '12px', color: '#b45309', fontWeight: 600, margin: 0 }}>
                    🖼️ Hero slides appear at the top of your homepage as a banner carousel. Add multiple images and they will auto-rotate.
                </p>
            </div>

            {/* Current Slides */}
            {slides.length > 0 && (
                <div style={{ ...card }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px' }}>Current Slides ({slides.length})</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                        {slides.map((slide: any, idx: number) => (
                            <div key={idx} style={{
                                position: 'relative', borderRadius: '10px', overflow: 'hidden',
                                border: '1px solid #e5e7eb', background: '#f9fafb',
                            }}>
                                <img
                                    src={slide.imageUrl}
                                    alt={`Slide ${idx + 1}`}
                                    style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                                />
                                <div style={{ padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#555' }}>Slide {idx + 1}</span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                            onClick={() => moveSlide(idx, 'up')}
                                            disabled={idx === 0}
                                            style={{ ...btnSmall, padding: '4px 6px', opacity: idx === 0 ? 0.3 : 1 }}
                                            title="Move Up"
                                        >
                                            <LuArrowUp size={12} />
                                        </button>
                                        <button
                                            onClick={() => moveSlide(idx, 'down')}
                                            disabled={idx === slides.length - 1}
                                            style={{ ...btnSmall, padding: '4px 6px', opacity: idx === slides.length - 1 ? 0.3 : 1 }}
                                            title="Move Down"
                                        >
                                            <LuArrowDown size={12} />
                                        </button>
                                        <button
                                            onClick={() => removeSlide(idx)}
                                            style={{ ...btnSmall, padding: '4px 6px', background: '#fef2f2', color: '#dc2626' }}
                                            title="Delete"
                                        >
                                            <LuTrash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add New Slides — upload one or many at once */}
            <div style={card}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 6px' }}>Add Banner Images</h3>
                <p style={{ fontSize: '11px', color: '#888', margin: '0 0 8px' }}>
                    Select <strong>one or more</strong> images at once — each becomes a slide that auto-rotates on the homepage. You can reorder or remove them above, and change them anytime.
                </p>
                <div style={{
                    fontSize: '12px', color: '#b45309', fontWeight: 700, margin: '0 0 14px',
                    background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px 12px',
                }}>
                    📐 Recommended banner size: <strong>1920 × 540 px</strong> (16 : 4.5 ratio, wide &amp; short) &nbsp;·&nbsp; JPG / PNG / WebP &nbsp;·&nbsp; under 10&nbsp;MB each.
                    <br />Design all banners at this exact size so every slide looks sharp and aligned.
                </div>
                <MultipleImageUploader
                    label="Banner Images"
                    values={[]}
                    onChange={(urls) => addSlides(urls)}
                    max={10}
                />
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button onClick={handleSaveHero} disabled={isSaving} style={{ ...btnPrimary, opacity: isSaving ? 0.6 : 1 }}>
                    <LuSave size={13} /> {isSaving ? 'Saving...' : 'Save Hero Slides'}
                </button>
            </div>
        </div>
    );
}

/* ─── FEATURED CATEGORIES TAB ─── */
function FeaturedCategoriesTab({ data }: { data: any }) {
    const [updateContent, { isLoading: saving }] = useUpdateSiteContentMutation();
    const { data: catRes } = useGetCategoriesQuery({});
    const [uploadImage] = useUploadImageMutation();

    const categories: any[] = catRes?.data || [];
    const [items, setItems] = useState<any[]>(data?.featuredCategories || []);

    const parentCategories = categories.filter(c => !c.parent && !items.some(item => item.categoryId === c._id));
    
    // Update local state if global data changes
    useEffect(() => {
        if (data?.featuredCategories) {
            setItems(data.featuredCategories);
        }
    }, [data?.featuredCategories]);

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
            toast.success(`${name} added! Don't forget to save.`);
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
            toast.success('Image updated! Don\'t forget to save.', { id: toastId });
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
        const payload = items.map((it, i) => ({
            imageUrl: it.imageUrl,
            name: it.name,
            categoryId: it.categoryId || '',
            active: it.active !== false,
            order: i,
        }));
        try {
            await updateContent({ featuredCategories: payload }).unwrap();
            toast.success('Featured categories saved!');
        } catch (err: any) {
            toast.error(err?.data?.message || 'Could not save');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Save */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <div>
                    <h3 className="text-[15px] font-bold text-gray-800 m-0">Featured Categories Strip</h3>
                    <p className="text-xs text-gray-500 mt-1 mb-0">
                        Select a parent category and upload an image (1:1 ratio, transparent PNG). These show on the homepage.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', borderRadius: '7px', 
                        fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                        background: 'var(--color-primary)', color: '#fff', opacity: saving ? 0.6 : 1
                    }}
                >
                    <LuSave size={14} /> {saving ? 'Saving...' : 'Save Featured Categories'}
                </button>
            </div>

            {/* Add new */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Select Parent Category</label>
                        <select
                            value={newCategoryId}
                            onChange={(e) => setNewCategoryId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:border-[var(--color-primary)] focus:bg-white cursor-pointer transition-colors"
                        >
                            <option value="">— Select Category to Feature —</option>
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
                            className="w-full sm:w-auto px-5 py-2 rounded-lg text-sm font-bold text-[var(--color-primary)] bg-[var(--color-primary-lightest)] border border-transparent hover:border-[var(--color-primary)] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isUploading ? <LuLoader size={15} className="animate-spin" /> : <LuPlus size={15} />} 
                            {isUploading ? 'Uploading...' : 'Upload Image'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Current list */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="text-[13px] font-bold text-gray-800 mb-4 uppercase tracking-wider">Current items ({items.length})</p>
                
                {items.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <LuStar size={32} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-xs">No featured categories yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {items.map((it, idx) => (
                            <div key={idx} className={`border rounded-xl overflow-hidden bg-white shadow-sm flex flex-col group ${it.active === false ? 'border-gray-200 opacity-60' : 'border-gray-100 hover:border-[var(--color-primary)] transition-all'}`}>
                                <div className="aspect-[4/3] bg-gray-50 overflow-hidden relative">
                                    <SmartImage src={it.imageUrl} alt={it.name} width={200} height={200} className="w-full h-full object-contain p-2 transition-transform group-hover:scale-105 duration-300" />
                                    
                                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white">
                                        <LuImage size={20} className="mb-1" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Change</span>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={(e) => handleUpdateImage(idx, e)} 
                                        />
                                    </label>
                                </div>
                                <div className="p-3 flex flex-col flex-1 bg-white">
                                    <p className="font-bold text-[12px] text-gray-800 truncate" title={it.name}>{it.name}</p>
                                    <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-50">
                                        <button onClick={() => move(idx, -1)} disabled={idx === 0} title="Move left" className="p-1 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"><LuArrowUp size={13} className="rotate-[-90deg]" /></button>
                                        <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1} title="Move right" className="p-1 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"><LuArrowDown size={13} className="rotate-[-90deg]" /></button>
                                        <button onClick={() => toggleActive(idx)} title={it.active === false ? 'Show' : 'Hide'} className="p-1 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 ml-1">
                                            {it.active === false ? <LuEyeOff size={13} /> : <LuEye size={13} />}
                                        </button>
                                        <button onClick={() => removeItem(idx)} title="Remove" className="p-1 rounded text-red-400 hover:bg-red-50 hover:text-red-600 ml-auto"><LuTrash2 size={13} /></button>
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

/* ─── FEATURES STRIP TAB ─── */
import { useUpdateSiteSectionMutation } from '@/redux/api/siteContentApi';
function FeaturesStripTab({ data }: { data: any }) {
    const [save, { isLoading: saving }] = useUpdateSiteSectionMutation();
    const [items, setItems] = useState<FeatureItem[]>([]);

    useEffect(() => {
        const saved = (data?.features || []) as FeatureItem[];
        setItems((saved.length > 0 ? saved : DEFAULT_FEATURES).map((f) => ({
            icon: f.icon || 'truck',
            title: f.title || '',
            description: f.description || '',
            active: f.active !== false,
            order: f.order ?? 0,
        })));
    }, [data?.features]);

    const update = (i: number, patch: Partial<FeatureItem>) =>
        setItems((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
    const remove = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
    const move = (i: number, dir: -1 | 1) => setItems((prev) => {
        const j = i + dir;
        if (j < 0 || j >= prev.length) return prev;
        const next = [...prev];
        [next[i], next[j]] = [next[j], next[i]];
        return next;
    });
    const add = () => setItems((prev) => [...prev, { icon: 'gift', title: 'New feature', description: 'Short description', active: true, order: prev.length }]);

    const handleSave = async () => {
        const clean = items
            .map((f, i) => ({ ...f, title: f.title.trim(), description: f.description, order: i }))
            .filter((f) => f.title.length > 0);
        if (clean.length === 0) return toast.error('Add at least one feature with a title');
        try {
            await save({ section: 'features', data: clean }).unwrap();
            toast.success('Features saved — the storefront is updated');
        } catch (e: any) {
            toast.error(e?.data?.message || 'Could not save features');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header */}
            <div style={{ ...card, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}><LuSparkles size={18} color="var(--color-primary)" /> Features Strip</h3>
                    <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>The row under the hero banner (Free Shipping, Support 24/7…). Edits appear immediately.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={add} style={btnSmall}><LuPlus size={14} /> Add feature</button>
                    <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, padding: '8px 16px' }}>
                        {saving ? <><LuLoader className="animate-spin" size={14} /> Saving...</> : <><LuSave size={14} /> Save changes</>}
                    </button>
                </div>
            </div>

            {/* Editor rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {items.map((f, i) => {
                    const Icon = featureIcon(f.icon);
                    return (
                        <div key={i} style={{ ...card, border: f.active === false ? '1px solid #e5e7eb' : '1px solid var(--color-primary-lightest)', opacity: f.active === false ? 0.7 : 1 }}>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                {/* Icon preview + picker */}
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--color-primary-lightest)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Icon size={20} strokeWidth={1.5} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={label}>Icon</label>
                                        <select value={f.icon} onChange={(e) => update(i, { icon: e.target.value })} style={{ ...input, width: '130px', padding: '6px' }}>
                                            {FEATURE_ICON_KEYS.map((k) => <option key={k} value={k}>{FEATURE_ICONS[k].label}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Title + description */}
                                <div style={{ flex: 1, minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px' }}>
                                        <div>
                                            <label style={label}>Title</label>
                                            <input value={f.title} onChange={(e) => update(i, { title: e.target.value })} placeholder="e.g. Free Shipping" style={input} />
                                        </div>
                                        <div>
                                            <label style={label}>Description</label>
                                            <textarea value={f.description} onChange={(e) => update(i, { description: e.target.value })} rows={1} placeholder="Short text" style={{ ...input, resize: 'vertical' }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <button onClick={() => update(i, { active: !(f.active !== false) })} title={f.active !== false ? 'Visible' : 'Hidden'} style={{ ...btnSmall, background: f.active !== false ? '#ecfdf5' : '#f9fafb', color: f.active !== false ? '#059669' : '#9ca3af', borderColor: f.active !== false ? '#a7f3d0' : '#e5e7eb' }}>
                                        {f.active !== false ? <LuEye size={15} /> : <LuEyeOff size={15} />}
                                    </button>
                                    <button onClick={() => move(i, -1)} disabled={i === 0} style={btnSmall}><LuArrowUp size={14} /></button>
                                    <button onClick={() => move(i, 1)} disabled={i === items.length - 1} style={btnSmall}><LuArrowDown size={14} /></button>
                                    <button onClick={() => remove(i)} style={btnDanger}><LuTrash2 size={14} /></button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {items.length === 0 && (
                    <div style={{ ...card, textAlign: 'center', padding: '40px' }}>
                        <p style={{ fontSize: '14px', color: '#888' }}>No features added. Click "Add feature" above.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
