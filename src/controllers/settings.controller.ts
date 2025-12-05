import { Request, Response, NextFunction } from 'express';
import * as settingsService from '../services/settings.service';
import { sendSuccess } from '../utils/response';
import { saveSettingsImage } from '../services/upload.service';

/**
 * GET /api/settings
 * Obtiene la configuración de la compañía
 */
export async function getSettings(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const settings = await settingsService.getSettings();
    sendSuccess(res, settings);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/settings
 * Actualiza la configuración de la compañía
 */
export async function updateSettings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const updateData = { ...req.body };

    // Si se subió una imagen, guardarla
    if (req.file) {
      const uploadedImage = await saveSettingsImage(req.file);
      updateData.heroImageUrl = uploadedImage.url;
    }

    const settings = await settingsService.updateSettings(updateData, !!req.file);
    sendSuccess(res, settings, 'Configuración actualizada exitosamente');
  } catch (error) {
    next(error);
  }
}
