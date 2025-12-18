/**
 * Rutas para la integración con Emblematic
 *
 * Prefijo: /api/emblematic
 */

import { Router } from 'express';
import * as emblematicController from '../controllers/emblematic.controller';

const router = Router();

// Configuración y estado
router.get('/config', emblematicController.getConfig);
router.get('/status', emblematicController.getStatus);

// Listas dinámicas para filtros
router.get('/lists', emblematicController.getLists);

// Ciudades disponibles (extraídas de las propiedades)
router.get('/cities', emblematicController.getAvailableCities);

// Propiedades - IMPORTANTE: rutas específicas antes de parámetros
router.get('/properties/featured', emblematicController.getFeaturedProperties);
router.get('/properties/:reference', emblematicController.getPropertyByReference);
router.get('/properties', emblematicController.getProperties);

export default router;
