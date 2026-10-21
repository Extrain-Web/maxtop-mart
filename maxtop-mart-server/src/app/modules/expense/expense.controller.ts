import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import ExpenseService from './expense.service';

const ExpenseController = {
    createExpense: catchAsync(async (req: Request, res: Response) => {
        const userId = req.user?.userId;
        const result = await ExpenseService.createExpense(req.body, userId);
        sendResponse(res, {
            statusCode: 201,
            success: true,
            message: 'Expense added successfully',
            data: result,
        });
    }),

    getExpenses: catchAsync(async (req: Request, res: Response) => {
        const result = await ExpenseService.getExpenses(req.query);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Expenses fetched successfully',
            data: result,
        });
    }),

    getSummary: catchAsync(async (_req: Request, res: Response) => {
        const result = await ExpenseService.getSummary();
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Expense summary fetched successfully',
            data: result,
        });
    }),

    getExpenseById: catchAsync(async (req: Request, res: Response) => {
        const result = await ExpenseService.getExpenseById(req.params.id);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Expense details fetched successfully',
            data: result,
        });
    }),

    updateExpense: catchAsync(async (req: Request, res: Response) => {
        const result = await ExpenseService.updateExpense(req.params.id, req.body);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Expense updated successfully',
            data: result,
        });
    }),

    deleteExpense: catchAsync(async (req: Request, res: Response) => {
        const result = await ExpenseService.deleteExpense(req.params.id);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: 'Expense deleted successfully',
            data: result,
        });
    }),
};

export default ExpenseController;
