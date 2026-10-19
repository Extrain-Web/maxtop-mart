import PDFDocument from 'pdfkit';
import { Order } from '../order/order.model';
import { SiteContent } from '../siteContent/siteContent.model';
import AppError from '../../utils/AppError';
import { sendEmail } from '../../utils/email';
import path from 'path';
import fs from 'fs';

// ── Invoice data shapes (the contract the frontend consumes) ────────
export interface IInvoiceItem {
    name: string;
    sku: string;
    price: number;
    quantity: number;
    total: number;
}

export interface IInvoiceData {
    invoiceNumber: string;
    orderId: string;
    date: string;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    brand: 'Maxtop Mart';
    billTo: { name: string; phone: string; email: string };
    shipTo: {
        name: string;
        phone: string;
        address: string;
        area: string;
        city: string;
        postalCode: string;
    };
    items: IInvoiceItem[];
    subtotal: number;
    shippingCost: number;
    discount: number;
    total: number;
    couponCode: string;
}

const LOGO_PATH = path.join(process.cwd(), 'public', 'logo.png');
const ORANGE = '#ea580c';

const fmt = (n: number): string => `BDT ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Fetch an order with the populated fields invoices need.
 */
const fetchOrder = async (orderId: string): Promise<any> => {
    const order = await Order.findById(orderId)
        .populate('user', 'firstName lastName email phone')
        .populate('items.product', 'name sku thumbnail');
    if (!order) throw new AppError(404, 'Order not found');
    return order;
};

/**
 * Build the customer-facing InvoiceData from an order.
 */
const buildCustomerInvoice = (order: any): IInvoiceData => {
    const user = order.user || {};
    const ship = order.shippingAddress || {};
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || ship.fullName || '';

    const items: IInvoiceItem[] = (order.items || []).map((item: any) => ({
        name: item.name,
        sku: item.product?.sku || '',
        price: item.price,
        quantity: item.quantity,
        total: item.total,
    }));

    return {
        invoiceNumber: `INV-${order.orderId}`,
        orderId: order.orderId,
        date: new Date(order.createdAt).toISOString(),
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        brand: 'Maxtop Mart',
        billTo: {
            name,
            phone: ship.phone || user.phone || '',
            email: user.email || ship.email || '',
        },
        shipTo: {
            name: ship.fullName || name,
            phone: ship.phone || '',
            address: ship.address || '',
            area: ship.area || '',
            city: ship.city || '',
            postalCode: ship.postalCode || '',
        },
        items,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost || 0,
        discount: order.discount || 0,
        total: order.total,
        couponCode: order.couponCode || '',
    };
};

/**
 * Render an InvoiceData to a single-page PDF Buffer using pdfkit.
 */
const generateInvoicePdf = (invoice: IInvoiceData): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 40 });
            const chunks: Buffer[] = [];
            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err: Error) => reject(err));

            const pageWidth = doc.page.width;
            const pageHeight = doc.page.height;
            const left = doc.page.margins.left;
            const right = pageWidth - doc.page.margins.right;
            const contentWidth = right - left;

            // Helper to add watermark
            const addWatermark = () => {
                if (fs.existsSync(LOGO_PATH)) {
                    doc.save();
                    doc.opacity(0.05);
                    // Center watermark
                    doc.image(LOGO_PATH, pageWidth / 2 - 150, pageHeight / 2 - 50, { width: 300, align: 'center', valign: 'center' });
                    doc.restore();
                }
            };
            
            // Add watermark to first page
            addWatermark();
            
            doc.on('pageAdded', () => {
                addWatermark();
            });

            // ── Header ──
            if (fs.existsSync(LOGO_PATH)) {
                doc.image(LOGO_PATH, left, 40, { width: 140 });
            } else {
                doc.fillColor('#333333').fontSize(26).font('Helvetica-Bold').text('Maxtop Mart', left, 40);
            }
            
            doc.fontSize(20).font('Helvetica-Bold').fillColor('#333333').text('INVOICE', left, 40, { width: contentWidth, align: 'right' });

            const dateStr = new Date(invoice.date).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
            });
            doc.fontSize(10).font('Helvetica').fillColor('#666666').text(`Invoice Number: `, left, 75, { width: contentWidth, align: 'right', continued: true })
               .font('Helvetica-Bold').fillColor('#333333').text(` ${invoice.invoiceNumber}`);
            doc.font('Helvetica').fillColor('#666666').text(`Order Date: ${dateStr}`, left, 90, { width: contentWidth, align: 'right' });
            doc.text(`Order ID: ${invoice.orderId}`, left, 105, { width: contentWidth, align: 'right' });

            doc.moveTo(left, 130).lineTo(right, 130).strokeColor('#E5E7EB').lineWidth(1).stroke();

            let y = 150;

            // ── Bill To / Ship To columns ──
            const colW = contentWidth / 2 - 10;
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333').text('Bill To:', left, y);
            doc.fillColor('#555555').font('Helvetica').fontSize(10);
            doc.text(invoice.billTo.name, left, y + 16, { width: colW });
            doc.text(invoice.billTo.phone, left, y + 30, { width: colW });
            if (invoice.billTo.email) doc.text(invoice.billTo.email, left, y + 44, { width: colW });

            const col2 = left + colW + 20;
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333').text('Ship To:', col2, y);
            doc.fillColor('#555555').font('Helvetica').fontSize(10);
            doc.text(invoice.shipTo.name, col2, y + 16, { width: colW });
            const addrLine = [invoice.shipTo.address, invoice.shipTo.area, invoice.shipTo.city, invoice.shipTo.postalCode]
                .filter(Boolean).join(', ');
            doc.text(addrLine, col2, y + 30, { width: colW });
            doc.text(invoice.shipTo.phone, col2, y + 60, { width: colW });

            y += 100;

            // ── Items table ──
            const cols = {
                item: left,
                sku: left + contentWidth * 0.45,
                price: left + contentWidth * 0.65,
                qty: left + contentWidth * 0.80,
                total: left + contentWidth * 0.88,
            };

            doc.moveTo(left, y - 5).lineTo(right, y - 5).strokeColor('#333333').lineWidth(1.5).stroke();
            doc.fillColor('#333333').fontSize(10).font('Helvetica-Bold');
            doc.text('Description', cols.item, y);
            doc.text('SKU', cols.sku, y);
            doc.text('Price', cols.price, y, { width: contentWidth * 0.15, align: 'right' });
            doc.text('Qty', cols.qty, y, { width: contentWidth * 0.08, align: 'right' });
            doc.text('Total', cols.total, y, { width: contentWidth * 0.12, align: 'right' });
            doc.moveTo(left, y + 15).lineTo(right, y + 15).strokeColor('#E5E7EB').lineWidth(1).stroke();

            y += 25;
            doc.fillColor('#555555').font('Helvetica').fontSize(10);

            for (const item of invoice.items) {
                const rowH = 25;
                if (y + rowH > pageHeight - 150) {
                    doc.addPage();
                    y = 50;
                }
                doc.fillColor('#333333');
                doc.text(item.name, cols.item, y, { width: contentWidth * 0.43, ellipsis: true });
                doc.fillColor('#666666');
                doc.text(item.sku || '-', cols.sku, y, { width: contentWidth * 0.20 });
                doc.fillColor('#333333');
                doc.text(fmt(item.price), cols.price, y, { width: contentWidth * 0.15, align: 'right' });
                doc.text(String(item.quantity), cols.qty, y, { width: contentWidth * 0.08, align: 'right' });
                doc.text(fmt(item.total), cols.total, y, { width: contentWidth * 0.12, align: 'right' });
                doc.moveTo(left, y + 15).lineTo(right, y + 15).strokeColor('#F3F4F6').lineWidth(1).stroke();
                y += rowH;
            }

            y += 20;

            // ── Totals block (right aligned) ──
            const totalsX = left + contentWidth * 0.55;
            const totalsW = contentWidth * 0.45;
            const labelW = totalsW * 0.55;
            const valW = totalsW * 0.45;

            const totalRow = (label: string, value: string, bold = false, color = '#555555', border = false) => {
                if (border) {
                    doc.moveTo(totalsX, y - 5).lineTo(right, y - 5).strokeColor('#333333').lineWidth(1).stroke();
                }
                doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 12 : 10).fillColor(color);
                doc.text(label, totalsX, y, { width: labelW });
                doc.text(value, totalsX + labelW, y, { width: valW, align: 'right' });
                y += bold ? 24 : 20;
            };

            totalRow('Subtotal:', fmt(invoice.subtotal));
            if (invoice.shippingCost > 0) totalRow('Shipping:', fmt(invoice.shippingCost));
            if (invoice.discount > 0) totalRow('Discount:', `- ${fmt(invoice.discount)}`);
            totalRow('Grand Total:', fmt(invoice.total), true, '#111827', true);

            // ── Payment info ──
            y -= (invoice.discount > 0 ? 64 : 44);
            if (invoice.shippingCost > 0) y -= 20;

            doc.fillColor('#333333').font('Helvetica-Bold').fontSize(10);
            doc.text('Order Info', left, y);
            y += 15;
            doc.fillColor('#555555').font('Helvetica').fontSize(9);
            
            let paymentMethodDisplay = invoice.paymentMethod;
            if (paymentMethodDisplay.toLowerCase() === 'cod') paymentMethodDisplay = 'Cash on Delivery';
            
            doc.text(`Payment Method: ${paymentMethodDisplay.toUpperCase()}`, left, y);
            doc.text(`Payment Status: ${invoice.paymentStatus.toUpperCase()}`, left, y + 14);
            doc.text(`Order Status: ${invoice.status.toUpperCase()}`, left, y + 28);

            // ── Footer ──
            doc.font('Helvetica-Oblique').fontSize(10).fillColor('#9CA3AF')
                .text('Thank you for shopping with Maxtop Mart', left, pageHeight - 60, {
                    width: contentWidth, align: 'center',
                });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};

/**
 * Extra, courier-oriented fields the thermal label needs on top of the
 * customer invoice data.
 */
export interface ILabelOptions {
    logoPath?: string;                                   // local PNG/JPG file to stamp top-left
    consignmentId?: string;                              // courier consignment / tracking id
    from?: { name: string; address: string; phone: string };
}

// ── Code128 (Set B) ─────────────────────────────────────────────────
// A real, scannable barcode drawn directly with pdfkit rectangles — no
// third-party barcode dependency (kept deliberately self-contained).
// Each pattern is the module-width sequence (bar, space, bar, …) for one
// symbol; index == the symbol's code value. Index 104 = Start-B,
// 106 = Stop.
const CODE128_PATTERNS: string[] = [
    '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312',
    '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222',
    '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131',
    '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321',
    '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
    '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121',
    '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321',
    '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224',
    '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114',
    '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
    '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112',
    '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113',
    '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412',
    '211214', '211232', '2331112',
];

/** Encode a string into Code128-B symbol values (with start, checksum, stop). */
const encodeCode128B = (data: string): number[] => {
    const codes: number[] = [104]; // Start B
    for (const ch of data) {
        const v = ch.charCodeAt(0) - 32;
        if (v >= 0 && v < 95) codes.push(v);
    }
    let sum = codes[0];
    for (let i = 1; i < codes.length; i++) sum += codes[i] * i;
    codes.push(sum % 103); // checksum
    codes.push(106);       // Stop
    return codes;
};

/** Draw a Code128 barcode as solid bars inside the given box. */
const drawBarcode = (
    doc: PDFKit.PDFDocument,
    data: string,
    x: number,
    y: number,
    width: number,
    height: number,
): void => {
    const patterns = encodeCode128B(data).map((c) => CODE128_PATTERNS[c]);
    let totalModules = 0;
    for (const p of patterns) for (const d of p) totalModules += Number(d);
    const mw = width / totalModules;
    let cx = x;
    doc.save();
    doc.fillColor('#111111');
    for (const p of patterns) {
        let bar = true; // patterns always start with a bar
        for (const d of p) {
            const w = Number(d) * mw;
            if (bar) doc.rect(cx, y, w, height).fill();
            cx += w;
            bar = !bar;
        }
    }
    doc.restore();
};

/**
 * Generate a professional 4x6" (288x432pt) thermal shipping label:
 * dynamic brand logo, clean wordmark, a real Code128 barcode, consignment
 * & order codes, a bordered DELIVER-TO block, the sender (FROM) address and
 * a prominent cash-to-collect banner for COD orders.
 */
const generateThermalLabelPdf = (invoice: IInvoiceData, opts: ILabelOptions = {}): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        try {
            const W = 288;
            const M = 16;            // outer margin
            const L = M;             // left edge of content
            const R = W - M;         // right edge of content
            const innerW = R - L;    // usable width

            const doc = new PDFDocument({ size: [W, 432], margin: M });
            const chunks: Buffer[] = [];
            doc.on('data', (c: Buffer) => chunks.push(c));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err: Error) => reject(err));

            const INK = '#111111';
            const MUTE = '#6b7280';
            const taka = (n: number): string => `Tk ${Number(n || 0).toLocaleString('en-US')}`;
            const isCOD = /cod|cash/i.test(invoice.paymentMethod || '');
            const payLabel = isCOD ? 'Cash on Delivery' : 'Prepaid';

            // ── Header: logo + wordmark (left), date + payment (right) ──
            let brandX = L;
            if (opts.logoPath) {
                try {
                    doc.image(opts.logoPath, L, 14, { fit: [40, 40] });
                    brandX = L + 48;
                } catch {
                    brandX = L; // unsupported/corrupt image — fall back to wordmark only
                }
            }
            doc.fillColor(INK).font('Helvetica-Bold').fontSize(16).text('Maxtop Mart', brandX, 18, {
                width: R - brandX - 70,
                lineBreak: false,
            });
            doc.fillColor(MUTE).font('Helvetica').fontSize(7).text('maxtopmartbd.com', brandX, 37);

            const dateStr = new Date(invoice.date).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
            });
            doc.fillColor(MUTE).font('Helvetica').fontSize(7.5).text(dateStr, R - 90, 18, { width: 90, align: 'right' });
            doc.fillColor(isCOD ? '#b91c1c' : '#047857').font('Helvetica-Bold').fontSize(8.5)
                .text(payLabel.toUpperCase(), R - 90, 31, { width: 90, align: 'right' });

            doc.moveTo(L, 58).lineTo(R, 58).strokeColor('#e5e7eb').lineWidth(1).stroke();

            // ── Barcode (encodes the order id — Fantacy's own code) ──
            const barcodeData = (invoice.orderId || '').toUpperCase();
            if (barcodeData) {
                drawBarcode(doc, barcodeData, L + 8, 68, innerW - 16, 40);
            }
            doc.fillColor(INK).font('Helvetica-Bold').fontSize(11)
                .text(barcodeData, L, 112, { width: innerW, align: 'center', characterSpacing: 1 });

            doc.moveTo(L, 132).lineTo(R, 132).strokeColor('#e5e7eb').lineWidth(1).stroke();

            // ── ID row: order no. (left) + consignment (right) ──
            doc.fillColor(MUTE).font('Helvetica').fontSize(6.5).text('ORDER NO.', L, 138);
            doc.fillColor(INK).font('Helvetica-Bold').fontSize(10).text(invoice.orderId, L, 147);

            const cid = opts.consignmentId || '';
            doc.fillColor(MUTE).font('Helvetica').fontSize(6.5).text('CONSIGNMENT', L + innerW / 2, 138, { width: innerW / 2, align: 'right' });
            doc.fillColor(INK).font('Helvetica-Bold').fontSize(10).text(cid || '—', L + innerW / 2, 147, { width: innerW / 2, align: 'right' });

            // ── DELIVER TO box ──
            const boxY = 168;
            const boxH = 92;
            doc.roundedRect(L, boxY, innerW, boxH, 6).lineWidth(1.2).strokeColor('#111111').stroke();
            doc.fillColor('#ea580c').font('Helvetica-Bold').fontSize(8).text('DELIVER TO', L + 10, boxY + 8, { characterSpacing: 0.5 });
            doc.fillColor(INK).font('Helvetica-Bold').fontSize(13).text(invoice.shipTo.name || invoice.billTo.name, L + 10, boxY + 22, { width: innerW - 20, lineBreak: false });
            doc.fillColor(INK).font('Helvetica-Bold').fontSize(11).text(invoice.shipTo.phone || invoice.billTo.phone, L + 10, boxY + 40);

            const addrLine = [invoice.shipTo.address, invoice.shipTo.area, invoice.shipTo.city, invoice.shipTo.postalCode]
                .filter(Boolean).join(', ');
            doc.fillColor('#374151').font('Helvetica').fontSize(9).text(addrLine, L + 10, boxY + 56, { width: innerW - 20, height: 30 });

            // ── Product details ──
            let y = boxY + boxH + 12;
            doc.fillColor(MUTE).font('Helvetica-Bold').fontSize(6.5).text('PRODUCT DETAILS', L, y, { characterSpacing: 0.5 });
            y += 12;
            doc.fillColor(INK).font('Helvetica').fontSize(8.5);
            const maxItems = 4;
            for (let i = 0; i < Math.min(invoice.items.length, maxItems); i++) {
                const it = invoice.items[i];
                doc.text(`${it.quantity} x ${it.name}`, L, y, { width: innerW, height: 11, lineBreak: false, ellipsis: true });
                y += 12;
            }
            if (invoice.items.length > maxItems) {
                doc.fillColor(MUTE).font('Helvetica-Oblique').fontSize(8)
                    .text(`+ ${invoice.items.length - maxItems} more item(s)`, L, y);
                y += 12;
            }

            // ── FROM (sender) ──
            const from = opts.from;
            if (from) {
                const fromY = 346;
                doc.moveTo(L, fromY - 6).lineTo(R, fromY - 6).strokeColor('#e5e7eb').lineWidth(0.8).stroke();
                doc.fillColor(MUTE).font('Helvetica-Bold').fontSize(6.5).text('FROM', L, fromY, { characterSpacing: 0.5 });
                const fromLine = [from.name, from.address, from.phone].filter(Boolean).join('  •  ');
                doc.fillColor('#374151').font('Helvetica').fontSize(7.5).text(fromLine, L, fromY + 9, { width: innerW, height: 20 });
            }

            // ── Cash-to-collect banner ──
            // Keep every glyph above the bottom margin and pass lineBreak:false
            // so pdfkit never auto-paginates the big amount onto a 2nd page.
            const bannerY = 382;
            const bannerH = 36;
            doc.roundedRect(L, bannerY, innerW, bannerH, 6).fill('#111111');
            if (isCOD) {
                doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9)
                    .text('CASH TO COLLECT', L + 12, bannerY + 13, { characterSpacing: 0.5, lineBreak: false });
                doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18)
                    .text(taka(invoice.total), L, bannerY + 9, { width: innerW - 12, align: 'right', lineBreak: false });
            } else {
                doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(12)
                    .text('PREPAID', L + 12, bannerY + 12, { lineBreak: false });
                doc.fillColor('#d1d5db').font('Helvetica').fontSize(8.5)
                    .text('DO NOT COLLECT CASH', L, bannerY + 14, { width: innerW - 12, align: 'right', lineBreak: false });
            }

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};

/**
 * Branded HTML invoice summary for the email body.
 */
const buildInvoiceEmailHtml = (invoice: IInvoiceData): string => {
    const rows = invoice.items
        .map(
            (i) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${i.name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${fmt(i.total)}</td>
        </tr>`
        )
        .join('');

    return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;">
    <div style="background:${ORANGE};color:#fff;padding:24px;">
      <h1 style="margin:0;font-size:22px;">Maxtop Mart</h1>
      <p style="margin:4px 0 0;font-size:14px;">Invoice ${invoice.invoiceNumber}</p>
    </div>
    <div style="padding:24px;">
      <p style="margin:0 0 8px;">Order <strong>${invoice.orderId}</strong> &middot; ${new Date(invoice.date).toLocaleDateString('en-GB')}</p>
      <p style="margin:0 0 16px;color:#555;">Hi ${invoice.billTo.name || 'there'}, your invoice is attached as a PDF. Here is a summary:</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#fafafa;">
            <th style="padding:8px;text-align:left;border-bottom:2px solid ${ORANGE};">Item</th>
            <th style="padding:8px;text-align:center;border-bottom:2px solid ${ORANGE};">Qty</th>
            <th style="padding:8px;text-align:right;border-bottom:2px solid ${ORANGE};">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <table style="width:100%;margin-top:16px;font-size:14px;">
        <tr><td style="padding:4px 8px;">Subtotal</td><td style="padding:4px 8px;text-align:right;">${fmt(invoice.subtotal)}</td></tr>
        <tr><td style="padding:4px 8px;">Shipping</td><td style="padding:4px 8px;text-align:right;">${fmt(invoice.shippingCost)}</td></tr>
        ${invoice.discount > 0 ? `<tr><td style="padding:4px 8px;">Discount</td><td style="padding:4px 8px;text-align:right;">- ${fmt(invoice.discount)}</td></tr>` : ''}
        <tr><td style="padding:8px;font-weight:bold;color:${ORANGE};border-top:2px solid ${ORANGE};">Grand Total</td><td style="padding:8px;text-align:right;font-weight:bold;color:${ORANGE};border-top:2px solid ${ORANGE};">${fmt(invoice.total)}</td></tr>
      </table>
      <p style="margin:16px 0 0;color:#555;">Payment: ${invoice.paymentMethod} (${invoice.paymentStatus})</p>
    </div>
    <div style="background:#fafafa;padding:16px;text-align:center;color:#888;font-size:12px;">
      Thank you for shopping with Maxtop Mart
    </div>
  </div>`;
};

// ── Auth-scoped public service methods ──────────────────────────────

const getInvoiceData = async (
    orderId: string,
    requester: { userId: string; role: string }
): Promise<IInvoiceData> => {
    const order = await fetchOrder(orderId);
    if (requester.role !== 'admin' && requester.role !== 'superadmin' && order.user?._id?.toString() !== requester.userId) {
        throw new AppError(403, 'You do not have permission to view this invoice');
    }
    return buildCustomerInvoice(order);
};

const getInvoicePdf = async (
    orderId: string,
    requester: { userId: string; role: string }
): Promise<Buffer> => {
    const order = await fetchOrder(orderId);
    if (requester.role !== 'admin' && requester.role !== 'superadmin' && order.user?._id?.toString() !== requester.userId) {
        throw new AppError(403, 'You do not have permission to view this invoice');
    }
    return generateInvoicePdf(buildCustomerInvoice(order));
};

/**
 * Build + email the customer invoice (PDF attached). Never throws to caller.
 */
const emailInvoiceToCustomer = async (orderId: string): Promise<void> => {
    try {
        const order = await fetchOrder(orderId);
        const invoice = buildCustomerInvoice(order);
        const pdf = await generateInvoicePdf(invoice);
        const to = order.user?.email || order.shippingAddress?.email;
        if (!to) {
            console.warn(`[Invoice] No email for order ${order.orderId}; skipping invoice email.`);
            return;
        }
        await sendEmail({
            to,
            subject: `Your Maxtop Mart Invoice ${invoice.invoiceNumber}`,
            html: buildInvoiceEmailHtml(invoice),
            attachments: [
                {
                    filename: `Invoice-${order.orderId}.pdf`,
                    content: pdf,
                    contentType: 'application/pdf',
                },
            ],
        });
    } catch (err) {
        console.error('[Invoice] Failed to email invoice:', err);
    }
};

/**
 * Resolve a stored logo URL to a LOCAL file path pdfkit can embed.
 * pdfkit only supports PNG/JPEG, and remote (e.g. Cloudinary) URLs can't be
 * read off disk — those return undefined so the label falls back to the
 * text wordmark.
 */
const resolveLogoFilePath = (logoUrl?: string): string | undefined => {
    if (!logoUrl) return undefined;
    let rel: string | undefined;
    const idx = logoUrl.indexOf('/uploads/');
    if (idx !== -1) {
        rel = logoUrl.slice(idx + '/uploads/'.length);
    } else if (!/^https?:\/\//i.test(logoUrl)) {
        rel = logoUrl.replace(/^\/+/, '').replace(/^uploads\//, '');
    }
    if (!rel) return undefined; // remote URL — pdfkit can't fetch it
    const ext = path.extname(rel).toLowerCase();
    if (!['.png', '.jpg', '.jpeg'].includes(ext)) return undefined;
    const filePath = path.join(process.cwd(), 'uploads', rel);
    return fs.existsSync(filePath) ? filePath : undefined;
};

const getLabelPdf = async (
    orderId: string,
    requester: { userId: string; role: string }
): Promise<Buffer> => {
    const order = await fetchOrder(orderId);
    if (requester.role !== 'admin' && requester.role !== 'superadmin' && order.user?._id?.toString() !== requester.userId) {
        throw new AppError(403, 'You do not have permission to view this label');
    }

    // Pull the dynamic logo + sender address from Site Content (best-effort).
    let site: any = null;
    try {
        site = await SiteContent.findOne({ _key: 'main' });
    } catch {
        site = null;
    }
    const logoPath = resolveLogoFilePath(site?.theme?.logoUrl);
    const fromAddress =
        site?.contact?.warehouse ||
        site?.contact?.address ||
        site?.contact?.corporateOffice ||
        'Dhaka, Bangladesh';
    const fromPhone = site?.contact?.phone || site?.contact?.phones?.[0] || '';

    return generateThermalLabelPdf(buildCustomerInvoice(order), {
        logoPath,
        consignmentId: order.consignmentId || order.trackingNumber || '',
        from: { name: 'Maxtop Mart', address: fromAddress, phone: fromPhone },
    });
};

const InvoiceService = {
    fetchOrder,
    buildCustomerInvoice,
    generateInvoicePdf,
    generateThermalLabelPdf,
    getInvoiceData,
    getInvoicePdf,
    getLabelPdf,
    emailInvoiceToCustomer,
};

export default InvoiceService;
