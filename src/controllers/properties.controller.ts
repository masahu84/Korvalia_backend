import { Request, Response, NextFunction } from 'express';
import * as propertiesService from '../services/properties.service';
import { sendSuccess } from '../utils/response';
import { savePropertyImages } from '../services/upload.service';
import { OperationType, PropertyCategory, PropertyStatus } from '../generated/prisma/client';

/**
 * GET /api/properties
 * Obtiene propiedades con filtros
 */
export async function getProperties(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Procesar priceRange (formato: "min-max")
    let priceMin: number | undefined;
    let priceMax: number | undefined;

    if (req.query.priceRange) {
      const [min, max] = (req.query.priceRange as string).split('-');
      priceMin = min ? parseInt(min) : undefined;
      priceMax = max ? parseInt(max) : undefined;
    } else {
      priceMin = req.query.priceMin ? parseInt(req.query.priceMin as string) : req.query.minPrice ? parseInt(req.query.minPrice as string) : undefined;
      priceMax = req.query.priceMax ? parseInt(req.query.priceMax as string) : req.query.maxPrice ? parseInt(req.query.maxPrice as string) : undefined;
    }

    // Procesar areaRange (formato: "min-max")
    let areaMin: number | undefined;
    let areaMax: number | undefined;

    if (req.query.areaRange) {
      const [min, max] = (req.query.areaRange as string).split('-');
      areaMin = min ? parseInt(min) : undefined;
      areaMax = max ? parseInt(max) : undefined;
    }

    const filters: propertiesService.PropertyFilters = {
      operation: req.query.operation as OperationType,
      propertyType: req.query.propertyType as PropertyCategory,
      city: req.query.city as string,
      cityId: req.query.cityId ? parseInt(req.query.cityId as string) : undefined,
      search: req.query.search as string,
      bedrooms: req.query.bedrooms ? parseInt(req.query.bedrooms as string) : undefined,
      bathrooms: req.query.bathrooms ? parseInt(req.query.bathrooms as string) : undefined,
      priceMin,
      priceMax,
      areaMin,
      areaMax,
      hasPool: req.query.hasPool === 'true' ? true : undefined,
      hasParking: req.query.hasParking === 'true' ? true : undefined,
      hasElevator: req.query.hasElevator === 'true' ? true : undefined,
      hasTerrace: req.query.hasTerrace === 'true' ? true : undefined,
      hasGarden: req.query.hasGarden === 'true' ? true : undefined,
      furnished: req.query.furnished === 'true' ? true : undefined,
      petsAllowed: req.query.petsAllowed === 'true' ? true : undefined,
      isFeatured: req.query.isFeatured === 'true' ? true : undefined,
      status: req.query.status as PropertyStatus,
      orderBy: req.query.orderBy as any,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const properties = await propertiesService.getProperties(filters);
    const total = await propertiesService.getPropertiesCount(filters);

    sendSuccess(res, {
      properties,
      total,
      count: properties.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/properties/featured
 * Obtiene propiedades destacadas
 */
export async function getFeaturedProperties(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 6;
    const properties = await propertiesService.getFeaturedProperties(limit);
    sendSuccess(res, properties);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/properties/:id
 * Obtiene una propiedad por ID
 */
export async function getPropertyById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const id = parseInt(req.params.id);
  try {
    console.log(`[GET /api/properties/${id}] Obteniendo propiedad con ID: ${id}`);

    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: 'ID de propiedad inválido',
      });
      return;
    }

    const property = await propertiesService.getPropertyById(id);
    console.log(`[GET /api/properties/${id}] Propiedad encontrada:`, {
      id: property.id,
      title: property.title,
      cityId: property.cityId,
      cityName: property.city?.name,
      imagesCount: property.images?.length || 0,
    });

    sendSuccess(res, property);
  } catch (error) {
    console.error(`[GET /api/properties/${id}] Error:`, error);
    next(error);
  }
}

/**
 * GET /api/properties/slug/:slug
 * Obtiene una propiedad por slug
 */
export async function getPropertyBySlug(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const property = await propertiesService.getPropertyBySlug(req.params.slug);
    sendSuccess(res, property);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/properties
 * Crea una nueva propiedad
 */
export async function createProperty(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Determinar si el body es JSON o FormData
    const isJSON = req.is('application/json');

    const propertyData: propertiesService.CreatePropertyData = {
      title: req.body.title,
      description: req.body.description,
      operation: req.body.operation as OperationType,
      propertyType: req.body.propertyType as PropertyCategory,
      price: isJSON ? Number(req.body.price) : parseInt(req.body.price),
      currency: req.body.currency || 'EUR',
      cityId: isJSON ? Number(req.body.cityId) : parseInt(req.body.cityId),
      neighborhood: req.body.neighborhood || undefined,
      address: req.body.address,
      latitude: req.body.latitude ? parseFloat(req.body.latitude) : undefined,
      longitude: req.body.longitude ? parseFloat(req.body.longitude) : undefined,
      bedrooms: req.body.bedrooms ? (isJSON ? Number(req.body.bedrooms) : parseInt(req.body.bedrooms)) : undefined,
      bathrooms: req.body.bathrooms ? (isJSON ? Number(req.body.bathrooms) : parseInt(req.body.bathrooms)) : undefined,
      areaM2: req.body.areaM2 ? (isJSON ? Number(req.body.areaM2) : parseInt(req.body.areaM2)) : undefined,
      builtYear: req.body.builtYear ? (isJSON ? Number(req.body.builtYear) : parseInt(req.body.builtYear)) : undefined,
      floor: req.body.floor ? (isJSON ? Number(req.body.floor) : parseInt(req.body.floor)) : undefined,
      hasElevator: isJSON ? req.body.hasElevator === true : req.body.hasElevator === 'true',
      hasParking: isJSON ? req.body.hasParking === true : req.body.hasParking === 'true',
      hasPool: isJSON ? req.body.hasPool === true : req.body.hasPool === 'true',
      hasTerrace: isJSON ? req.body.hasTerrace === true : req.body.hasTerrace === 'true',
      hasGarden: isJSON ? req.body.hasGarden === true : req.body.hasGarden === 'true',
      furnished: isJSON ? req.body.furnished === true : req.body.furnished === 'true',
      petsAllowed: isJSON ? req.body.petsAllowed === true : req.body.petsAllowed === 'true',
      energyRating: req.body.energyRating || undefined,
      status: req.body.status as PropertyStatus || PropertyStatus.ACTIVE,
      isFeatured: isJSON ? req.body.isFeatured === true : req.body.isFeatured === 'true',
    };

    // Procesar imágenes
    let imageData: propertiesService.PropertyImageData[] = [];

    // Obtener el índice de la imagen principal (por defecto es 0)
    const primaryImageIndex = req.body.primaryImageIndex !== undefined
      ? (isJSON ? Number(req.body.primaryImageIndex) : parseInt(req.body.primaryImageIndex))
      : 0;

    // Si se subieron archivos (FormData)
    if (req.files && Array.isArray(req.files)) {
      const uploadedImages = await savePropertyImages(req.files);
      imageData = uploadedImages.map((img, index) => ({
        url: img.url,
        alt: req.body.title || 'Imagen de propiedad',
        order: index,
        isPrimary: index === primaryImageIndex,
      }));
    }
    // Si vienen URLs de imágenes ya subidas (JSON) - campo imageUrls
    else if (isJSON && req.body.imageUrls && Array.isArray(req.body.imageUrls)) {
      imageData = req.body.imageUrls.map((url: string, index: number) => ({
        url,
        alt: req.body.title || 'Imagen de propiedad',
        order: index,
        isPrimary: index === primaryImageIndex,
      }));
    }
    // Compatibilidad con 'images' también
    else if (isJSON && req.body.images && Array.isArray(req.body.images)) {
      imageData = req.body.images.map((url: string, index: number) => ({
        url,
        alt: req.body.title || 'Imagen de propiedad',
        order: index,
        isPrimary: index === primaryImageIndex,
      }));
    }

    const property = await propertiesService.createProperty(propertyData, imageData);
    sendSuccess(res, property, 'Propiedad creada exitosamente', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/properties/:id
 * Actualiza una propiedad
 */
export async function updateProperty(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const id = parseInt(req.params.id);
  try {
    console.log(`[PUT /api/properties/${id}] Actualizando propiedad con ID: ${id}`);

    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: 'ID de propiedad inválido',
      });
      return;
    }

    // Determinar si el body es JSON o FormData
    const isJSON = req.is('application/json');

    const updateData: Partial<propertiesService.CreatePropertyData> = {};

    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.operation !== undefined) updateData.operation = req.body.operation;
    if (req.body.propertyType !== undefined) updateData.propertyType = req.body.propertyType;
    if (req.body.price !== undefined) updateData.price = isJSON ? Number(req.body.price) : parseInt(req.body.price);
    if (req.body.currency !== undefined) updateData.currency = req.body.currency;
    if (req.body.cityId !== undefined) updateData.cityId = isJSON ? Number(req.body.cityId) : parseInt(req.body.cityId);
    if (req.body.neighborhood !== undefined) updateData.neighborhood = req.body.neighborhood;
    if (req.body.address !== undefined) updateData.address = req.body.address;
    if (req.body.latitude !== undefined) updateData.latitude = parseFloat(req.body.latitude);
    if (req.body.longitude !== undefined) updateData.longitude = parseFloat(req.body.longitude);
    if (req.body.bedrooms !== undefined) updateData.bedrooms = isJSON ? Number(req.body.bedrooms) : parseInt(req.body.bedrooms);
    if (req.body.bathrooms !== undefined) updateData.bathrooms = isJSON ? Number(req.body.bathrooms) : parseInt(req.body.bathrooms);
    if (req.body.areaM2 !== undefined) updateData.areaM2 = isJSON ? Number(req.body.areaM2) : parseInt(req.body.areaM2);
    if (req.body.builtYear !== undefined) updateData.builtYear = isJSON ? Number(req.body.builtYear) : parseInt(req.body.builtYear);
    if (req.body.floor !== undefined) updateData.floor = isJSON ? Number(req.body.floor) : parseInt(req.body.floor);
    if (req.body.hasElevator !== undefined) updateData.hasElevator = isJSON ? req.body.hasElevator === true : req.body.hasElevator === 'true';
    if (req.body.hasParking !== undefined) updateData.hasParking = isJSON ? req.body.hasParking === true : req.body.hasParking === 'true';
    if (req.body.hasPool !== undefined) updateData.hasPool = isJSON ? req.body.hasPool === true : req.body.hasPool === 'true';
    if (req.body.hasTerrace !== undefined) updateData.hasTerrace = isJSON ? req.body.hasTerrace === true : req.body.hasTerrace === 'true';
    if (req.body.hasGarden !== undefined) updateData.hasGarden = isJSON ? req.body.hasGarden === true : req.body.hasGarden === 'true';
    if (req.body.furnished !== undefined) updateData.furnished = isJSON ? req.body.furnished === true : req.body.furnished === 'true';
    if (req.body.petsAllowed !== undefined) updateData.petsAllowed = isJSON ? req.body.petsAllowed === true : req.body.petsAllowed === 'true';
    if (req.body.energyRating !== undefined) updateData.energyRating = req.body.energyRating;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.isFeatured !== undefined) updateData.isFeatured = isJSON ? req.body.isFeatured === true : req.body.isFeatured === 'true';

    console.log(`[PUT /api/properties/${id}] Datos a actualizar:`, updateData);

    // Actualizar datos de la propiedad
    let property = await propertiesService.updateProperty(id, updateData);

    // Procesar imágenes si se envían
    let imageUrls: string[] | undefined;
    let primaryImageIndex = 0; // Por defecto, la primera imagen es la principal

    if (isJSON && req.body.imageUrls && Array.isArray(req.body.imageUrls)) {
      imageUrls = req.body.imageUrls;
    } else if (isJSON && req.body.images && Array.isArray(req.body.images)) {
      imageUrls = req.body.images;
    }

    // Obtener el índice de la imagen principal si se envía
    if (req.body.primaryImageIndex !== undefined) {
      primaryImageIndex = isJSON ? Number(req.body.primaryImageIndex) : parseInt(req.body.primaryImageIndex);
    }

    // Si se enviaron imágenes, reemplazar las existentes
    if (imageUrls !== undefined) {
      console.log(`[PUT /api/properties/${id}] Actualizando imágenes:`, imageUrls.length, 'Principal:', primaryImageIndex);
      await propertiesService.replacePropertyImages(id, imageUrls, req.body.title || 'Imagen de propiedad', primaryImageIndex);
      // Volver a obtener la propiedad con las imágenes actualizadas
      property = await propertiesService.getPropertyById(id);
    }

    console.log(`[PUT /api/properties/${id}] Propiedad actualizada exitosamente`);

    sendSuccess(res, property, 'Propiedad actualizada exitosamente');
  } catch (error) {
    console.error(`[PUT /api/properties/${id}] Error:`, error);
    next(error);
  }
}

