import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { Order } from './order.model';

/**
 * Returns & Refunds = orders that failed at (or came back from) the courier.
 * We treat the order statuses `returned`, `cancelled` and `refunded` as the
 * return/refund bucket. This module powers the admin Returns board plus its
 * professional CSV + PDF report exports.
 */
const RETURN_STATUSES = ['returned', 'cancelled', 'refunded'];
const BRAND = '#ea580c';

export interface ReturnRow {
    orderId: string;
    date: string;
    customer: string;
    phone: string;
    address: string;
    itemsText: string;
    itemCount: number;
    total: number;
    paymentMethod: string;
    paymentStatus: string;
    status: string;
    courierStatus: string;
    consignmentId: string;
    trackingNumber: string;
    reason: string;
}

const money = (n: number) => 'BDT ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d?: any) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const humanize = (s: string) => (s || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();

const mapRow = (o: any): ReturnRow => {
    const u = o.user || {};
    const ship = o.shippingAddress || {};
    const customer = `${u.firstName || ''} ${u.lastName || ''}`.trim() || ship.fullName || '—';
    const items = o.items || [];
    const itemsText = items.map((it: any) => `${it.quantity || 1}× ${it.name || ''}`.trim()).join('; ');
    // The reason is the note on the latest return/cancel/refund timeline entry.
    const tl = (o.timeline || []).filter((t: any) => RETURN_STATUSES.includes(t.status));
    const reason = (tl.length ? tl[tl.length - 1].note : '') || '';
    return {
        orderId: o.orderId || String(o._id),
        date: o.createdAt,
        customer,
        phone: ship.phone || u.phone || '',
        address: [ship.address, ship.area, ship.city, ship.postalCode].filter(Boolean).join(', '),
        itemsText,
        itemCount: items.length,
        total: o.total || 0,
        paymentMethod: o.paymentMethod || '',
        paymentStatus: o.paymentStatus || '',
        status: o.status,
        courierStatus: o.courierStatus || '',
        consignmentId: o.consignmentId || '',
        trackingNumber: o.trackingNumber || '',
        reason,
    };
};

const buildFilter = (status?: string, search?: string) => {
    const filter: any = { status: { $in: RETURN_STATUSES } };
    if (status && RETURN_STATUSES.includes(status)) filter.status = status;
    const s = (search || '').trim();
    if (s) {
        filter.$or = [
            { orderId: { $regex: s, $options: 'i' } },
            { 'shippingAddress.fullName': { $regex: s, $options: 'i' } },
            { 'shippingAddress.phone': { $regex: s, $options: 'i' } },
            { trackingNumber: { $regex: s, $options: 'i' } },
            { consignmentId: { $regex: s, $options: 'i' } },
        ];
    }
    return filter;
};

const fetchRows = async (filter: any, opts?: { skip?: number; limit?: number }): Promise<ReturnRow[]> => {
    let q = Order.find(filter).populate('user', 'firstName lastName email phone').sort({ updatedAt: -1 });
    if (opts?.skip != null) q = q.skip(opts.skip);
    if (opts?.limit != null) q = q.limit(opts.limit);
    const orders = await q.lean();
    return orders.map(mapRow);
};

/** Paginated list for the admin Returns board, plus live counts per status. */
export const getReturnOrders = async (query: Record<string, any>) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 20);
    const filter = buildFilter(query.status, query.search);

    const [rows, total, returned, cancelled, refunded] = await Promise.all([
        fetchRows(filter, { skip: (page - 1) * limit, limit }),
        Order.countDocuments(filter),
        Order.countDocuments({ status: 'returned' }),
        Order.countDocuments({ status: 'cancelled' }),
        Order.countDocuments({ status: 'refunded' }),
    ]);

    return {
        data: rows,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
        counts: { all: returned + cancelled + refunded, returned, cancelled, refunded },
    };
};

/** Every matching row (no pagination) — used by the CSV / PDF exports. */
export const getReturnRowsForExport = async (query: Record<string, any>): Promise<ReturnRow[]> =>
    fetchRows(buildFilter(query.status, query.search));

