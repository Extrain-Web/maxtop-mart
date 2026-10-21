import { Expense } from './expense.model';
import { IExpense } from './expense.interface';
import AppError from '../../utils/AppError';

const DUMMY_EXPENSES: Partial<IExpense>[] = [
    // Staff Salaries - Recent Months
    {
        type: 'staff',
        title: 'Salary - Tanvir Ahmed (October 2026)',
        staffName: 'Tanvir Ahmed',
        staffRole: 'Store Operations Manager',
        amount: 32000,
        month: 'October 2026',
        category: 'Monthly Salary',
        date: new Date('2026-10-05'),
        paymentMethod: 'Bank Transfer',
        status: 'paid',
        referenceNo: 'TXN-SLR-1001',
        notes: 'Full month salary for October',
    },
    {
        type: 'staff',
        title: 'Salary - Nusrat Jahan (October 2026)',
        staffName: 'Nusrat Jahan',
        staffRole: 'Digital Marketing Lead',
        amount: 35000,
        month: 'October 2026',
        category: 'Monthly Salary',
        date: new Date('2026-10-05'),
        paymentMethod: 'Bank Transfer',
        status: 'paid',
        referenceNo: 'TXN-SLR-1002',
        notes: 'October salary including performance bonus',
    },
    {
        type: 'staff',
        title: 'Salary - Rafiqul Islam (October 2026)',
        staffName: 'Rafiqul Islam',
        staffRole: 'Warehouse & Fulfillment Lead',
        amount: 22000,
        month: 'October 2026',
        category: 'Monthly Salary',
        date: new Date('2026-10-05'),
        paymentMethod: 'bKash',
        status: 'paid',
        referenceNo: 'BK-SLR-9921',
        notes: 'October delivery and packing supervisor pay',
    },
    {
        type: 'staff',
        title: 'Salary - Sabrina Akter (October 2026)',
        staffName: 'Sabrina Akter',
        staffRole: 'Customer Support Executive',
        amount: 18000,
        month: 'October 2026',
        category: 'Monthly Salary',
        date: new Date('2026-10-06'),
        paymentMethod: 'bKash',
        status: 'paid',
        referenceNo: 'BK-SLR-9925',
        notes: 'Shift customer handling and live chat support',
    },
    {
        type: 'staff',
        title: 'Salary - Tanvir Ahmed (September 2026)',
        staffName: 'Tanvir Ahmed',
        staffRole: 'Store Operations Manager',
        amount: 32000,
        month: 'September 2026',
        category: 'Monthly Salary',
        date: new Date('2026-09-05'),
        paymentMethod: 'Bank Transfer',
        status: 'paid',
        referenceNo: 'TXN-SLR-0901',
        notes: 'September salary',
    },
    {
        type: 'staff',
        title: 'Salary - Nusrat Jahan (September 2026)',
        staffName: 'Nusrat Jahan',
        staffRole: 'Digital Marketing Lead',
        amount: 35000,
        month: 'September 2026',
        category: 'Monthly Salary',
        date: new Date('2026-09-05'),
        paymentMethod: 'Bank Transfer',
        status: 'paid',
        referenceNo: 'TXN-SLR-0902',
        notes: 'September salary',
    },
    {
        type: 'staff',
        title: 'Salary - Rafiqul Islam (September 2026)',
        staffName: 'Rafiqul Islam',
        staffRole: 'Warehouse & Fulfillment Lead',
        amount: 22000,
        month: 'September 2026',
        category: 'Monthly Salary',
        date: new Date('2026-09-05'),
        paymentMethod: 'bKash',
        status: 'paid',
        referenceNo: 'BK-SLR-0921',
        notes: 'September salary',
    },

    // Marketing Expenses
    {
        type: 'marketing',
        title: 'Facebook Ads - Autumn Festival Boost',
        campaignName: 'Autumn Festival Special Promotion',
        channel: 'Facebook Ads',
        amount: 14500,
        month: 'October 2026',
        category: 'Social Media Ads',
        date: new Date('2026-10-10'),
        paymentMethod: 'Card',
        status: 'paid',
        referenceNo: 'FB-AD-77341',
        notes: 'Targeting Dhaka, Chittagong, Sylhet top buyer demographic',
    },
    {
        type: 'marketing',
        title: 'Google Shopping & Search Ads',
        campaignName: 'Product Search & Re-targeting Q4',
        channel: 'Google Ads',
        amount: 9800,
        month: 'October 2026',
        category: 'PPC & Search',
        date: new Date('2026-10-14'),
        paymentMethod: 'Card',
        status: 'paid',
        referenceNo: 'GG-AD-4412',
        notes: 'Keyword targeting on gadgets, clothing, lifestyle accessories',
    },
    {
        type: 'marketing',
        title: 'TikTok Influencer Unboxing Campaign',
        campaignName: 'Lifestyle Creators Collab',
        channel: 'Influencer',
        amount: 15000,
        month: 'October 2026',
        category: 'Influencer Marketing',
        date: new Date('2026-10-16'),
        paymentMethod: 'Bank Transfer',
        status: 'paid',
        referenceNo: 'INF-TT-8802',
        notes: 'Paid collaboration with 2 fashion micro-influencers',
    },
    {
        type: 'marketing',
        title: 'Bulk SMS Campaign for Flash Sale',
        campaignName: 'Weekend Flash Offer Notification',
        channel: 'SMS Gateway',
        amount: 3200,
        month: 'September 2026',
        category: 'SMS & Email',
        date: new Date('2026-09-22'),
        paymentMethod: 'bKash',
        status: 'paid',
        referenceNo: 'SMS-GTW-192',
        notes: 'Broadcasted to 15,000 active registered customers',
    },
    {
        type: 'marketing',
        title: 'Facebook Retargeting Ads (September)',
        campaignName: 'Cart Abandonment Retargeting',
        channel: 'Facebook Ads',
        amount: 8500,
        month: 'September 2026',
        category: 'Social Media Ads',
        date: new Date('2026-09-28'),
        paymentMethod: 'Card',
        status: 'paid',
        referenceNo: 'FB-AD-66219',
        notes: 'Retargeting customers who visited product pages',
    },
];

const ExpenseService = {
    async ensureSeeded() {
        const count = await Expense.countDocuments();
        if (count === 0) {
            await Expense.insertMany(DUMMY_EXPENSES);
        }
    },

    async createExpense(payload: Partial<IExpense>, userId?: string) {
        if (userId) {
            payload.createdBy = userId as any;
        }
        return await Expense.create(payload);
    },

    async getExpenses(query: Record<string, any>) {
        await this.ensureSeeded();

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
        await this.ensureSeeded();

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
