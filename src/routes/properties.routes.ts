import { Router } from 'express';
import * as propertiesController from '../controllers/properties.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { uploadMultipleImages, uploadMultipleImagesOptional, handleMulterError } from '../middlewares/upload.middleware';

const router = Router();

/**
 * GET /api/properties
 * Obtiene propiedades con filtros (público)
 * Query params: operation, propertyType, city, cityId, bedrooms, bathrooms,
 *               priceMin, priceMax, hasPool, hasParking, hasElevator, etc.
 */
router.get('/', propertiesController.getProperties);

/**
 * GET /api/properties/featured
 * Obtiene propiedades destacadas (público)
 * Query params: limit (opcional, default 6)
 */
router.get('/featured', propertiesController.getFeaturedProperties);

/**
 * GET /api/properties/slug/:slug
 * Obtiene una propiedad por slug (público)
 */
router.get('/slug/:slug', propertiesController.getPropertyBySlug);

/**
 * GET /api/properties/:id
 * Obtiene una propiedad por ID (público)
 */
router.get('/:id', propertiesController.getPropertyById);

/**
 * POST /api/properties
 * Crea una nueva propiedad (protegido)
 * Acepta JSON con URLs de imágenes o FormData con archivos
 */
router.post(
  '/',
  authMiddleware,
  uploadMultipleImagesOptional,
  handleMulterError,
  propertiesController.createProperty
);

/**
 * PUT /api/properties/:id
 * Actualiza una propiedad (protegido)
 */
router.put(
  '/:id',
  authMiddleware,
  propertiesController.updateProperty
);

/**
 * DELETE /api/properties/:id
 * Elimina una propiedad (protegido)
 */
router.delete('/:id', authMiddleware, propertiesController.deleteProperty);

/**
 * POST /api/properties/:id/images
 * Agrega imágenes a una propiedad existente (protegido)
 */
router.post(
  '/:id/images',
  authMiddleware,
  uploadMultipleImages,
  handleMulterError,
  propertiesController.addPropertyImages
);

/**
 * DELETE /api/properties/images/:imageId
 * Elimina una imagen específica (protegido)
 */
router.delete('/images/:imageId', authMiddleware, propertiesController.deletePropertyImage);

/**
 * PUT /api/properties/:id/images/order
 * Actualiza el orden de las imágenes (protegido)
 * Body: { updates: [{ id: number, order: number }] }
 */
router.put('/:id/images/order', authMiddleware, propertiesController.updatePropertyImagesOrder);

export default router;
