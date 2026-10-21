import { Types } from 'mongoose';

export type ExpenseType = 'staff' | 'marketing' | 'general';
export type ExpenseStatus = 'paid' | 'pending';

export interface IExpense {
    _id?: Types.ObjectId;
    type: ExpenseType;
    title: string;
    amount: number;
    month: string; // e.g. "2026-10" or "October 2026"
    date: Date;
    category?: string; // e.g., 'Facebook Ads', 'Salary', 'Office Rent'
    
    // Staff-specific fields
    staffName?: string;
    staffRole?: string;
    
    // Marketing-specific fields
    campaignName?: string;
    channel?: string; // Facebook, Google, TikTok, SMS, Offline, Influencer
    
    // Payment details
    paymentMethod: string; // Cash, Bank Transfer, bKash, Nagad, Card
    status: ExpenseStatus;
    referenceNo?: string;
    notes?: string;
    
    createdBy?: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}