/**
 * DELETE /api/properties/:id
 * Elimina una propiedad
 */
export async function deleteProperty(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    await propertiesService.deleteProperty(id);
    sendSuccess(res, null, 'Propiedad eliminada exitosamente');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/properties/:id/images
 * Agrega imágenes a una propiedad
 */
export async function addPropertyImages(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseInt(req.params.id);

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No se proporcionaron imágenes',
      });
      return;
    }

    const uploadedImages = await savePropertyImages(req.files);
    const imageData = uploadedImages.map((img, index) => ({
      url: img.url,
      alt: req.body.alt || '',
      order: index,
    }));

    const images = await propertiesService.addPropertyImages(id, imageData);
    sendSuccess(res, images, 'Imágenes agregadas exitosamente', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/properties/images/:imageId
 * Elimina una imagen de una propiedad
 */
export async function deletePropertyImage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const imageId = parseInt(req.params.imageId);
    await propertiesService.deletePropertyImage(imageId);
    sendSuccess(res, null, 'Imagen eliminada exitosamente');
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/properties/:id/images/order
 * Actualiza el orden de las imágenes
 */
export async function updatePropertyImagesOrder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const updates = req.body.updates as { id: number; order: number }[];

    if (!Array.isArray(updates)) {
      res.status(400).json({
        success: false,
        error: 'Se requiere un array de actualizaciones',
      });
      return;
    }

    await propertiesService.updatePropertyImagesOrder(updates);
    sendSuccess(res, null, 'Orden de imágenes actualizado exitosamente');
  } catch (error) {
    next(error);
  }
}
