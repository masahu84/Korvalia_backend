import prisma from '../prisma/client';
import { OperationType, PropertyCategory, PropertyStatus, Prisma } from '../generated/prisma/client';
import { generateUniquePropertySlug } from '../utils/slugify';
import { throwNotFound, throwValidationError } from '../middlewares/error.middleware';
import { deleteFileByUrl } from '../utils/file';

export interface PropertyFilters {
  operation?: OperationType;
  propertyType?: PropertyCategory;
  city?: string; // slug de ciudad
  cityId?: number;
  bedrooms?: number;
  bathrooms?: number;
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  hasPool?: boolean;
  hasParking?: boolean;
  hasElevator?: boolean;
  hasTerrace?: boolean;
  hasGarden?: boolean;
  furnished?: boolean;
  petsAllowed?: boolean;
  isFeatured?: boolean;
  status?: PropertyStatus;
  search?: string; // búsqueda por texto
  orderBy?: 'price_asc' | 'price_desc' | 'recent' | 'oldest';
  limit?: number;
  offset?: number;
}

export interface CreatePropertyData {
  title: string;
  description: string;
  operation: OperationType;
  propertyType: PropertyCategory;
  price: number;
  currency?: string;
  cityId: number;
  neighborhood?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  areaM2?: number;
  builtYear?: number;
  floor?: number;
  hasElevator?: boolean;
  hasParking?: boolean;
  hasPool?: boolean;
  hasTerrace?: boolean;
  hasGarden?: boolean;
  furnished?: boolean;
  petsAllowed?: boolean;
  energyRating?: string;
  status?: PropertyStatus;
  isFeatured?: boolean;
}

export interface PropertyImageData {
  url: string;
  alt?: string;
  order: number;
  isPrimary?: boolean;
}

/**
 * Obtiene propiedades con filtros
 */
export async function getProperties(filters: PropertyFilters = {}) {
  const where: Prisma.PropertyWhereInput = {};

  // Filtros
  if (filters.operation) {
    where.operation = filters.operation;
  }

  if (filters.propertyType) {
    where.propertyType = filters.propertyType;
  }

  if (filters.city) {
    where.city = { slug: filters.city };
  }

  if (filters.cityId) {
    where.cityId = filters.cityId;
  }

  // Búsqueda por texto en múltiples campos
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { neighborhood: { contains: filters.search, mode: 'insensitive' } },
      { address: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    where.price = {};
    if (filters.priceMin !== undefined) where.price.gte = filters.priceMin;
    if (filters.priceMax !== undefined) where.price.lte = filters.priceMax;
  }

  // Filtro por área (m²)
  if (filters.areaMin !== undefined || filters.areaMax !== undefined) {
    where.areaM2 = {};
    if (filters.areaMin !== undefined) where.areaM2.gte = filters.areaMin;
    if (filters.areaMax !== undefined) where.areaM2.lte = filters.areaMax;
  }

  if (filters.bedrooms !== undefined) {
    where.bedrooms = { gte: filters.bedrooms };
  }

  if (filters.bathrooms !== undefined) {
    where.bathrooms = { gte: filters.bathrooms };
  }

  if (filters.hasPool !== undefined) where.hasPool = filters.hasPool;
  if (filters.hasParking !== undefined) where.hasParking = filters.hasParking;
  if (filters.hasElevator !== undefined) where.hasElevator = filters.hasElevator;
  if (filters.hasTerrace !== undefined) where.hasTerrace = filters.hasTerrace;
  if (filters.hasGarden !== undefined) where.hasGarden = filters.hasGarden;
  if (filters.furnished !== undefined) where.furnished = filters.furnished;
  if (filters.petsAllowed !== undefined) where.petsAllowed = filters.petsAllowed;
  if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured;
  if (filters.status) where.status = filters.status;

  // Ordenamiento
  let orderBy: Prisma.PropertyOrderByWithRelationInput = { createdAt: 'desc' };
  if (filters.orderBy === 'price_asc') orderBy = { price: 'asc' };
  else if (filters.orderBy === 'price_desc') orderBy = { price: 'desc' };
  else if (filters.orderBy === 'recent') orderBy = { createdAt: 'desc' };
  else if (filters.orderBy === 'oldest') orderBy = { createdAt: 'asc' };

  const properties = await prisma.property.findMany({
    where,
    orderBy,
    skip: filters.offset,
    take: filters.limit,
    include: {
      city: true,
      images: { orderBy: { order: 'asc' } },
    },
  });

  return properties;
}

/**
 * Obtiene el total de propiedades con filtros (para paginación)
 */
