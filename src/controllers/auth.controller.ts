import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as authService from '../services/auth.service';
import { sendSuccess, sendUnauthorized } from '../utils/response';

/**
 * POST /api/auth/login
 * Autentica un usuario y devuelve un token JWT
 */
export async function login(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.login(req.body);
    sendSuccess(res, result, 'Login exitoso');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Obtiene los datos del usuario autenticado
 */
export async function getMe(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      sendUnauthorized(res, 'No autenticado');
      return;
    }

    const user = await authService.getAuthenticatedUser(req.user.id);
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/change-password
 * Cambia la contraseña del usuario autenticado
 */
export async function changePassword(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      sendUnauthorized(res, 'No autenticado');
      return;
    }

    const { currentPassword, newPassword } = req.body;

    await authService.changeUserPassword(req.user.id, currentPassword, newPassword);
    sendSuccess(res, null, 'Contraseña actualizada exitosamente');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/reset-password
 * Restablece la contraseña de un usuario
 */
export async function resetPassword(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, newPassword } = req.body;

    await authService.resetUserPassword(email, newPassword);
    sendSuccess(res, null, 'Contraseña restablecida exitosamente');
  } catch (error) {
    next(error);
  }
}
