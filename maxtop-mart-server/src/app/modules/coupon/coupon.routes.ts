import express from 'express';
import CouponController from './coupon.controller';
import { authMiddleware, authorizeRoles, authorizePermission, authorizeAnyPermission } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { createCouponValidation, validateCouponValidation } from './coupon.validation';

const router = express.Router();

router.post('/validate', authMiddleware, validateRequest(validateCouponValidation), CouponController.validate);
router.get('/', authMiddleware, authorizeRoles('admin'), authorizePermission('manage_coupons'), CouponController.getAll);
router.post('/', authMiddleware, authorizeRoles('admin'), authorizePermission('manage_coupons'), validateRequest(createCouponValidation), CouponController.create);
router.patch('/:id', authMiddleware, authorizeRoles('admin'), authorizePermission('manage_coupons'), CouponController.update);
router.delete('/:id', authMiddleware, authorizeRoles('admin'), authorizePermission('manage_coupons'), CouponController.delete);

export const CouponRoutes = router;
