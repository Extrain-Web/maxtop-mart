import express from 'express';
import ExpenseController from './expense.controller';
import { authMiddleware, authorizeRoles } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { createExpenseValidation, updateExpenseValidation } from './expense.validation';

const router = express.Router();

// All expense routes require admin or superadmin authentication
router.use(authMiddleware, authorizeRoles('admin', 'superadmin'));

router.get('/summary', ExpenseController.getSummary);
router.get('/', ExpenseController.getExpenses);
router.get('/:id', ExpenseController.getExpenseById);
router.post('/', validateRequest(createExpenseValidation), ExpenseController.createExpense);
router.patch('/:id', validateRequest(updateExpenseValidation), ExpenseController.updateExpense);
router.delete('/:id', ExpenseController.deleteExpense);

export const ExpenseRoutes = router;
