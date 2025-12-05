import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { uploadSingleImage, uploadMultipleImages, handleMulterError } from '../middlewares/upload.middleware';
import { savePropertyImage } from '../services/upload.service';
import { sendSuccess } from '../utils/response';

const router = Router();

/**
 * POST /api/upload
 * Sube una única imagen
 * Requiere autenticación
 */
router.post(
  '/',
  authMiddleware,
  uploadSingleImage,
  handleMulterError,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No se ha enviado ninguna imagen',
        });
        return;
      }

      const uploadedImage = await savePropertyImage(req.file);
      sendSuccess(res, uploadedImage, 'Imagen subida exitosamente');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/upload/multiple
 * Sube múltiples imágenes
 * Requiere autenticación
 */
router.post(
  '/multiple',
  authMiddleware,
  uploadMultipleImages,
  handleMulterError,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No se han enviado imágenes',
        });
        return;
      }

      const uploadedImages = await Promise.all(
        req.files.map((file) => savePropertyImage(file))
      );

      const urls = uploadedImages.map((img) => img.url);

      sendSuccess(res, { urls }, 'Imágenes subidas exitosamente');
    } catch (error) {
      next(error);
    }
  }
);

export default router;
