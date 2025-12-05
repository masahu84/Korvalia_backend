import { Router } from 'express';
import * as pageSettingsController from '../controllers/page-settings.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * GET /api/pages
 * Obtiene todas las configuraciones de páginas (público)
 */
router.get('/', pageSettingsController.getAllPageSettings);

/**
 * GET /api/pages/:pageKey
 * Obtiene la configuración de una página específica (público)
 */
router.get('/:pageKey', pageSettingsController.getPageSettings);

/**
 * PUT /api/pages/:pageKey
 * Actualiza la configuración de una página (protegido)
 */
router.put('/:pageKey', authMiddleware, pageSettingsController.updatePageSettings);

export default router;
