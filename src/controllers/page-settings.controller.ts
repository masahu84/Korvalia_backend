import { Request, Response, NextFunction } from 'express';
import * as pageSettingsService from '../services/page-settings.service';
import { sendSuccess } from '../utils/response';

/**
 * GET /api/pages/:pageKey
 * Obtiene la configuración de una página específica
 */
export async function getPageSettings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { pageKey } = req.params;
    const pageSettings = await pageSettingsService.getPageSettings(pageKey);
    sendSuccess(res, pageSettings);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/pages/:pageKey
 * Actualiza la configuración de una página específica
 */
export async function updatePageSettings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { pageKey } = req.params;
    const pageSettings = await pageSettingsService.updatePageSettings(pageKey, req.body);
    sendSuccess(res, pageSettings, 'Configuración actualizada exitosamente');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/pages
 * Obtiene todas las configuraciones de páginas
 */
export async function getAllPageSettings(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const allSettings = await pageSettingsService.getAllPageSettings();
    sendSuccess(res, allSettings);
  } catch (error) {
    next(error);
  }
}
