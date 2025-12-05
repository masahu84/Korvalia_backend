import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { uploadSingleImage, handleMulterError } from '../middlewares/upload.middleware';

const router = Router();

/**
 * GET /api/settings
 * Obtiene la configuración de la compañía (público)
 */
router.get('/', settingsController.getSettings);

/**
 * PUT /api/settings
 * Actualiza la configuración de la compañía (protegido)
 * Acepta un campo 'image' para la imagen del hero
 */
router.put(
  '/',
  authMiddleware,
  uploadSingleImage,
  handleMulterError,
  settingsController.updateSettings
);

export default router;
