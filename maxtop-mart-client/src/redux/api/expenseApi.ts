import { baseApi } from './baseApi';

export interface ExpenseRecord {
    _id: string;
    type: 'staff' | 'marketing' | 'general';
    title: string;
    amount: number;
    month: string;
    date: string;
    category?: string;
    staffName?: string;
    staffRole?: string;
    campaignName?: string;
    channel?: string;
    paymentMethod: string;
    status: 'paid' | 'pending';
    referenceNo?: string;
    notes?: string;
    createdBy?: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface ExpenseSummaryResponse {
    totalExpense: number;
    totalCount: number;
    staffExpenses: number;
    staffCount: number;
    marketingExpenses: number;
    marketingCount: number;
    generalExpenses: number;
    generalCount: number;
    thisMonthExpense: number;
    currentMonthName: string;
    availableMonths: string[];
    staffNames: string[];
}

export const expenseApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getExpenses: builder.query<{
            success: boolean;
            message: string;
            data: {
                expenses: ExpenseRecord[];
                meta: {
                    page: number;
                    limit: number;
                    total: number;
                    totalPages: number;
                };
            };
        }, Record<string, any>>({
            query: (params) => ({
                url: '/expenses',
                method: 'GET',
                params,
            }),
            providesTags: ['Expenses'],
        }),

        getExpenseSummary: builder.query<{
            success: boolean;
            message: string;
            data: ExpenseSummaryResponse;
        }, void>({
            query: () => '/expenses/summary',
            providesTags: ['Expenses'],
        }),

        createExpense: builder.mutation({
            query: (data) => ({
                url: '/expenses',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Expenses', 'Analytics'],
        }),

        updateExpense: builder.mutation({
            query: ({ id, data }) => ({
                url: `/expenses/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['Expenses', 'Analytics'],
        }),

        deleteExpense: builder.mutation({
            query: (id: string) => ({
                url: `/expenses/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Expenses', 'Analytics'],
        }),
    }),
});

export const {
    useGetExpensesQuery,
    useGetExpenseSummaryQuery,
    useCreateExpenseMutation,
    useUpdateExpenseMutation,
    useDeleteExpenseMutation,
} = expenseApi;
