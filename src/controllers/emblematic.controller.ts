/**
 * Controlador para la API de Emblematic
 *
 * Expone endpoints internos que el frontend puede consumir
 * para obtener propiedades del CRM externo Emblematic.
 */

import { Request, Response } from 'express';
import * as emblematicService from '../services/emblematic.service';

/**
 * GET /api/emblematic/status
 * Verificar estado de la conexión con Emblematic
 */
export async function getStatus(req: Request, res: Response): Promise<void> {
  try {
    // Primero verificar si está configurado
    if (!emblematicService.isConfigured()) {
      res.status(503).json({
        success: false,
        error: 'Emblematic no está configurado. Falta el token de API.',
      });
      return;
    }

    const status = await emblematicService.checkStatus();
    res.json({
      success: true,
      data: status,
      configured: true,
    });
  } catch (error: any) {
    console.error('[Emblematic Controller] Error en status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al verificar estado de Emblematic',
    });
  }
}

/**
 * GET /api/emblematic/lists
 * Obtener listas dinámicas para filtros
 *
 * Query params:
 * - lists: array de listas a obtener (modes, types, subtypes, features, countries, regions, cities, zones, roadTypes)
 * - country_id: ID del país (para filtrar regiones, ciudades, zonas)
 * - region_id: ID de la región (para filtrar ciudades, zonas)
 * - city_id: ID de la ciudad (para filtrar zonas)
 */
export async function getLists(req: Request, res: Response): Promise<void> {
  try {
    if (!emblematicService.isConfigured()) {
      res.status(503).json({
        success: false,
        error: 'Emblematic no está configurado',
      });
      return;
    }

    // Obtener parámetros
    let lists = req.query.lists;
    if (typeof lists === 'string') {
      lists = [lists];
    }
    if (!lists || !Array.isArray(lists)) {
      lists = ['modes', 'types', 'subtypes'];
    }

    const params = {
      lists: lists as any[],
      country_id: req.query.country_id ? Number(req.query.country_id) : undefined,
      region_id: req.query.region_id ? Number(req.query.region_id) : undefined,
      city_id: req.query.city_id ? Number(req.query.city_id) : undefined,
    };

    const data = await emblematicService.getLists(params);

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('[Emblematic Controller] Error en lists:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener listas',
    });
  }
}

/**
 * GET /api/emblematic/properties
 * Obtener listado de propiedades con filtros
 *
 * Query params:
 * - page: número de página (default 1)
 * - mode_id: ID del modo (venta/alquiler)
 * - type_id: ID del tipo
 * - subtype_id: ID del subtipo
 * - city_id: ID de la ciudad
 * - zone_id: ID de la zona
 * - price_min: precio mínimo
 * - price_max: precio máximo
 * - rooms: número de habitaciones
 * - bathrooms: número de baños
 * - area_min: área mínima
 * - area_max: área máxima
 */
