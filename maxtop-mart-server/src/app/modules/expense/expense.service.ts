import { Expense } from './expense.model';
import { IExpense } from './expense.interface';
import AppError from '../../utils/AppError';

const ExpenseService = {
    async createExpense(payload: Partial<IExpense>, userId?: string) {
        if (userId) {
            payload.createdBy = userId as any;
        }
        return await Expense.create(payload);
    },

    async getExpenses(query: Record<string, any>) {
        const filter: Record<string, any> = {};

        if (query.type && query.type !== 'all') {
            filter.type = query.type;
        }
        if (query.month && query.month !== 'all') {
            filter.month = query.month;
        }
        if (query.staffName) {
            filter.staffName = { $regex: query.staffName, $options: 'i' };
        }
        if (query.status && query.status !== 'all') {
            filter.status = query.status;
        }
        if (query.channel && query.channel !== 'all') {
            filter.channel = query.channel;
        }
        if (query.search) {
            const s = query.search;
            filter.$or = [
                { title: { $regex: s, $options: 'i' } },
                { staffName: { $regex: s, $options: 'i' } },
                { campaignName: { $regex: s, $options: 'i' } },
                { notes: { $regex: s, $options: 'i' } },
                { category: { $regex: s, $options: 'i' } },
            ];
        }

        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 50;
        const skip = (page - 1) * limit;

        const [expenses, total] = await Promise.all([
            Expense.find(filter)
                .sort({ date: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('createdBy', 'firstName lastName email'),
            Expense.countDocuments(filter),
        ]);

        return {
            expenses,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },

    async getSummary() {
        const [totals, byType, distinctMonths, distinctStaff] = await Promise.all([
            Expense.aggregate([
                {
                    $group: {
                        _id: null,
                        totalExpense: { $sum: '$amount' },
                        count: { $sum: 1 },
                    },
                },
            ]),
            Expense.aggregate([
                {
                    $group: {
                        _id: '$type',
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 },
                    },
                },
            ]),
            Expense.distinct('month'),
            Expense.find({ type: 'staff' }).distinct('staffName'),
        ]);

        let staffExpenses = 0;
        let staffCount = 0;
        let marketingExpenses = 0;
        let marketingCount = 0;
        let generalExpenses = 0;
        let generalCount = 0;

        byType.forEach((item) => {
            if (item._id === 'staff') {
                staffExpenses = item.totalAmount;
                staffCount = item.count;
            } else if (item._id === 'marketing') {
                marketingExpenses = item.totalAmount;
                marketingCount = item.count;
            } else if (item._id === 'general') {
                generalExpenses = item.totalAmount;
                generalCount = item.count;
            }
        });

        // Current month
        const currentMonthName = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
        const currentMonthExpenses = await Expense.aggregate([
            { $match: { month: currentMonthName } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        return {
            totalExpense: totals[0]?.totalExpense || 0,
            totalCount: totals[0]?.count || 0,
            staffExpenses,
            staffCount,
            marketingExpenses,
            marketingCount,
            generalExpenses,
            generalCount,
            thisMonthExpense: currentMonthExpenses[0]?.total || 0,
            currentMonthName,
            availableMonths: distinctMonths,
            staffNames: distinctStaff.filter(Boolean),
        };
    },

    async getExpenseById(id: string) {
        const expense = await Expense.findById(id).populate('createdBy', 'firstName lastName email');
        if (!expense) throw new AppError(404, 'Expense record not found');
        return expense;
    },

    async updateExpense(id: string, payload: Partial<IExpense>) {
        const updated = await Expense.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
        if (!updated) throw new AppError(404, 'Expense record not found');
        return updated;
    },

    async deleteExpense(id: string) {
        const deleted = await Expense.findByIdAndDelete(id);
        if (!deleted) throw new AppError(404, 'Expense record not found');
        return deleted;
    },
};

export default ExpenseService;
