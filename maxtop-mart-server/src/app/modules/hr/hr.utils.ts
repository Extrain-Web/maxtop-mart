import { HrSettings, IHrSettings } from './hr.models';

// All calendar maths uses plain 'YYYY-MM-DD' strings in Bangladesh time, so a
// day never "moves" because the server runs in UTC.
const BD_TZ = 'Asia/Dhaka';

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Today's date in Bangladesh as YYYY-MM-DD. */
export const todayBD = (): string =>
    new Intl.DateTimeFormat('en-CA', { timeZone: BD_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

export const currentMonthBD = (): string => todayBD().slice(0, 7);

/** Weekday (0 = Sunday … 6 = Saturday) of a YYYY-MM-DD date. */
export const weekdayOf = (date: string): number => {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

export const daysInMonth = (month: string): number => {
    const [y, m] = month.split('-').map(Number);
    return new Date(Date.UTC(y, m, 0)).getUTCDate();
};

/** Every date (YYYY-MM-DD) from start to end inclusive. */
export const eachDate = (start: string, end: string): string[] => {
    const out: string[] = [];
    const [ys, ms, ds] = start.split('-').map(Number);
    const [ye, me, de] = end.split('-').map(Number);
    const cur = new Date(Date.UTC(ys, ms - 1, ds));
    const last = new Date(Date.UTC(ye, me - 1, de));
    while (cur <= last && out.length < 400) {
        out.push(cur.toISOString().slice(0, 10));
        cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return out;
};

export const monthRange = (month: string) => {
    const start = `${month}-01`;
    const end = `${month}-${String(daysInMonth(month)).padStart(2, '0')}`;
    return { start, end };
};

/** 'YYYY-MM' → 'November 2026' (matches the Expense module's month format). */
export const monthLabel = (month: string): string => {
    const [y, m] = month.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
};

export const toMinutes = (hhmm?: string): number | null => {
    if (!hhmm || !TIME_RE.test(hhmm)) return null;
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
};

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

/** Load (or lazily create) the singleton HR settings document. */
export const getSettings = async (): Promise<IHrSettings> => {
    let s = await HrSettings.findOne({ key: 'default' }).lean<IHrSettings>();
    if (!s) {
        await HrSettings.create({ key: 'default' });
        s = await HrSettings.findOne({ key: 'default' }).lean<IHrSettings>();
    }
    return s as IHrSettings;
};

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
