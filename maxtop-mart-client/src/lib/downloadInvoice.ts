import { store } from '@/redux/store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Downloads an invoice PDF for the given order and triggers a browser download.
 *
 * Replicates baseApi auth: Bearer token from the redux auth slice, falling back
 * to localStorage('token'). SSR-safe — only runs in the browser.
 *
 * @param orderId order id (e.g. 'ABM-0001')
 * @throws Error on a non-ok response so callers can toast an error
 */
export async function downloadInvoicePdf(orderId: string): Promise<void> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return;
    }

    const token =
        store.getState().auth.token ||
        (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    const path = '/invoices/' + orderId + '/pdf';

    const headers: Record<string, string> = {};
    if (token) {
        headers['authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(API_URL + path, {
        method: 'GET',
        headers,
    });

    if (!response.ok) {
        throw new Error(`Failed to download invoice (status ${response.status})`);
    }

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = 'Invoice-' + orderId + '.pdf';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    window.URL.revokeObjectURL(objectUrl);
}

/**
 * Fetches the invoice PDF and opens it in a new browser tab so the user can
 * print it (Ctrl/Cmd+P). Same auth as downloadInvoicePdf. SSR-safe.
 */
export async function printInvoicePdf(orderId: string): Promise<void> {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const token =
        store.getState().auth.token ||
        (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    const headers: Record<string, string> = {};
    if (token) headers['authorization'] = `Bearer ${token}`;

    const response = await fetch(API_URL + '/invoices/' + orderId + '/pdf', { method: 'GET', headers });
    if (!response.ok) throw new Error(`Failed to load invoice (status ${response.status})`);

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const win = window.open(objectUrl, '_blank');
    if (win) {
        // Give the PDF a moment to render, then invoke the print dialog.
        win.addEventListener('load', () => { try { win.print(); } catch { /* the tab still lets them print manually */ } });
    }
    // Revoke later so the opened tab keeps working.
    setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60000);
}

/**
 * Downloads an automated thermal parcel label & barcode PDF for the given order.
 */
export async function downloadThermalLabelPdf(orderId: string): Promise<void> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return;
    }

    const token =
        store.getState().auth.token ||
        (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    // Assuming the backend has a /label or /thermal-label endpoint
    const path = '/invoices/' + orderId + '/label';

    const headers: Record<string, string> = {};
    if (token) {
        headers['authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(API_URL + path, {
        method: 'GET',
        headers,
    });

    if (!response.ok) {
        throw new Error(`Failed to download thermal label (status ${response.status})`);
    }

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = 'Thermal-Label-' + orderId + '.pdf';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    window.URL.revokeObjectURL(objectUrl);
}

/**
 * Downloads the Returns & Refunds report as CSV or PDF, honouring the current
 * status/search filter. Same Bearer-token auth as the invoice downloads.
 */
export async function downloadReturnsReport(
    format: 'csv' | 'pdf',
    filter: { status?: string; search?: string } = {},
): Promise<void> {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const token =
        store.getState().auth.token ||
        (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    const params = new URLSearchParams({ format });
    if (filter.status && filter.status !== 'all') params.set('status', filter.status);
    if (filter.search) params.set('search', filter.search);

    const headers: Record<string, string> = {};
    if (token) headers['authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/orders/admin/returns/export?${params.toString()}`, { method: 'GET', headers });
    if (!response.ok) throw new Error(`Failed to download report (status ${response.status})`);

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const stamp = new Date().toISOString().slice(0, 10);

    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `returns-report-${stamp}.${format}`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    window.URL.revokeObjectURL(objectUrl);
}
