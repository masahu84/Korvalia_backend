import { Request, Response, NextFunction } from 'express';
import * as heroImagesService from '../services/hero-images.service';
import { sendSuccess } from '../utils/response';
import { saveHeroImage } from '../utils/uploadHero';

/**
 * GET /api/hero-images
 * Obtiene todas las imágenes (para admin) o solo activas (para público)
 */
export async function getHeroImages(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Si viene del admin (con token), devolver todas
    // Si es público, solo las activas
    const isAdmin = req.headers.authorization !== undefined;
    const pageKey = (req.query.pageKey as string) || 'home';

    const images = isAdmin
      ? await heroImagesService.getAllHeroImages(pageKey)
      : await heroImagesService.getActiveHeroImages(pageKey);

    console.log(`[GET /api/hero-images] Devolviendo ${images.length} imágenes para ${pageKey} (admin: ${isAdmin})`);
    sendSuccess(res, images);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/hero-images/active
 * Obtiene solo las imágenes activas (para web pública)
 */
export async function getActiveHeroImages(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const images = await heroImagesService.getActiveHeroImages();
    console.log(`[GET /api/hero-images/active] Devolviendo ${images.length} imágenes activas`);
    sendSuccess(res, images);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/hero-images/:id
 * Obtiene una imagen por ID
 */
export async function getHeroImageById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: 'ID inválido',
      });
      return;
    }

    const image = await heroImagesService.getHeroImageById(id);
    sendSuccess(res, image);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/hero-images
 * Crea una nueva imagen del hero
 */
export async function createHeroImage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data: heroImagesService.CreateHeroImageData = {
      url: req.body.url,
      order: parseInt(req.body.order),
      active: req.body.active !== undefined ? req.body.active === true : true,
    };

    console.log('[POST /api/hero-images] Creando nueva imagen:', data);

    const image = await heroImagesService.createHeroImage(data);
    sendSuccess(res, image, 'Imagen del hero creada exitosamente', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/hero-images/:id
 * Actualiza una imagen del hero
 */
export async function updateHeroImage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: 'ID inválido',
      });
      return;
    }

    const updateData: heroImagesService.UpdateHeroImageData = {};
    if (req.body.url !== undefined) updateData.url = req.body.url;
    if (req.body.order !== undefined) updateData.order = parseInt(req.body.order);
    if (req.body.active !== undefined) updateData.active = req.body.active === true;

    console.log(`[PUT /api/hero-images/${id}] Actualizando imagen:`, updateData);

    const image = await heroImagesService.updateHeroImage(id, updateData);
    sendSuccess(res, image, 'Imagen del hero actualizada exitosamente');
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/hero-images/:id
 * Elimina una imagen del hero
 */
export async function deleteHeroImage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: 'ID inválido',
      });
      return;
    }

    console.log(`[DELETE /api/hero-images/${id}] Eliminando imagen`);

    await heroImagesService.deleteHeroImage(id);
    sendSuccess(res, null, 'Imagen del hero eliminada exitosamente');
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/hero-images/bulk
 * Actualiza múltiples imágenes a la vez
 */
export async function updateMultipleHeroImages(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const updates = req.body.updates;

    if (!Array.isArray(updates)) {
      res.status(400).json({
        success: false,
        error: 'Se requiere un array de actualizaciones',
      });
      return;
    }

    console.log('[PUT /api/hero-images/bulk] Actualizando múltiples imágenes:', updates.length);

    await heroImagesService.updateMultipleHeroImages(updates);
    sendSuccess(res, null, 'Imágenes actualizadas exitosamente');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/hero-images/upload
 * Sube una imagen del Hero y crea el registro en BD
 */
export async function uploadHeroImage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const file = req.file;
    const pageKey = req.body.pageKey || 'home';

    if (!file) {
      res.status(400).json({
        success: false,
        error: 'No se proporcionó ningún archivo',
      });
      return;
    }

    console.log('[POST /api/hero-images/upload] Subiendo imagen del Hero para', pageKey, ':', file.originalname);

    // Guardar imagen en /uploads/hero/
    const uploaded = await saveHeroImage(file);

    // Obtener el siguiente order para esta página específica
    const existingImages = await heroImagesService.getAllHeroImages(pageKey);
    const nextOrder = existingImages.length;

    // Crear registro en BD con el pageKey
    const image = await heroImagesService.createHeroImage({
      url: uploaded.url,
      order: nextOrder,
      active: true,
      pageKey: pageKey,
    });

    console.log('[POST /api/hero-images/upload] Imagen guardada:', image);

    sendSuccess(res, image, 'Imagen del hero subida exitosamente', 201);
  } catch (error) {
    next(error);
  }
}
