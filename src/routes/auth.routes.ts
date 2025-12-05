import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * POST /api/auth/login
 * Inicia sesión y obtiene un token JWT
 */
router.post('/login', authController.login);

/**
 * GET /api/auth/me
 * Obtiene los datos del usuario autenticado
 * Requiere autenticación
 */
router.get('/me', authMiddleware, authController.getMe);

/**
 * POST /api/auth/change-password
 * Cambia la contraseña del usuario autenticado
 * Requiere autenticación
 */
router.post('/change-password', authMiddleware, authController.changePassword);

/**
 * POST /api/auth/reset-password
 * Restablece la contraseña de un usuario
 * No requiere autenticación (para recuperación de contraseña)
 */
router.post('/reset-password', authController.resetPassword);

export default router;
