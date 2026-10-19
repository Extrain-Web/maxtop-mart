import { Schema, model } from 'mongoose';

// ── Ticker Item ──
const tickerItemSchema = new Schema({
    text: { type: String, required: true },
    emoji: { type: String, default: '' },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
}, { _id: true });

// ── Contact Info ──
const businessHourSchema = new Schema({
    day: { type: String, required: true },
    time: { type: String, required: true },
}, { _id: true });

const socialLinkSchema = new Schema({
    label: { type: String, required: true },
    url: { type: String, default: '#' },
    color: { type: String, default: '#000000' },
}, { _id: true });

// ── Homepage "features strip" item (Free Shipping / Support 24/7 / …) ──
const featureItemSchema = new Schema({
    icon: { type: String, default: 'truck' },   // key into the client FEATURE_ICONS map
    title: { type: String, required: true },
    description: { type: String, default: '' },  // newlines render as separate lines
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
}, { _id: true });

// ── Main Site Content Schema ──
const siteContentSchema = new Schema({
    // Only one document — singleton
    _key: { type: String, default: 'main', unique: true },

    // ── Header Ticker ──
    ticker: [tickerItemSchema],

    // ── Homepage features strip (admin-editable) ──
    features: [featureItemSchema],

    // ── Contact Page ──
    contact: {
        phone: { type: String, default: '' },            // primary phone (for tel: links)
        phones: { type: [String], default: [] },         // additional phones — shown as list
        whatsapp: { type: String, default: '' },
        email: { type: String, default: '' },
        emails: { type: [String], default: [] },         // additional emails
        address: { type: String, default: '' },
        corporateOffice: { type: String, default: '' },  // corporate/head office address
        warehouse: { type: String, default: '' },        // warehouse address
        website: { type: String, default: '' },
        hours: [businessHourSchema],
        tips: [{ type: String }],
        socials: [socialLinkSchema],
        subjects: [{ type: String }],
    },

    // ── Floating Widget ──
    floating: {
        phone: { type: String, default: '' },
        whatsapp: { type: String, default: '' },
        messenger: { type: String, default: '' },
        showPhone: { type: Boolean, default: true },
        showWhatsapp: { type: Boolean, default: true },
        showMessenger: { type: Boolean, default: true },
    },

    // ── Mobile Payment Numbers & Bank Accounts ──
    payment: {
        methods: [{
            type: { type: String, required: true }, // 'bkash', 'nagad', 'rocket', 'upay', 'bank'
            providerName: { type: String, default: '' }, // e.g. 'City Bank', 'Brac Bank'
            accountName: { type: String, default: '' },
            accountNumber: { type: String, required: true },
            accountType: { type: String, default: 'Personal' },
            branch: { type: String, default: '' },
            routing: { type: String, default: '' },
            active: { type: Boolean, default: true },
            logo: { type: String, default: '' },
        }],
        cod:    { active: { type: Boolean, default: true } }, // Cash on Delivery show/hide toggle
        instructions: { type: String, default: 'Send Money to the number above, then submit your number, transaction ID and payment time below.' },
    },

    // ── Default Product Tagline ──
    defaultTagline: { type: String, default: 'Your trusted online marketplace' },

    // ── SEO / Meta ──
    seo: {
        title: { type: String, default: 'Maxtop Mart - Your trusted online marketplace' },
        description: { type: String, default: 'Shop the latest products with amazing deals at Maxtop Mart.' },
        keywords: { type: String, default: 'maxtop mart, maxtopmart, ecommerce, online shopping' },
    },

    // ── Announcement Bar ──
    announcement: {
        message: { type: String, default: '' },
        bgColor: { type: String, default: '#E4525C' },
        textColor: { type: String, default: '#FFFFFF' },
        active: { type: Boolean, default: false },
        dismissible: { type: Boolean, default: true },
    },

    // ── Legal Pages (Terms, Privacy, Refund) ──
    legalPages: [{
        slug: { type: String, required: true, enum: ['terms', 'privacy', 'refund'] },
        title: { type: String, required: true },
        content: { type: String, default: '' },
        active: { type: Boolean, default: true },
        lastUpdated: { type: Date, default: Date.now },
    }],

    // ── Theme / Appearance ──
    theme: {
        primaryColor: { type: String, default: '#4F46E5' },
        secondaryColor: { type: String, default: '#6366F1' },
        logoUrl: { type: String, default: '' },
        faviconUrl: { type: String, default: '' },
    },

    // ── Hero Slides ──
    heroSlides: [{
        imageUrl: { type: String, required: true },
        active: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
    }],

    // ── Featured Categories (homepage strip; fully admin-managed) ──
    // Each card = an uploaded image + a name + the category whose products it
    // opens. Rendered on the homepage in place of the old emoji tiles.
    featuredCategories: [{
        imageUrl: { type: String, required: true },
        name: { type: String, required: true },
        categoryId: { type: String, default: '' }, // links the card → /products?category=<id>
        active: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
    }],

}, { timestamps: true });

export const SiteContent = model('SiteContent', siteContentSchema);
