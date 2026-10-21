import { Schema, model } from 'mongoose';
import { IExpense } from './expense.interface';

const expenseSchema = new Schema<IExpense>(
    {
        type: {
            type: String,
            enum: ['staff', 'marketing', 'general'],
            required: [true, 'Expense type is required'],
            index: true,
        },
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [0, 'Amount must be greater than or equal to 0'],
        },
        month: {
            type: String,
            required: [true, 'Month is required'],
            trim: true,
            index: true,
        },
        date: {
            type: Date,
            default: Date.now,
            index: true,
        },
        category: {
            type: String,
            trim: true,
            default: 'General',
        },
        staffName: {
            type: String,
            trim: true,
            index: true,
        },
        staffRole: {
            type: String,
            trim: true,
        },
        campaignName: {
            type: String,
            trim: true,
        },
        channel: {
            type: String,
            trim: true,
        },
        paymentMethod: {
            type: String,
            trim: true,
            default: 'Cash',
        },
        status: {
            type: String,
            enum: ['paid', 'pending'],
            default: 'paid',
            index: true,
        },
        referenceNo: {
            type: String,
            trim: true,
        },
        notes: {
            type: String,
            trim: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

expenseSchema.index({ type: 1, month: 1 });
expenseSchema.index({ staffName: 1, month: 1 });

export const Expense = model<IExpense>('Expense', expenseSchema);
