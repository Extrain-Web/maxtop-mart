import express from 'express';
import { authMiddleware, authorizeRoles, authorizePermission, authorizeAnyPermission } from '../../middlewares/auth';
import FinanceController from './finance.controller';

const router = express.Router();

// All finance routes are admin-only.
router.use(authMiddleware, authorizeRoles('admin'), authorizeAnyPermission('manage_payments', 'view_analytics'));

router.get('/summary', FinanceController.getSummary);
router.get('/report/pdf', FinanceController.getReportPdf);
router.get('/report/excel', FinanceController.getReportExcel);

export const FinanceRoutes = router;
