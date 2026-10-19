import express from 'express';
import OrderController from './order.controller';
import { authMiddleware, authorizeRoles } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { createOrderValidation, updateOrderStatusValidation } from './order.validation';

const router = express.Router();

// ── Guest checkout (no auth required) ────────────
router.post('/guest-checkout', validateRequest(createOrderValidation), OrderController.guestCheckout);

// ── Public order tracking (no auth required) ─────
router.get('/track/:orderId', OrderController.trackOrder);

// ── User routes ──────────────────────────────────
router.get('/my', authMiddleware, OrderController.getMyOrders);
router.post('/', authMiddleware, validateRequest(createOrderValidation), OrderController.create);
router.patch('/:id/cancel', authMiddleware, OrderController.cancel);

// ── Admin routes ─────────────────────────────────
router.get('/admin/all', authMiddleware, authorizeRoles('admin'), OrderController.getAll);
router.get('/admin/stats', authMiddleware, authorizeRoles('admin'), OrderController.getStats);
// Returns & Refunds board + CSV/PDF export — keep ABOVE '/admin/:id' so the
// literal paths aren't swallowed by the :id param.
router.get('/admin/returns', authMiddleware, authorizeRoles('admin', 'superadmin'), OrderController.getReturns);
router.get('/admin/returns/export', authMiddleware, authorizeRoles('admin', 'superadmin'), OrderController.exportReturns);
router.get('/admin/:id', authMiddleware, authorizeRoles('admin'), OrderController.getById);
router.patch('/admin/:id/status', authMiddleware, authorizeRoles('admin'), validateRequest(updateOrderStatusValidation), OrderController.updateStatus);
router.patch('/admin/:id/payment', authMiddleware, authorizeRoles('admin'), OrderController.updatePaymentStatus);
router.patch('/admin/:id/note', authMiddleware, authorizeRoles('admin'), OrderController.addNote);
router.patch('/admin/:id/tracking', authMiddleware, authorizeRoles('admin'), OrderController.updateOrderTracking);
router.post('/admin/bulk-delete', authMiddleware, authorizeRoles('superadmin'), OrderController.bulkDelete);
router.delete('/admin/:id', authMiddleware, authorizeRoles('superadmin'), OrderController.delete);

// ── Legacy/general ───────────────────────────────
router.get('/:id', authMiddleware, OrderController.getById);

export const OrderRoutes = router;
