import prisma from '../prisma/client';
import { throwNotFound, throwValidationError } from '../middlewares/error.middleware';
import { deleteFileByUrl } from '../utils/file';

export interface CreateHeroImageData {
  url: string;
  order: number;
  active?: boolean;
  pageKey?: string;
}

export interface UpdateHeroImageData {
  url?: string;
  order?: number;
  active?: boolean;
}

/**
 * Obtiene todas las imágenes del hero (activas o no)
 * Para el admin
 */
export async function getAllHeroImages(pageKey: string = 'home') {
  return prisma.heroImage.findMany({
    where: { pageKey },
    orderBy: { order: 'asc' },
  });
}

/**
 * Obtiene solo las imágenes activas del hero
 * Para la web pública
 */
export async function getActiveHeroImages(pageKey: string = 'home') {
  return prisma.heroImage.findMany({
    where: {
      active: true,
      pageKey
    },
    orderBy: { order: 'asc' },
  });
}

/**
 * Obtiene una imagen por ID
 */
export async function getHeroImageById(id: number) {
  const image = await prisma.heroImage.findUnique({
    where: { id },
  });

  if (!image) {
    throwNotFound('Imagen del hero');
  }

  return image;
}

/**
 * Crea una nueva imagen del hero
 */
export async function createHeroImage(data: CreateHeroImageData) {
  // Validaciones
  if (!data.url || data.url.trim().length === 0) {
    throwValidationError({ url: 'La URL de la imagen es requerida' });
  }

  if (data.order === undefined || data.order < 0) {
    throwValidationError({ order: 'El orden debe ser un número positivo' });
  }

  return prisma.heroImage.create({
    data: {
      url: data.url,
      order: data.order,
      active: data.active !== undefined ? data.active : true,
      pageKey: data.pageKey || 'home',
    },
  });
}

/**
 * Actualiza una imagen del hero
 */
export async function updateHeroImage(id: number, data: UpdateHeroImageData) {
  // Verificar que existe
  await getHeroImageById(id);

  // Validaciones
  if (data.url !== undefined && data.url.trim().length === 0) {
    throwValidationError({ url: 'La URL de la imagen no puede estar vacía' });
  }

  if (data.order !== undefined && data.order < 0) {
    throwValidationError({ order: 'El orden debe ser un número positivo' });
  }

  const updateData: any = {};
  if (data.url !== undefined) updateData.url = data.url;
  if (data.order !== undefined) updateData.order = data.order;
  if (data.active !== undefined) updateData.active = data.active;

  return prisma.heroImage.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Elimina una imagen del hero
 */
export async function deleteHeroImage(id: number) {
  const image = await getHeroImageById(id);

  // Eliminar archivo físico
  try {
    deleteFileByUrl(image.url);
  } catch (error) {
    console.error(`Error al eliminar archivo físico ${image.url}:`, error);
  }

  // Eliminar de BD
  return prisma.heroImage.delete({
    where: { id },
  });
}

/**
 * Actualiza múltiples imágenes a la vez (para reordenar)
 */
export async function updateMultipleHeroImages(
  updates: { id: number; order?: number; active?: boolean }[]
) {
  const updatePromises = updates.map((update) => {
    const data: any = {};
    if (update.order !== undefined) data.order = update.order;
    if (update.active !== undefined) data.active = update.active;

    return prisma.heroImage.update({
      where: { id: update.id },
      data,
    });
  });

  return Promise.all(updatePromises);
}