// ── CSV ──────────────────────────────────────────────────────────────
const csvCell = (v: any) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const buildReturnsCsv = (rows: ReturnRow[]): string => {
    const headers = [
        'Order ID', 'Date', 'Customer', 'Phone', 'Address', 'Items', 'Qty',
        'Amount (BDT)', 'Payment Method', 'Payment Status', 'Order Status',
        'Courier Status', 'Consignment ID', 'Tracking No', 'Reason',
    ];
    const lines = [headers.join(',')];
    for (const r of rows) {
        lines.push([
            r.orderId, fmtDate(r.date), r.customer, r.phone, r.address, r.itemsText, r.itemCount,
            r.total, r.paymentMethod.toUpperCase(), r.paymentStatus, humanize(r.status),
            humanize(r.courierStatus), r.consignmentId, r.trackingNumber, r.reason,
        ].map(csvCell).join(','));
    }
    // Totals row for the finance team.
    const grand = rows.reduce((s, r) => s + (r.total || 0), 0);
    lines.push('');
    lines.push(['', '', '', '', '', '', `TOTAL ${rows.length}`, grand].map(csvCell).join(','));
    return '﻿' + lines.join('\r\n'); // BOM so Excel reads UTF-8 correctly
};

// ── PDF (professional one-piece report) ──────────────────────────────
export const streamReturnsPdf = (res: Response, rows: ReturnRow[], meta?: { status?: string }) => {
    const doc = new PDFDocument({ size: 'A4', margin: 36, layout: 'landscape' });
    doc.pipe(res);

    const left = 36;
    const pageW = doc.page.width;
    const width = pageW - 72;

    // Header band
    doc.rect(0, 0, pageW, 72).fill(BRAND);
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(18).text('Maxtop Mart', left, 20);
    doc.font('Helvetica').fontSize(10).text('Returns & Refunds Report', left, 44);
    const scope = meta?.status && RETURN_STATUSES.includes(meta.status) ? humanize(meta.status) : 'All returns & refunds';
    doc.fontSize(9).text(`${scope}  ·  Generated ${new Date().toLocaleString('en-GB')}`, left, 44, { width, align: 'right' });
    doc.fillColor('#000');

    // Summary line
    const grand = rows.reduce((s, r) => s + (r.total || 0), 0);
    let y = 90;
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#111')
        .text(`${rows.length} order(s)`, left, y)
        .text(`Total value: ${money(grand)}`, left, y, { width, align: 'right' });
    y += 22;

    // Table
    const cols = [
        { h: 'Order', w: 0.10, k: (r: ReturnRow) => r.orderId },
        { h: 'Date', w: 0.09, k: (r: ReturnRow) => fmtDate(r.date) },
        { h: 'Customer', w: 0.15, k: (r: ReturnRow) => r.customer },
        { h: 'Phone', w: 0.10, k: (r: ReturnRow) => r.phone },
        { h: 'Items', w: 0.20, k: (r: ReturnRow) => r.itemsText },
        { h: 'Amount', w: 0.10, k: (r: ReturnRow) => money(r.total), right: true },
        { h: 'Status', w: 0.08, k: (r: ReturnRow) => humanize(r.status) },
        { h: 'Courier', w: 0.08, k: (r: ReturnRow) => humanize(r.courierStatus) || '—' },
        { h: 'Reason', w: 0.10, k: (r: ReturnRow) => r.reason || '—' },
    ];
    const colX: number[] = [];
    let acc = left;
    cols.forEach((c) => { colX.push(acc); acc += c.w * width; });

    const header = () => {
        doc.rect(left, y, width, 20).fill('#f3f4f6');
        doc.fillColor('#374151').font('Helvetica-Bold').fontSize(8.5);
        cols.forEach((c, i) => doc.text(c.h.toUpperCase(), colX[i] + 4, y + 6, { width: c.w * width - 8, align: c.right ? 'right' : 'left', lineBreak: false }));
        y += 20;
    };
    header();

    doc.font('Helvetica').fontSize(8.5).fillColor('#111');
    for (const r of rows) {
        if (y > doc.page.height - 50) { doc.addPage({ size: 'A4', margin: 36, layout: 'landscape' }); y = 40; header(); doc.font('Helvetica').fontSize(8.5).fillColor('#111'); }
        const rowH = 18;
        cols.forEach((c, i) => {
            doc.fillColor(i === 6 ? '#b45309' : '#111')
                .text(String(c.k(r)), colX[i] + 4, y + 5, { width: c.w * width - 8, align: c.right ? 'right' : 'left', height: rowH, ellipsis: true, lineBreak: false });
        });
        y += rowH;
        doc.moveTo(left, y).lineTo(left + width, y).strokeColor('#f0f0f0').lineWidth(0.5).stroke();
    }

    // Grand total row
    y += 4;
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#111')
        .text('GRAND TOTAL', colX[4] + 4, y, { width: cols[4].w * width - 8 })
        .text(money(grand), colX[5] + 4, y, { width: cols[5].w * width - 8, align: 'right' });

    doc.end();
};