export async function getPropertiesCount(filters: PropertyFilters = {}): Promise<number> {
  const where: Prisma.PropertyWhereInput = {};

  if (filters.operation) where.operation = filters.operation;
  if (filters.propertyType) where.propertyType = filters.propertyType;
  if (filters.city) where.city = { slug: filters.city };
  if (filters.cityId) where.cityId = filters.cityId;

  // Búsqueda por texto en múltiples campos
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { neighborhood: { contains: filters.search, mode: 'insensitive' } },
      { address: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    where.price = {};
    if (filters.priceMin !== undefined) where.price.gte = filters.priceMin;
    if (filters.priceMax !== undefined) where.price.lte = filters.priceMax;
  }
  // Filtro por área (m²) en count
  if (filters.areaMin !== undefined || filters.areaMax !== undefined) {
    where.areaM2 = {};
    if (filters.areaMin !== undefined) where.areaM2.gte = filters.areaMin;
    if (filters.areaMax !== undefined) where.areaM2.lte = filters.areaMax;
  }
  if (filters.bedrooms !== undefined) where.bedrooms = { gte: filters.bedrooms };
  if (filters.bathrooms !== undefined) where.bathrooms = { gte: filters.bathrooms };
  if (filters.hasPool !== undefined) where.hasPool = filters.hasPool;
  if (filters.hasParking !== undefined) where.hasParking = filters.hasParking;
  if (filters.hasElevator !== undefined) where.hasElevator = filters.hasElevator;
  if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured;
  if (filters.status) where.status = filters.status;

  return prisma.property.count({ where });
}

/**
 * Obtiene una propiedad por ID
 */
export async function getPropertyById(id: number) {
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      city: true,
      images: { orderBy: { order: 'asc' } },
    },
  });

  if (!property) {
    throwNotFound('Propiedad');
  }

  return property;
}

/**
 * Obtiene una propiedad por slug
 */
export async function getPropertyBySlug(slug: string) {
  const property = await prisma.property.findUnique({
    where: { slug },
    include: {
      city: true,
      images: { orderBy: { order: 'asc' } },
    },
  });

  if (!property) {
    throwNotFound('Propiedad');
  }

  return property;
}

/**
 * Crea una nueva propiedad
 */
export async function createProperty(data: CreatePropertyData, images: PropertyImageData[] = []) {
  // Validaciones
  validatePropertyData(data);

  // Verificar que la ciudad existe
  const cityExists = await prisma.city.findUnique({ where: { id: data.cityId } });
  if (!cityExists) {
    throwValidationError({ cityId: 'La ciudad no existe' });
  }

  // Generar slug único
  const slug = await generateUniquePropertySlug(data.title);

  // Crear propiedad con imágenes
  const property = await prisma.property.create({
    data: {
      ...data,
      slug,
      images: images.length > 0 ? { create: images } : undefined,
    },
    include: {
      city: true,
      images: { orderBy: { order: 'asc' } },
    },
  });

  return property;
}

/**
 * Actualiza una propiedad
 */
export async function updateProperty(id: number, data: Partial<CreatePropertyData>) {
  // Verificar que existe
  await getPropertyById(id);

  // Validar datos parciales
  if (data.title !== undefined && data.title.trim().length === 0) {
    throwValidationError({ title: 'El título no puede estar vacío' });
  }
  if (data.description !== undefined && data.description.trim().length === 0) {
    throwValidationError({ description: 'La descripción no puede estar vacía' });
  }
  if (data.price !== undefined && data.price <= 0) {
    throwValidationError({ price: 'El precio debe ser mayor a 0' });
  }
  if (data.address !== undefined && data.address.trim().length === 0) {
    throwValidationError({ address: 'La dirección no puede estar vacía' });
  }

  // Si se cambia la ciudad, verificar que existe
  if (data.cityId !== undefined) {
    const cityExists = await prisma.city.findUnique({ where: { id: data.cityId } });
    if (!cityExists) {
      throwValidationError({ cityId: 'La ciudad no existe' });
    }
  }

  // Si se cambia el título, generar nuevo slug
  const updateData: any = { ...data };
  if (data.title !== undefined) {
    updateData.slug = await generateUniquePropertySlug(data.title, id);
  }

  return prisma.property.update({
    where: { id },
    data: updateData,
    include: {
      city: true,
      images: { orderBy: { order: 'asc' } },
    },
  });
}

/**
 * Elimina una propiedad y sus imágenes
 */
export async function deleteProperty(id: number) {
  const property = await getPropertyById(id);

  // Eliminar imágenes del filesystem
  if (property.images && property.images.length > 0) {
    property.images.forEach((image) => {
      try {
        deleteFileByUrl(image.url);
      } catch (error) {
        console.error(`Error al eliminar imagen ${image.url}:`, error);
      }
    });
  }

  // Eliminar propiedad (las imágenes en BD se eliminan por cascade)
  return prisma.property.delete({
    where: { id },
  });
}

/**
 * Agrega imágenes a una propiedad
 */
export async function addPropertyImages(propertyId: number, images: PropertyImageData[]) {
  await getPropertyById(propertyId);

  const createdImages = await Promise.all(
    images.map((image) =>
      prisma.propertyImage.create({
        data: {
          ...image,
          propertyId,
        },
      })
    )
  );

  return createdImages;
}

