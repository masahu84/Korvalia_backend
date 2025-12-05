import prisma from '../prisma/client';
import { throwValidationError } from '../middlewares/error.middleware';
import { deleteFileByUrl } from '../utils/file';

export interface UpdateSettingsData {
  heroTitle?: string;
  heroSubtitle?: string;
  heroImages?: string[];
  logoUrl?: string;
  companyName?: string;
  slogan?: string;
  phone?: string;
  email?: string;
  address?: string;
  schedule?: string;
  aboutUs?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  whatsappNumber?: string;
  legalNoticeUrl?: string;
  privacyPolicyUrl?: string;
  cookiesPolicyUrl?: string;
}

/**
 * Obtiene la configuración de la compañía (siempre debe existir una)
 * Implementa upsert implícito para nunca fallar
 */
export async function getSettings() {
  try {
    let settings = await prisma.companySettings.findFirst();

    // Si no existe, crear una con valores por defecto
    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          heroTitle: 'Bienvenido a nuestra inmobiliaria',
          heroSubtitle: 'Encuentra la propiedad de tus sueños',
          heroImages: [],
        },
      });
    }

    return settings;
  } catch (error) {
    console.error('Error en getSettings:', error);
    // Si hay algún error, intentar crear un registro por defecto
    try {
      const settings = await prisma.companySettings.create({
        data: {
          heroTitle: 'Bienvenido a nuestra inmobiliaria',
          heroSubtitle: 'Encuentra la propiedad de tus sueños',
          heroImages: [],
        },
      });
      return settings;
    } catch (createError) {
      // Si aún así falla, devolver un objeto con valores por defecto
      console.error('Error crítico en getSettings:', createError);
      return {
        id: 1,
        heroTitle: 'Bienvenido a nuestra inmobiliaria',
        heroSubtitle: 'Encuentra la propiedad de tus sueños',
        heroImages: [],
        logoUrl: null,
        companyName: null,
        phone: null,
        email: null,
        address: null,
        instagramUrl: null,
        facebookUrl: null,
        whatsappNumber: null,
        schedule: null,
        aboutUs: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }
}

/**
 * Actualiza la configuración de la compañía
 */
export async function updateSettings(data: UpdateSettingsData, deleteOldImage: boolean = false) {
  // Validaciones básicas
  const errors: Record<string, string> = {};

  if (data.heroTitle !== undefined && data.heroTitle.trim().length === 0) {
    errors.heroTitle = 'El título del hero no puede estar vacío';
  }

  if (data.heroSubtitle !== undefined && data.heroSubtitle.trim().length === 0) {
    errors.heroSubtitle = 'El subtítulo del hero no puede estar vacío';
  }

  if (data.email !== undefined && data.email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.email = 'Email inválido';
    }
  }

  if (Object.keys(errors).length > 0) {
    throwValidationError(errors);
  }

  // Obtener configuración actual
  const currentSettings = await getSettings();

  // Si se va a actualizar las imágenes y existen anteriores, eliminarlas
  if (deleteOldImage && data.heroImages && currentSettings.heroImages?.length > 0) {
    try {
      currentSettings.heroImages.forEach((imageUrl) => {
        deleteFileByUrl(imageUrl);
      });
    } catch (error) {
      console.error('Error al eliminar imágenes anteriores:', error);
    }
  }

  // Preparar datos para actualización
  const updateData: any = {};

  if (data.heroTitle !== undefined) updateData.heroTitle = data.heroTitle.trim();
  if (data.heroSubtitle !== undefined) updateData.heroSubtitle = data.heroSubtitle.trim();
  if (data.heroImages !== undefined) updateData.heroImages = data.heroImages;
  if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
  if (data.companyName !== undefined) updateData.companyName = data.companyName?.trim() || null;
  if (data.slogan !== undefined) updateData.slogan = data.slogan?.trim() || null;
  if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
  if (data.email !== undefined) updateData.email = data.email?.trim() || null;
  if (data.address !== undefined) updateData.address = data.address?.trim() || null;
  if (data.schedule !== undefined) updateData.schedule = data.schedule?.trim() || null;
  if (data.aboutUs !== undefined) updateData.aboutUs = data.aboutUs?.trim() || null;
  if (data.instagramUrl !== undefined) updateData.instagramUrl = data.instagramUrl?.trim() || null;
  if (data.facebookUrl !== undefined) updateData.facebookUrl = data.facebookUrl?.trim() || null;
  if (data.linkedinUrl !== undefined) updateData.linkedinUrl = data.linkedinUrl?.trim() || null;
  if (data.whatsappNumber !== undefined) updateData.whatsappNumber = data.whatsappNumber?.trim() || null;
  if (data.legalNoticeUrl !== undefined) updateData.legalNoticeUrl = data.legalNoticeUrl?.trim() || null;
  if (data.privacyPolicyUrl !== undefined) updateData.privacyPolicyUrl = data.privacyPolicyUrl?.trim() || null;
  if (data.cookiesPolicyUrl !== undefined) updateData.cookiesPolicyUrl = data.cookiesPolicyUrl?.trim() || null;

  // Actualizar
  return prisma.companySettings.update({
    where: { id: currentSettings.id },
    data: updateData,
  });
}

/**
 * Restablece la configuración a valores por defecto
 */
export async function resetSettings() {
  const currentSettings = await getSettings();

  // Eliminar imágenes del hero si existen
  if (currentSettings.heroImages?.length > 0) {
    try {
      currentSettings.heroImages.forEach((imageUrl) => {
        deleteFileByUrl(imageUrl);
      });
    } catch (error) {
      console.error('Error al eliminar imágenes del hero:', error);
    }
  }

  return prisma.companySettings.update({
    where: { id: currentSettings.id },
    data: {
      heroTitle: 'Bienvenido a nuestra inmobiliaria',
      heroSubtitle: 'Encuentra la propiedad de tus sueños',
      heroImages: [],
      phone: null,
      email: null,
      address: null,
      instagramUrl: null,
      facebookUrl: null,
      whatsappNumber: null,
    },
  });
}
