import prisma from '../prisma/client';
import { generateUniqueCitySlug } from '../utils/slugify';
import { throwNotFound, throwValidationError, AppError } from '../middlewares/error.middleware';

export interface CreateCityData {
  name: string;
  province?: string;
  active?: boolean;
  latitude?: number;
  longitude?: number;
}

/**
 * Obtiene todas las ciudades
 */
export async function getAllCities() {
  return prisma.city.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { properties: true },
      },
    },
  });
}

/**
 * Obtiene una ciudad por ID
 */
export async function getCityById(id: number) {
  const city = await prisma.city.findUnique({
    where: { id },
    include: {
      _count: {
        select: { properties: true },
      },
    },
  });

  if (!city) {
    throwNotFound('Ciudad');
  }

  return city;
}

/**
 * Obtiene una ciudad por slug
 */
export async function getCityBySlug(slug: string) {
  const city = await prisma.city.findUnique({
    where: { slug },
    include: {
      _count: {
        select: { properties: true },
      },
    },
  });

  if (!city) {
    throwNotFound('Ciudad');
  }

  return city;
}

/**
 * Crea una nueva ciudad
 */
export async function createCity(data: CreateCityData) {
  // Validar
  if (!data.name || data.name.trim().length === 0) {
    throwValidationError({ name: 'El nombre es requerido' });
  }

  // Generar slug único
  const slug = await generateUniqueCitySlug(data.name);

  return prisma.city.create({
    data: {
      name: data.name.trim(),
      slug,
      province: data.province?.trim() || null,
      active: data.active !== undefined ? data.active : true,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
    },
  });
}

/**
 * Actualiza una ciudad
 */
export async function updateCity(id: number, data: Partial<CreateCityData>) {
  // Verificar que existe
  await getCityById(id);

  const updateData: any = {};

  if (data.name !== undefined) {
    if (data.name.trim().length === 0) {
      throwValidationError({ name: 'El nombre no puede estar vacío' });
    }
    updateData.name = data.name.trim();
    updateData.slug = await generateUniqueCitySlug(data.name, id);
  }

  if (data.province !== undefined) {
    updateData.province = data.province?.trim() || null;
  }

  if (data.active !== undefined) {
    updateData.active = data.active;
  }

  if (data.latitude !== undefined) {
    updateData.latitude = data.latitude;
  }

  if (data.longitude !== undefined) {
    updateData.longitude = data.longitude;
  }

  return prisma.city.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Elimina una ciudad
 */
export async function deleteCity(id: number) {
  // Verificar que existe
  await getCityById(id);

  // Verificar que no tenga propiedades asociadas
  const propertiesCount = await prisma.property.count({
    where: { cityId: id },
  });

  if (propertiesCount > 0) {
    throw new AppError('No se puede eliminar la ciudad porque tiene propiedades asociadas', 400);
  }

  return prisma.city.delete({
    where: { id },
  });
}