export async function getProperties(req: Request, res: Response): Promise<void> {
  try {
    if (!emblematicService.isConfigured()) {
      res.status(503).json({
        success: false,
        error: 'Emblematic no está configurado',
      });
      return;
    }

    const params: any = {
      page: req.query.page ? Number(req.query.page) : 1,
    };

    // Mapear parámetros de query a parámetros de Emblematic
    if (req.query.mode_id) params.mode_id = Number(req.query.mode_id);
    if (req.query.type_id) params.type_id = Number(req.query.type_id);
    if (req.query.subtype_id) params.subtype_id = Number(req.query.subtype_id);
    if (req.query.country_id) params.country_id = Number(req.query.country_id);
    if (req.query.region_id) params.region_id = Number(req.query.region_id);
    if (req.query.city_id) params.city_id = Number(req.query.city_id);
    if (req.query.zone_id) params.zone_id = Number(req.query.zone_id);
    if (req.query.price_min) params.feature_price_from = Number(req.query.price_min);
    if (req.query.price_max) params.feature_price_to = Number(req.query.price_max);
    if (req.query.rooms) params.rooms = Number(req.query.rooms);
    if (req.query.bathrooms) params.bathrooms = Number(req.query.bathrooms);
    if (req.query.area_min) params.feature_area_from = Number(req.query.area_min);
    if (req.query.area_max) params.feature_area_to = Number(req.query.area_max);
    if (req.query.order_key) params.order_key = req.query.order_key;
    if (req.query.order_direction) params.order_direction = req.query.order_direction;

    // Filtro por nombre de ciudad (filtrado post-fetch)
    const cityFilter = req.query.city ? String(req.query.city) : null;

    console.log('[Emblematic Controller] getProperties params:', params, '| cityFilter:', cityFilter);

    const data = await emblematicService.getProperties(params);

    // Si hay filtro de ciudad por nombre, filtrar las propiedades
    if (cityFilter && data.properties) {
      // Normalizar texto para ignorar acentos
      const normalizeText = (text: string) =>
        text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      const cityNormalized = normalizeText(cityFilter);
      const beforeCount = data.properties.length;
      data.properties = data.properties.filter(
        (p: any) => p.city && normalizeText(p.city) === cityNormalized
      );
      data.total = data.properties.length;
      console.log(`[Emblematic Controller] City filter applied: "${cityFilter}" (normalized: "${cityNormalized}") -> ${beforeCount} -> ${data.total} properties`);
    }

    console.log(`[Emblematic Controller] Returning ${data.properties?.length || 0} properties`);

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('[Emblematic Controller] Error en properties:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener propiedades',
    });
  }
}

/**
 * GET /api/emblematic/properties/featured
 * Obtener propiedades destacadas
 */
export async function getFeaturedProperties(req: Request, res: Response): Promise<void> {
  try {
    if (!emblematicService.isConfigured()) {
      res.status(503).json({
        success: false,
        error: 'Emblematic no está configurado',
      });
      return;
    }

    const data = await emblematicService.getFeaturedProperties();

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('[Emblematic Controller] Error en featured:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener propiedades destacadas',
    });
  }
}

/**
 * GET /api/emblematic/properties/:reference
 * Obtener una propiedad por su referencia
 */
export async function getPropertyByReference(req: Request, res: Response): Promise<void> {
  try {
    if (!emblematicService.isConfigured()) {
      res.status(503).json({
        success: false,
        error: 'Emblematic no está configurado',
      });
      return;
    }

    const { reference } = req.params;

    if (!reference) {
      res.status(400).json({
        success: false,
        error: 'Se requiere la referencia de la propiedad',
      });
      return;
    }

    const property = await emblematicService.getPropertyByReference(reference);

    if (!property) {
      res.status(404).json({
        success: false,
        error: `Propiedad con referencia ${reference} no encontrada`,
      });
      return;
    }

    res.json({
      success: true,
      data: property,
    });
  } catch (error: any) {
    console.error('[Emblematic Controller] Error en property:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener propiedad',
    });
  }
}

/**
 * GET /api/emblematic/config
 * Obtener configuración pública de Emblematic
 * (para que el frontend sepa si está habilitado)
 */
export async function getConfig(req: Request, res: Response) {
  res.json({
    success: true,
    data: {
      enabled: emblematicService.isConfigured(),
      apiUrl: process.env.EMBLEMATIC_API_URL || 'https://app.emblematic.es/api/v1',
    },
  });
}

/**
 * GET /api/emblematic/cities
 * Obtener ciudades disponibles (extraídas de las propiedades)
 */
export async function getAvailableCities(req: Request, res: Response): Promise<void> {
  try {
    if (!emblematicService.isConfigured()) {
      res.status(503).json({
        success: false,
        error: 'Emblematic no está configurado',
      });
      return;
    }

    const cities = await emblematicService.getAvailableCities();

    res.json({
      success: true,
      data: cities,
    });
  } catch (error: any) {
    console.error('[Emblematic Controller] Error en cities:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener ciudades',
    });
  }
}
