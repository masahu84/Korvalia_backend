import prisma from '../prisma/client';
import { throwValidationError } from '../middlewares/error.middleware';

export interface PageSettingsData {
  title?: string;
  subtitle?: string;
  metaTitle?: string;
  metaDescription?: string;
  blocks?: any;
  testimonialName?: string;
  testimonialRole?: string;
  testimonialText?: string;
  testimonialImage?: string;
}

const VALID_PAGE_KEYS = ['home', 'properties', 'about', 'contact'] as const;
export type PageKey = typeof VALID_PAGE_KEYS[number];

/**
 * Valida que el pageKey sea válido
 */
function validatePageKey(pageKey: string): PageKey {
  if (!VALID_PAGE_KEYS.includes(pageKey as PageKey)) {
    throwValidationError({
      pageKey: `El pageKey debe ser uno de: ${VALID_PAGE_KEYS.join(', ')}`
    });
  }
  return pageKey as PageKey;
}

/**
 * Obtiene la configuración de una página
 */
export async function getPageSettings(pageKey: string) {
  const validPageKey = validatePageKey(pageKey);

  let pageSettings = await prisma.pageSettings.findUnique({
    where: { pageKey: validPageKey },
  });

  // Si no existe, crear una entrada por defecto
  if (!pageSettings) {
    pageSettings = await prisma.pageSettings.create({
      data: {
        pageKey: validPageKey,
        title: '',
        subtitle: '',
        metaTitle: '',
        metaDescription: '',
        blocks: {},
      },
    });
  }

  return pageSettings;
}

/**
 * Actualiza la configuración de una página
 */
export async function updatePageSettings(pageKey: string, data: PageSettingsData) {
  const validPageKey = validatePageKey(pageKey);

  // Obtener o crear la configuración
  await getPageSettings(validPageKey);

  const updateData: any = {};

  if (data.title !== undefined) {
    updateData.title = data.title;
  }

  if (data.subtitle !== undefined) {
    updateData.subtitle = data.subtitle;
  }

  if (data.metaTitle !== undefined) {
    updateData.metaTitle = data.metaTitle;
  }

  if (data.metaDescription !== undefined) {
    updateData.metaDescription = data.metaDescription;
  }

  if (data.blocks !== undefined) {
    updateData.blocks = data.blocks;
  }

  if (data.testimonialName !== undefined) {
    updateData.testimonialName = data.testimonialName?.trim() || null;
  }

  if (data.testimonialRole !== undefined) {
    updateData.testimonialRole = data.testimonialRole?.trim() || null;
  }

  if (data.testimonialText !== undefined) {
    updateData.testimonialText = data.testimonialText?.trim() || null;
  }

  if (data.testimonialImage !== undefined) {
    updateData.testimonialImage = data.testimonialImage?.trim() || null;
  }

  return prisma.pageSettings.update({
    where: { pageKey: validPageKey },
    data: updateData,
  });
}

/**
 * Obtiene todas las configuraciones de páginas
 */
export async function getAllPageSettings() {
  return prisma.pageSettings.findMany({
    orderBy: { pageKey: 'asc' },
  });
}
