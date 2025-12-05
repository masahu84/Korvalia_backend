import { Router } from 'express';
import * as citiesController from '../controllers/cities.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * GET /api/cities
 * Obtiene todas las ciudades (público)
 */
router.get('/', citiesController.getAllCities);

/**
 * GET /api/cities/:id
 * Obtiene una ciudad por ID (público)
 */
router.get('/:id', citiesController.getCityById);

/**
 * POST /api/cities
 * Crea una nueva ciudad (protegido)
 */
router.post('/', authMiddleware, citiesController.createCity);

/**
 * PUT /api/cities/:id
 * Actualiza una ciudad (protegido)
 */
router.put('/:id', authMiddleware, citiesController.updateCity);

/**
 * DELETE /api/cities/:id
 * Elimina una ciudad (protegido)
 */
router.delete('/:id', authMiddleware, citiesController.deleteCity);

export default router;
