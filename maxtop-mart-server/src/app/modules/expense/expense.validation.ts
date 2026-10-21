import { z } from 'zod';

export const createExpenseValidation = z.object({
    body: z.object({
        type: z.enum(['staff', 'marketing', 'general']),
        title: z.string().min(1, 'Title is required').max(200),
        amount: z.number().min(0, 'Amount must be greater than or equal to 0'),
        month: z.string().min(1, 'Month is required'),
        date: z.string().or(z.date()).optional(),
        category: z.string().optional(),
        staffName: z.string().optional(),
        staffRole: z.string().optional(),
        campaignName: z.string().optional(),
        channel: z.string().optional(),
        paymentMethod: z.string().optional(),
        status: z.enum(['paid', 'pending']).optional(),
        referenceNo: z.string().optional(),
        notes: z.string().optional(),
    }),
});

export const updateExpenseValidation = z.object({
    body: z.object({
        type: z.enum(['staff', 'marketing', 'general']).optional(),
        title: z.string().min(1).max(200).optional(),
        amount: z.number().min(0).optional(),
        month: z.string().min(1).optional(),
        date: z.string().or(z.date()).optional(),
        category: z.string().optional(),
        staffName: z.string().optional(),
        staffRole: z.string().optional(),
        campaignName: z.string().optional(),
        channel: z.string().optional(),
        paymentMethod: z.string().optional(),
        status: z.enum(['paid', 'pending']).optional(),
        referenceNo: z.string().optional(),
        notes: z.string().optional(),
    }),
});