/**
 * Elimina una imagen de una propiedad
 */
export async function deletePropertyImage(imageId: number) {
  const image = await prisma.propertyImage.findUnique({
    where: { id: imageId },
  });

  if (!image) {
    throwNotFound('Imagen');
  }

  // Eliminar del filesystem
  try {
    deleteFileByUrl(image.url);
  } catch (error) {
    console.error(`Error al eliminar imagen ${image.url}:`, error);
  }

  // Eliminar de la BD
  return prisma.propertyImage.delete({
    where: { id: imageId },
  });
}

/**
 * Actualiza el orden de las imágenes de una propiedad
 */
export async function updatePropertyImagesOrder(updates: { id: number; order: number }[]) {
  const updatePromises = updates.map((update) =>
    prisma.propertyImage.update({
      where: { id: update.id },
      data: { order: update.order },
    })
  );

  return Promise.all(updatePromises);
}

/**
 * Reemplaza todas las imágenes de una propiedad
 * Elimina las imágenes antiguas y crea las nuevas
 * La primera imagen del array será marcada como principal
 */
export async function replacePropertyImages(propertyId: number, newImageUrls: string[], altText: string = 'Imagen de propiedad', primaryIndex: number = 0) {
  // Obtener imágenes actuales
  const currentImages = await prisma.propertyImage.findMany({
    where: { propertyId },
  });

  // Identificar qué imágenes eliminar (las que no están en el nuevo array)
  const imagesToDelete = currentImages.filter(
    (img) => !newImageUrls.includes(img.url)
  );

  // Identificar qué URLs son nuevas (no existían antes)
  const currentUrls = currentImages.map((img) => img.url);
  const urlsToAdd = newImageUrls.filter((url) => !currentUrls.includes(url));

  // Eliminar imágenes antiguas del filesystem y BD
  for (const img of imagesToDelete) {
    try {
      deleteFileByUrl(img.url);
    } catch (error) {
      console.error(`Error al eliminar imagen ${img.url}:`, error);
    }
    await prisma.propertyImage.delete({ where: { id: img.id } });
  }

  // Crear nuevas imágenes
  for (let i = 0; i < urlsToAdd.length; i++) {
    const urlIndex = newImageUrls.indexOf(urlsToAdd[i]);
    await prisma.propertyImage.create({
      data: {
        url: urlsToAdd[i],
        alt: altText,
        order: urlIndex,
        isPrimary: urlIndex === primaryIndex,
        propertyId,
      },
    });
  }

  // Actualizar el orden y isPrimary de todas las imágenes según el nuevo array
  for (let i = 0; i < newImageUrls.length; i++) {
    await prisma.propertyImage.updateMany({
      where: { propertyId, url: newImageUrls[i] },
      data: {
        order: i,
        isPrimary: i === primaryIndex,
      },
    });
  }

  // Retornar las imágenes actualizadas
  return prisma.propertyImage.findMany({
    where: { propertyId },
    orderBy: { order: 'asc' },
  });
}

/**
 * Establece una imagen como principal para una propiedad
 */
export async function setPropertyPrimaryImage(propertyId: number, imageId: number) {
  // Verificar que la propiedad existe
  await getPropertyById(propertyId);

  // Quitar isPrimary de todas las imágenes de esta propiedad
  await prisma.propertyImage.updateMany({
    where: { propertyId },
    data: { isPrimary: false },
  });

  // Establecer la imagen seleccionada como principal
  return prisma.propertyImage.update({
    where: { id: imageId },
    data: { isPrimary: true },
  });
}

/**
 * Obtiene propiedades destacadas
 */
export async function getFeaturedProperties(limit: number = 6) {
  return prisma.property.findMany({
    where: {
      isFeatured: true,
      status: PropertyStatus.ACTIVE,
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      city: true,
      images: {
        orderBy: { order: 'asc' },
        take: 1,
      },
    },
  });
}

/**
 * Valida los datos de una propiedad
 */
function validatePropertyData(data: CreatePropertyData): void {
  const errors: Record<string, string> = {};

  // Campos requeridos
  if (!data.title || data.title.trim().length === 0) {
    errors.title = 'El título es requerido';
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.description = 'La descripción es requerida';
  }

  if (!data.price || data.price <= 0) {
    errors.price = 'El precio debe ser mayor a 0';
  }

  if (!data.operation) {
    errors.operation = 'El tipo de operación es requerido (RENT o SALE)';
  }

  if (!data.propertyType) {
    errors.propertyType = 'El tipo de propiedad es requerido';
  }

  if (!data.cityId || data.cityId === 0) {
    errors.cityId = 'La ciudad es requerida';
  }

  if (!data.address || data.address.trim().length === 0) {
    errors.address = 'La dirección es requerida';
  }

  if (Object.keys(errors).length > 0) {
    throwValidationError(errors);
  }
}
