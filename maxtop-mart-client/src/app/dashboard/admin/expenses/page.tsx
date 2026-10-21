"use client";

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    LuWallet, LuPlus, LuSearch, LuFilter, LuRefreshCw,
    LuUsers, LuZap, LuTrash2, LuSquarePen, LuCalendar,
    LuCreditCard, LuCircleCheck, LuClock, LuX, LuChevronDown,
    LuArrowUpRight, LuFileText, LuDollarSign, LuTag, LuLayers
} from 'react-icons/lu';
import {
    useGetExpensesQuery,
    useGetExpenseSummaryQuery,
    useCreateExpenseMutation,
    useUpdateExpenseMutation,
    useDeleteExpenseMutation,
    ExpenseRecord,
} from '@/redux/api/expenseApi';
import { toast } from 'react-hot-toast';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

function ExpensesPageContent() {
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'all';

    // Tabs: 'all' | 'staff' | 'marketing'
    const [activeTab, setActiveTab] = useState<'all' | 'staff' | 'marketing'>(
        initialTab === 'staff' ? 'staff' : initialTab === 'marketing' ? 'marketing' : 'all'
    );

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [selectedStaff, setSelectedStaff] = useState('all');
    const [selectedChannel, setSelectedChannel] = useState('all');

    // Modal state for Add/Edit
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
    const [formType, setFormType] = useState<'staff' | 'marketing' | 'general'>('staff');

    // Form inputs
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        month: 'October 2026',
        date: new Date().toISOString().slice(0, 10),
        category: '',
        staffName: '',
        staffRole: '',
        campaignName: '',
        channel: 'Facebook Ads',
        paymentMethod: 'Bank Transfer',
        status: 'paid' as 'paid' | 'pending',
        referenceNo: '',
        notes: '',
    });

    // API hooks
    const { data: summaryData, isLoading: isLoadingSummary, refetch: refetchSummary } = useGetExpenseSummaryQuery();
    const { data: expensesData, isLoading: isLoadingExpenses, refetch: refetchExpenses } = useGetExpensesQuery({
        type: activeTab === 'all' ? undefined : activeTab,
        month: selectedMonth === 'all' ? undefined : selectedMonth,
        staffName: activeTab === 'staff' && selectedStaff !== 'all' ? selectedStaff : undefined,
        channel: activeTab === 'marketing' && selectedChannel !== 'all' ? selectedChannel : undefined,
        search: searchTerm || undefined,
        limit: 100,
    });

    const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation();
    const [updateExpense, { isLoading: isUpdating }] = useUpdateExpenseMutation();
    const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation();

    const summary = summaryData?.data || {
        totalExpense: 0,
        totalCount: 0,
        staffExpenses: 0,
        staffCount: 0,
        marketingExpenses: 0,
        marketingCount: 0,
        generalExpenses: 0,
        generalCount: 0,
        thisMonthExpense: 0,
        currentMonthName: 'October 2026',
        availableMonths: [],
        staffNames: [],
    };

    const expensesList = expensesData?.data?.expenses || [];

    const formatCurrency = (amount: number) => `৳${(amount || 0).toLocaleString()}`;

    const handleRefreshAll = () => {
        refetchSummary();
        refetchExpenses();
    };

    const openAddModal = (type?: 'staff' | 'marketing' | 'general') => {
        setEditingExpense(null);
        const currentM = `${MONTH_NAMES[new Date().getMonth()]} ${new Date().getFullYear()}`;
        const targetType = type || (activeTab === 'marketing' ? 'marketing' : 'staff');
        setFormType(targetType);
        setFormData({
            title: '',
            amount: '',
            month: currentM,
            date: new Date().toISOString().slice(0, 10),
            category: targetType === 'staff' ? 'Monthly Salary' : 'Social Media Ads',
            staffName: '',
            staffRole: '',
            campaignName: '',
            channel: 'Facebook Ads',
            paymentMethod: targetType === 'staff' ? 'Bank Transfer' : 'Card',
            status: 'paid',
            referenceNo: '',
            notes: '',
        });
        setIsModalOpen(true);
    };

    const openEditModal = (expense: ExpenseRecord) => {
        setEditingExpense(expense);
        setFormType(expense.type);
        setFormData({
            title: expense.title || '',
            amount: String(expense.amount || ''),
            month: expense.month || 'October 2026',
            date: expense.date ? new Date(expense.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            category: expense.category || '',
            staffName: expense.staffName || '',
            staffRole: expense.staffRole || '',
            campaignName: expense.campaignName || '',
            channel: expense.channel || 'Facebook Ads',
            paymentMethod: expense.paymentMethod || 'Bank Transfer',
            status: expense.status || 'paid',
            referenceNo: expense.referenceNo || '',
            notes: expense.notes || '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const numAmount = parseFloat(formData.amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        // Auto-format title if left empty
        let title = formData.title.trim();
        if (!title) {
            if (formType === 'staff') {
                title = `Salary - ${formData.staffName || 'Staff'} (${formData.month})`;
            } else if (formType === 'marketing') {
                title = `${formData.campaignName || 'Campaign'} (${formData.channel || 'Marketing'})`;
            } else {
                title = `Expense - ${formData.category || 'General'} (${formData.month})`;
            }
        }

        if (formType === 'staff' && !formData.staffName.trim()) {
            toast.error('Staff name is required');
            return;
        }

        if (formType === 'marketing' && !formData.campaignName.trim() && !formData.title.trim()) {
            toast.error('Campaign name or title is required');
            return;
        }

        const payload: any = {
            type: formType,
            title,
            amount: numAmount,
            month: formData.month,
            date: formData.date ? new Date(formData.date) : new Date(),
            category: formData.category || (formType === 'staff' ? 'Salary' : 'Marketing'),
            paymentMethod: formData.paymentMethod,
            status: formData.status,
            referenceNo: formData.referenceNo,
            notes: formData.notes,
        };

        if (formType === 'staff') {
            payload.staffName = formData.staffName.trim();
            payload.staffRole = formData.staffRole.trim();
        } else if (formType === 'marketing') {
            payload.campaignName = (formData.campaignName || title).trim();
            payload.channel = formData.channel;
        }

        try {
            if (editingExpense) {
                await updateExpense({ id: editingExpense._id, data: payload }).unwrap();
                toast.success('Expense record updated successfully! ✅');
            } else {
                await createExpense(payload).unwrap();
                toast.success('Expense record added successfully! ✅');
            }
            setIsModalOpen(false);
            refetchSummary();
            refetchExpenses();
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to save expense');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this expense record?')) return;
        try {
            await deleteExpense(id).unwrap();
            toast.success('Expense record deleted successfully! ✅');
            refetchSummary();
            refetchExpenses();
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to delete expense');
        }
    };

    // Filtered lists for tabs
    const staffExpenses = useMemo(() => {
        return expensesList.filter((e) => e.type === 'staff');
    }, [expensesList]);

    const marketingExpenses = useMemo(() => {
        return expensesList.filter((e) => e.type === 'marketing');
    }, [expensesList]);

    // Unique staff names for filter dropdown
    const allStaffNames = useMemo(() => {
        const set = new Set<string>();
        summary.staffNames.forEach((n) => set.add(n));
        staffExpenses.forEach((e) => { if (e.staffName) set.add(e.staffName); });
        return Array.from(set);
    }, [summary.staffNames, staffExpenses]);

    return (
        <div className="w-full max-w-[1400px] mx-auto space-y-6">
            {/* ══ HEADER ══════════════════════════════════════════════════ */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-sm">
                            <LuWallet size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Expenses Management</h1>
                            <p className="text-xs text-gray-500 mt-0.5">Track staff salaries, marketing campaigns, and operational expenses</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                    <button
                        onClick={handleRefreshAll}
                        className="px-3.5 py-2 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl flex items-center gap-1.5 transition-all"
                    >
                        <LuRefreshCw size={13} className={isLoadingExpenses || isLoadingSummary ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        onClick={() => openAddModal('staff')}
                        className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                    >
                        <LuUsers size={14} />
                        + Staff Salary
                    </button>
                    <button
                        onClick={() => openAddModal('marketing')}
                        className="px-4 py-2 text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                    >
                        <LuZap size={14} />
                        + Marketing Expense
                    </button>
                </div>
            </div>

            {/* ══ TOP SUMMARY CARDS (Live figures) ════════════════════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Expenses */}
                <div className="bg-gradient-to-br from-rose-50 to-pink-50/50 p-5 rounded-2xl border border-rose-100/80 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Total Expenses</span>
                        <div className="w-9 h-9 rounded-xl bg-white text-rose-600 flex items-center justify-center shadow-sm">
                            <LuWallet size={18} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-gray-900 tracking-tight">{formatCurrency(summary.totalExpense)}</p>
                    <p className="text-xs font-medium text-rose-600 mt-1 flex items-center gap-1">
                        <span>{summary.totalCount} records recorded</span>
                    </p>
                </div>

                {/* Staff Salaries */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50/50 p-5 rounded-2xl border border-indigo-100/80 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Staff Salaries</span>
                        <div className="w-9 h-9 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-sm">
                            <LuUsers size={18} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-gray-900 tracking-tight">{formatCurrency(summary.staffExpenses)}</p>
                    <p className="text-xs font-medium text-indigo-600 mt-1 flex items-center gap-1">
                        <span>{summary.staffCount} monthly payrolls</span>
                    </p>
                </div>

                {/* Marketing Spend */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-5 rounded-2xl border border-amber-100/80 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Marketing Spend</span>
                        <div className="w-9 h-9 rounded-xl bg-white text-amber-600 flex items-center justify-center shadow-sm">
                            <LuZap size={18} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-gray-900 tracking-tight">{formatCurrency(summary.marketingExpenses)}</p>
                    <p className="text-xs font-medium text-amber-600 mt-1 flex items-center gap-1">
                        <span>{summary.marketingCount} ad campaigns</span>
                    </p>
                </div>

                {/* Current Month Expenses */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-5 rounded-2xl border border-emerald-100/80 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">This Month ({summary.currentMonthName})</span>
                        <div className="w-9 h-9 rounded-xl bg-white text-emerald-600 flex items-center justify-center shadow-sm">
                            <LuCalendar size={18} />
                        </div>
                    </div>
                    <p className="text-2xl font-black text-gray-900 tracking-tight">{formatCurrency(summary.thisMonthExpense)}</p>
                    <p className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1">
                        <span>Current month outlay</span>
                    </p>
                </div>
            </div>

            {/* ══ TAB NAVIGATION & FILTERS ═══════════════════════════════ */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-b border-gray-100 pb-3">
                    {/* Tabs */}
                    <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl self-start">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                activeTab === 'all'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            All Expenses ({summary.totalCount})
                        </button>
                        <button
                            onClick={() => setActiveTab('staff')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                activeTab === 'staff'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <LuUsers size={13} />
                            Staffs Expense (বেতন হিসাব)
                        </button>
                        <button
                            onClick={() => setActiveTab('marketing')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                activeTab === 'marketing'
                                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <LuZap size={13} />
                            Marketing Expense (মার্কেটিং)
                        </button>
                    </div>

                    {/* Quick Add CTA */}
                    <button
                        onClick={() => openAddModal()}
                        className="px-3.5 py-1.5 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg flex items-center gap-1 self-end sm:self-auto"
                    >
                        <LuPlus size={14} /> Add New Record
                    </button>
                </div>

                {/* Filter Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Search */}
                    <div className="relative">
                        <LuSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by staff, title, notes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-50 outline-none transition-all"
                        />
                    </div>

                    {/* Month Filter */}
                    <div className="relative">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-50 outline-none transition-all appearance-none cursor-pointer"
                        >
                            <option value="all">All Months</option>
                            {summary.availableMonths?.map((m) => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                        <LuChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Staff Name Filter (Visible on Staff tab) */}
                    {activeTab === 'staff' ? (
                        <div className="relative">
                            <select
                                value={selectedStaff}
                                onChange={(e) => setSelectedStaff(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">All Staff Members</option>
                                {allStaffNames.map((name) => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                            <LuChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    ) : activeTab === 'marketing' ? (
                        <div className="relative">
                            <select
                                value={selectedChannel}
                                onChange={(e) => setSelectedChannel(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-50 outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">All Channels</option>
                                <option value="Facebook Ads">Facebook Ads</option>
                                <option value="Google Ads">Google Ads</option>
                                <option value="TikTok">TikTok</option>
                                <option value="Influencer">Influencer</option>
                                <option value="SMS Gateway">SMS Gateway</option>
                                <option value="Offline">Offline / Print</option>
                            </select>
                            <LuChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    ) : (
                        <div className="text-xs text-gray-400 flex items-center px-3 py-2 bg-gray-50 rounded-xl border border-gray-200">
                            <span>Showing all categories</span>
                        </div>
                    )}

                    {/* Reset Filters */}
                    <div className="flex items-center justify-end">
                        {(searchTerm || selectedMonth !== 'all' || selectedStaff !== 'all' || selectedChannel !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedMonth('all');
                                    setSelectedStaff('all');
                                    setSelectedChannel('all');
                                }}
                                className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline flex items-center gap-1"
                            >
                                <LuX size={12} /> Clear Filters
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ══ STAFF SALARY SEQUENCE / VIEW ════════════════════════════ */}
            {activeTab === 'staff' && (
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                            <LuUsers size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-indigo-900">Staffs Salary Log (কর্মীদের মাসিক বেতন হিসাব)</h3>
                            <p className="text-xs text-indigo-700">View salary records by staff name and month breakdown</p>
                        </div>
                    </div>
                    <div className="text-xs font-semibold text-indigo-800 bg-white px-3 py-1.5 rounded-xl border border-indigo-200 shadow-sm">
                        Total Staff Outlay: <span className="font-bold text-indigo-950">{formatCurrency(summary.staffExpenses)}</span>
                    </div>
                </div>
            )}

            {/* ══ MARKETING SEQUENCE / VIEW ═══════════════════════════════ */}
            {activeTab === 'marketing' && (
                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-sm">
                            <LuZap size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-amber-950">Marketing &amp; Ad Campaigns Log (মার্কেটিং খরচ)</h3>
                            <p className="text-xs text-amber-800">Track digital boost campaigns, influencer sponsorships, and platform spend</p>
                        </div>
                    </div>
                    <div className="text-xs font-semibold text-amber-900 bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-sm">
                        Total Marketing Spend: <span className="font-bold text-amber-950">{formatCurrency(summary.marketingExpenses)}</span>
                    </div>
                </div>
            )}

            {/* ══ EXPENSES TABLE / CARDS ══════════════════════════════════ */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                <th className="px-5 py-3.5">Details</th>
                                <th className="px-5 py-3.5">Type &amp; Category</th>
                                <th className="px-5 py-3.5">Month &amp; Date</th>
                                <th className="px-5 py-3.5">Amount (৳)</th>
                                <th className="px-5 py-3.5">Payment Method</th>
                                <th className="px-5 py-3.5">Status</th>
                                <th className="px-5 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                            {isLoadingExpenses ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-5 py-4">
                                            <div className="h-6 bg-gray-100 rounded-lg w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : expensesList.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-16 text-center text-gray-400">
                                        <LuWallet size={36} className="mx-auto mb-2 text-gray-300" />
                                        <p className="text-sm font-semibold text-gray-600">No expense records found</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Click &ldquo;+ Staff Salary&rdquo; or &ldquo;+ Marketing Expense&rdquo; to add a new record.</p>
                                    </td>
                                </tr>
                            ) : (
                                expensesList.map((item) => {
                                    const isStaff = item.type === 'staff';
                                    const isMkt = item.type === 'marketing';

                                    return (
                                        <tr key={item._id} className="hover:bg-gray-50/60 transition-colors">
                                            {/* Details */}
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-gray-900 text-sm">
                                                    {isStaff ? (item.staffName || item.title) : isMkt ? (item.campaignName || item.title) : item.title}
                                                </div>
                                                <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                                    {isStaff && item.staffRole && (
                                                        <span className="font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                                                            {item.staffRole}
                                                        </span>
                                                    )}
                                                    {isMkt && item.channel && (
                                                        <span className="font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                                            {item.channel}
                                                        </span>
                                                    )}
                                                    {item.referenceNo && (
                                                        <span className="text-gray-400 font-mono text-[10px]">
                                                            Ref: {item.referenceNo}
                                                        </span>
                                                    )}
                                                </div>
                                                {item.notes && (
                                                    <p className="text-[11px] text-gray-400 mt-1 italic max-w-xs truncate">{item.notes}</p>
                                                )}
                                            </td>

                                            {/* Type & Category */}
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                                        isStaff
                                                            ? 'bg-indigo-50 text-indigo-700'
                                                            : isMkt
                                                            ? 'bg-amber-50 text-amber-700'
                                                            : 'bg-gray-100 text-gray-700'
                                                    }`}
                                                >
                                                    {isStaff && <LuUsers size={10} />}
                                                    {isMkt && <LuZap size={10} />}
                                                    {item.type}
                                                </span>
                                                <p className="text-[11px] text-gray-500 mt-1 font-medium">{item.category || 'General'}</p>
                                            </td>

                                            {/* Month & Date */}
                                            <td className="px-5 py-4">
                                                <span className="font-semibold text-gray-800 block text-xs">{item.month}</span>
                                                <span className="text-[11px] text-gray-400">
                                                    {item.date ? new Date(item.date).toLocaleDateString('en-GB') : '-'}
                                                </span>
                                            </td>

                                            {/* Amount */}
                                            <td className="px-5 py-4">
                                                <span className="font-extrabold text-gray-900 text-sm">
                                                    {formatCurrency(item.amount)}
                                                </span>
                                            </td>

                                            {/* Payment Method */}
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                                    <LuCreditCard size={12} className="text-gray-400" />
                                                    {item.paymentMethod || 'Cash'}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                                                        item.status === 'paid'
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : 'bg-amber-50 text-amber-700'
                                                    }`}
                                                >
                                                    {item.status === 'paid' ? <LuCircleCheck size={11} /> : <LuClock size={11} />}
                                                    {item.status}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                        title="Edit record"
                                                    >
                                                        <LuSquarePen size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item._id)}
                                                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                        title="Delete record"
                                                    >
                                                        <LuTrash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ══ ADD / EDIT EXPENSE MODAL ════════════════════════════════ */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/60">
                            <div>
                                <h3 className="font-extrabold text-gray-900 text-lg">
                                    {editingExpense ? 'Edit Expense Record' : 'Add New Expense Record'}
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">Record staff salary or marketing/operational cost</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <LuX size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
                            {/* Form Type Selector */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">Expense Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'staff', label: 'Staff Salary', icon: LuUsers },
                                        { id: 'marketing', label: 'Marketing', icon: LuZap },
                                        { id: 'general', label: 'General / Office', icon: LuWallet },
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setFormType(t.id as any)}
                                            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                                                formType === t.id
                                                    ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-sm'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            <t.icon size={14} />
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Staff Specific Fields */}
                            {formType === 'staff' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
                                    <div>
                                        <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                                            Staff Name <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Tanvir Ahmed"
                                            value={formData.staffName}
                                            onChange={(e) => setFormData({ ...formData, staffName: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-indigo-900 mb-1">Staff Role / Dept</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Operations Manager"
                                            value={formData.staffRole}
                                            onChange={(e) => setFormData({ ...formData, staffRole: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-100"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Marketing Specific Fields */}
                            {formType === 'marketing' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-amber-50/60 rounded-xl border border-amber-100">
                                    <div>
                                        <label className="block text-[11px] font-bold text-amber-950 mb-1">
                                            Campaign Name <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Facebook Eid Flash Sale Boost"
                                            value={formData.campaignName}
                                            onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-amber-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-amber-950 mb-1">Channel / Platform</label>
                                        <select
                                            value={formData.channel}
                                            onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-amber-100 cursor-pointer"
                                        >
                                            <option value="Facebook Ads">Facebook Ads</option>
                                            <option value="Google Ads">Google Ads</option>
                                            <option value="TikTok">TikTok</option>
                                            <option value="Influencer">Influencer Collaboration</option>
                                            <option value="SMS Gateway">SMS Broadcast</option>
                                            <option value="Offline">Offline / Banner Print</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Amount & Month */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                        Amount (৳) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        required
                                        placeholder="e.g. 25000"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                        For Month <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. October 2026"
                                        value={formData.month}
                                        onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-50"
                                    />
                                </div>
                            </div>

                            {/* Payment Date & Method */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Payment Date</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Payment Method</label>
                                    <select
                                        value={formData.paymentMethod}
                                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-50 cursor-pointer"
                                    >
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="bKash">bKash</option>
                                        <option value="Nagad">Nagad</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Card">Card / Online Gateway</option>
                                    </select>
                                </div>
                            </div>

                            {/* Status & Reference */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-50 cursor-pointer"
                                    >
                                        <option value="paid">Paid</option>
                                        <option value="pending">Pending</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Transaction Ref / Cheque No</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. TXN-10024"
                                        value={formData.referenceNo}
                                        onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-50"
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-700 mb-1">Remarks / Notes</label>
                                <textarea
                                    rows={2}
                                    placeholder="Optional notes or description regarding this payment..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-50"
                                />
                            </div>

                            {/* Modal Footer Actions */}
                            <div className="pt-3 border-t border-gray-100 flex justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating || isUpdating}
                                    className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-all disabled:opacity-50"
                                >
                                    {isCreating || isUpdating ? 'Saving...' : editingExpense ? 'Update Expense' : 'Save Expense'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ExpensesPage() {
    return (
        <Suspense fallback={<div className="p-10 text-center text-gray-400 font-semibold">Loading expenses...</div>}>
            <ExpensesPageContent />
        </Suspense>
    );
}
