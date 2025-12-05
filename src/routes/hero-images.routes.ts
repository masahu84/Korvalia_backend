import { Router } from 'express';
import * as heroImagesController from '../controllers/hero-images.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import multer from 'multer';

const router = Router();

// Configurar multer para recibir archivos en memoria
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Rutas públicas (sin autenticación)
 * GET / - Devuelve todas las imágenes si hay token, o solo activas si no hay token
 * GET /active - Devuelve solo las imágenes activas (legacy)
 */
router.get('/', heroImagesController.getHeroImages);
router.get('/active', heroImagesController.getActiveHeroImages);

/**
 * Rutas protegidas (requieren autenticación)
 */
router.get('/:id', authMiddleware, heroImagesController.getHeroImageById);
router.post('/', authMiddleware, heroImagesController.createHeroImage);
router.post('/upload', authMiddleware, upload.single('image'), heroImagesController.uploadHeroImage);
router.put('/bulk', authMiddleware, heroImagesController.updateMultipleHeroImages);
router.put('/:id', authMiddleware, heroImagesController.updateHeroImage);
router.delete('/:id', authMiddleware, heroImagesController.deleteHeroImage);

export default router;
