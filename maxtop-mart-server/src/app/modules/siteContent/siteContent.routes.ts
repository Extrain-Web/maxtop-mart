import express from 'express';
import SiteContentController from './siteContent.controller';
import { authMiddleware, authorizeRoles, authorizePermission, authorizeAnyPermission } from '../../middlewares/auth';

const router = express.Router();

// Public — anyone can fetch site content
router.get('/', SiteContentController.get);

// Public — get single legal page by slug
router.get('/legal/:slug', SiteContentController.getLegalPage);

// Admin — get all legal pages
router.get('/legal', authMiddleware, authorizeRoles('admin'), authorizePermission('manage_site_content'), SiteContentController.getAllLegalPages);

// Admin — full update
router.put('/', authMiddleware, authorizeRoles('admin'), authorizeAnyPermission('manage_site_content', 'manage_settings', 'manage_categories'), SiteContentController.update);

// Admin — update legal page by slug
router.put('/legal/:slug', authMiddleware, authorizeRoles('admin'), authorizePermission('manage_site_content'), SiteContentController.updateLegalPage);

// Admin — update specific section
router.patch('/:section', authMiddleware, authorizeRoles('admin'), authorizePermission('manage_site_content'), SiteContentController.updateSection);

export const SiteContentRoutes = router;
