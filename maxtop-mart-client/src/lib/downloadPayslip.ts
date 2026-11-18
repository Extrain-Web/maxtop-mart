import { store } from '@/redux/store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Download a payslip PDF (needs the admin's Bearer token, so a plain <a href>
 * won't work). Throws on a non-ok response so callers can show a toast.
 */
export async function downloadPayslip(payrollId: string, filename = 'payslip.pdf'): Promise<void> {
    if (typeof window === 'undefined') return;
    const token = store.getState().auth.token || localStorage.getItem('token');
    const res = await fetch(`${API_URL}/hr/payroll/${payrollId}/payslip`, {
        headers: token ? { authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`Could not download payslip (status ${res.status})`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
