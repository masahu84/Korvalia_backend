/**
 * Servicio de integración con la API de Emblematic
 *
 * Este servicio maneja toda la comunicación con el CRM externo Emblematic
 * para obtener las propiedades inmobiliarias.
 *
 * Documentación API: https://app.emblematic.es/api/documentation
 */

import {
  EmblematicStatusResponse,
  EmblematicListsResponse,
  EmblematicListsParams,
  EmblematicOffer,
  EmblematicOffersResponse,
  EmblematicFeaturedResponse,
  EmblematicSearchParams,
  EmblematicPropertyNormalized,
} from '../types/emblematic.types';

// Configuración de la API
const EMBLEMATIC_API_URL = process.env.EMBLEMATIC_API_URL || 'https://app.emblematic.es/api/v1';
const EMBLEMATIC_TOKEN = process.env.EMBLEMATIC_TOKEN || '';

/**
 * Headers de autenticación para las peticiones
 */
function getHeaders(): Record<string, string> {
  return {
    'Authorization': `Bearer ${EMBLEMATIC_TOKEN}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

/**
 * Función auxiliar para hacer peticiones a la API
 */
async function fetchEmblematic<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  // Construir URL con parámetros de query
  const url = new URL(`${EMBLEMATIC_API_URL}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // Para arrays como lists[] o features[]
          value.forEach((v) => {
            url.searchParams.append(`${key}[]`, String(v));
          });
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    });
  }

  console.log(`[Emblematic] Fetching: ${url.toString()}`);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Emblematic] Error ${response.status}: ${errorText}`);

    if (response.status === 401) {
      throw new Error('Emblematic: Token de autorización inválido');
    }
    if (response.status === 429) {
      throw new Error('Emblematic: Demasiadas peticiones, intenta más tarde');
    }
    throw new Error(`Emblematic: Error ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Genera un slug URL-friendly a partir de un texto
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9\s-]/g, '') // Eliminar caracteres especiales
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Múltiples guiones a uno
    .trim();
}

/**
 * Genera la URL canónica según el formato requerido:
 * /referencia/subtipo-en-localidad-zona
 */
function generateCanonicalUrl(offer: EmblematicOffer): string {
  const reference = offer.reference;
  const subtype = slugify(offer.subtype_name || 'inmueble');

  // Obtener ciudad y zona de la dirección - puede ser objeto o array
  const address = Array.isArray(offer.address) ? offer.address[0] : (offer as any).address;

  let cityName = 'espana';
  let zoneName = '';

  if (address) {
    // City puede ser objeto directo o array
    if (address.city) {
      if (Array.isArray(address.city)) {
        cityName = address.city[0]?.name || 'espana';
      } else {
        cityName = address.city.name || 'espana';
      }
    }
    // Zone
    if (address.zone) {
      if (Array.isArray(address.zone)) {
        zoneName = address.zone[0]?.name || '';
      } else {
        zoneName = address.zone.name || '';
      }
    }
  }

  const city = slugify(cityName);
  const zone = zoneName ? slugify(zoneName) : '';

  // Construir: subtipo-en-localidad-zona
  let slug = `${subtype}-en-${city}`;
  if (zone) {
    slug += `-${zone}`;
  }

  return `/${reference}/${slug}`;
}

/**
 * Extrae la descripción en español de un objeto de descripción multilenguaje
 */
function extractDescription(description: any): string {
  if (typeof description === 'string') return description;
  if (typeof description === 'object' && description !== null) {
    return description.es || description.en || '';
  }
  return '';
}

/**
 * Extrae un valor numérico seguro, manejando arrays de características de Emblematic
 */
function extractNumericValue(value: any): number | undefined {
  // Si es un número directo, retornarlo
  if (typeof value === 'number') return value;
  // Si es un string que parece número, convertirlo
  if (typeof value === 'string' && !isNaN(Number(value))) return Number(value);
  // Si es un array (como el formato de características de Emblematic), ignorarlo
  if (Array.isArray(value)) return undefined;
  return undefined;
}

/**
 * Extrae un valor de un array de features de Emblematic por nombre
 * Las features vienen como: { name: "Hab.", value: "3" }
 */
function extractFeatureValue(features: any[] | undefined, name: string): number | undefined {
  if (!features || !Array.isArray(features)) return undefined;
  const feature = features.find((f: any) => f.name === name);
  if (feature && feature.value !== undefined) {
    return extractNumericValue(feature.value);
  }
  return undefined;
}

/**
 * Extrae el precio del array de precios de Emblematic
 * Busca el precio de "Venta" o "Alquiler"
 */
function extractPrice(features: any): number {
  if (!features || !features.prices || !Array.isArray(features.prices)) return 0;

  // Buscar precio de Venta primero, luego Alquiler
  const ventaPrice = features.prices.find((p: any) => p.name === 'Venta');
  if (ventaPrice && ventaPrice.value) {
    return extractNumericValue(ventaPrice.value) || 0;
  }

  const alquilerPrice = features.prices.find((p: any) => p.name === 'Alquiler');
  if (alquilerPrice && alquilerPrice.value) {
    return extractNumericValue(alquilerPrice.value) || 0;
  }

  // Si no hay precio específico, usar el primero que tenga valor
  const anyPrice = features.prices.find((p: any) => p.value && p.type === 'price');
  return anyPrice ? (extractNumericValue(anyPrice.value) || 0) : 0;
}

/**
 * Extrae el área del array de áreas de Emblematic
 */
function extractArea(features: any): { area?: number; areaBuilt?: number; areaPlot?: number } {
  if (!features || !features.areas || !Array.isArray(features.areas)) {
    return {};
  }

  const result: { area?: number; areaBuilt?: number; areaPlot?: number } = {};

  for (const areaItem of features.areas) {
    const value = extractNumericValue(areaItem.value);
    if (!value) continue;

    const name = areaItem.name?.toLowerCase() || '';
    if (name.includes('construida')) {
      result.areaBuilt = value;
      result.area = value; // Usar construida como área principal
    } else if (name.includes('útil') || name.includes('util')) {
      if (!result.area) result.area = value;
    } else if (name.includes('parcela') || name.includes('terreno')) {
      result.areaPlot = value;
    }
  }

  return result;
}

/**
 * Extrae URLs de imágenes del formato de Emblematic
 */
function extractImageUrls(images: any): string[] {
  if (!images || !Array.isArray(images)) return [];
  return images.map((img: any) => {
    if (!img) return '';
    if (typeof img === 'string') return img;
    // Preferir thumb_800_600 para mejor rendimiento, o url original
    return img.thumb_800_600 || img.url || img.original || '';
  }).filter(Boolean);
}

/**
 * Extrae URLs de videos del formato de Emblematic
 */
function extractVideoUrls(videos: any): string[] {
  if (!videos) return [];

  if (Array.isArray(videos)) {
    return videos.map((v: any) => {
      if (!v) return '';
      if (typeof v === 'string') return v;
      // Intentar extraer URL de diferentes formatos posibles
      return v.url || v.video_url || v.src || v.link || '';
    }).filter(Boolean);
  }

  // Si es un objeto único (y no null)
  if (videos && typeof videos === 'object') {
    const url = videos.url || videos.video_url || videos.src || videos.link;
    return url ? [url] : [];
  }

  // Si es string directo
  if (typeof videos === 'string') {
    return [videos];
  }

  return [];
}

/**
 * Extrae características booleanas de more_features o qualities
 */
function extractBooleanFeature(features: any, featureName: string): boolean {
  // Buscar en more_features
  if (features?.more_features && Array.isArray(features.more_features)) {
    const found = features.more_features.find((f: any) => f.name === featureName);
    if (found) return found.value === true;
  }
  // Buscar en qualities
  if (features?.qualities && Array.isArray(features.qualities)) {
    const found = features.qualities.find((f: any) => f.name === featureName);
    if (found) return found.value === true;
  }
  return false;
}

/**
 * Normaliza una oferta de Emblematic a nuestro formato interno
 *
 * IMPORTANTE: La estructura de la API de Emblematic es:
 * - address: objeto (NO array) con city, region, country como objetos
 * - features.prices: array de {name, value} para precios
 * - features.areas: array de {name, value} para áreas
 * - features.more_features: array de {name, value} para habitaciones, baños, etc.
 */
function normalizeOffer(offer: EmblematicOffer): EmblematicPropertyNormalized {
  // La dirección puede venir como array o como objeto directo
  const address = Array.isArray(offer.address) ? offer.address[0] : (offer as any).address;
  const features = typeof offer.features === 'object' && !Array.isArray(offer.features) ? offer.features as any : {};

  // Determinar operación
  const operation = offer.mode_name?.toLowerCase().includes('alquiler') ? 'RENT' : 'SALE';

  // Extraer precio del array de precios
  const price = extractPrice(features);

  // Extraer áreas del array de áreas
  const areas = extractArea(features);

  // Extraer habitaciones y baños de more_features
  // Los nombres pueden ser "Hab.", "Baños", "Planta"
  const rooms = extractFeatureValue(features.more_features, 'Hab.') ||
                extractFeatureValue(features.more_features, 'Habitaciones');
  const bathrooms = extractFeatureValue(features.more_features, 'Baños');
  const floor = extractFeatureValue(features.more_features, 'Planta');

  // Extraer ciudad y región - pueden ser objetos directos o arrays
  let cityName = '';
  let zoneName = '';
  let regionName = '';
  let countryName = 'España';

  if (address) {
    // City puede ser objeto directo o array
    if (address.city) {
      if (Array.isArray(address.city)) {
        cityName = address.city[0]?.name || '';
      } else {
        cityName = address.city.name || '';
      }
    }
    // Zone
    if (address.zone) {
      if (Array.isArray(address.zone)) {
        zoneName = address.zone[0]?.name || '';
      } else {
        zoneName = address.zone.name || '';
      }
    }
    // Region
    if (address.region) {
      if (Array.isArray(address.region)) {
        regionName = address.region[0]?.name || '';
      } else {
        regionName = address.region.name || '';
      }
    }
    // Country
    if (address.country) {
      if (Array.isArray(address.country)) {
        countryName = address.country[0]?.name || 'España';
      } else {
        countryName = address.country.name || 'España';
      }
    }
  }

  // Extraer características booleanas de more_features y qualities
  const hasElevator = extractBooleanFeature(features, 'Ascensor');
  const hasGarage = extractBooleanFeature(features, 'Garaje propio') ||
                    extractBooleanFeature(features, 'Garaje comunitario');
  const hasPool = extractBooleanFeature(features, 'Piscina') ||
                  extractBooleanFeature(features, 'Piscina comunitaria');
  const hasTerrace = extractBooleanFeature(features, 'Terraza');
  const hasGarden = extractBooleanFeature(features, 'Jardín');

  return {
    reference: offer.reference,
    title: offer.title,
    description: extractDescription(offer.description),
    slug: generateCanonicalUrl(offer).split('/').pop() || '',
    price,
    currency: 'EUR',
    operation,
    propertyType: offer.type_name,
    propertySubtype: offer.subtype_name,

    // Ubicación
    city: cityName,
    zone: zoneName || undefined,
    region: regionName,
    country: countryName,
    latitude: offer.latitude,
    longitude: offer.longitude,

    // Características
    area: areas.area,
    areaBuilt: areas.areaBuilt,
    areaPlot: areas.areaPlot,
    rooms,
    bathrooms,
    floor,
    hasElevator,
    hasGarage,
    hasPool,
    hasTerrace,
    hasGarden,

    // Certificado energético
    energyRating: offer.energy_rating_consumption_letter,
    energyConsumption: extractNumericValue(offer.energy_rating_consumption),
    energyEmissions: extractNumericValue(offer.energy_rating_emissions),

    // Media - extraer URLs de imágenes correctamente
    images: extractImageUrls(offer.images),
    virtualTour: offer.virtual_tour,
    videosCount: Array.isArray(offer.videos) ? offer.videos.length : (extractNumericValue(offer.videos) || 0),
    videos: extractVideoUrls(offer.videos),

    // Flags
    isVPO: offer.is_vpo === true,

    // URL canónica
    canonicalUrl: generateCanonicalUrl(offer),
  };
}

// ============================================
// FUNCIONES PÚBLICAS DEL SERVICIO
// ============================================

/**
 * Verificar el estado de la API de Emblematic
 */
export async function checkStatus(): Promise<EmblematicStatusResponse> {
  return fetchEmblematic<EmblematicStatusResponse>('/status');
}

/**
 * Obtener listas dinámicas (tipos, subtipos, ciudades, zonas, etc.)
 * Útil para construir los filtros de búsqueda
 */
export async function getLists(params: EmblematicListsParams): Promise<EmblematicListsResponse> {
  return fetchEmblematic<EmblematicListsResponse>('/lists', {
    lists: params.lists,
    country_id: params.country_id,
    region_id: params.region_id,
    city_id: params.city_id,
  });
}

/**
 * Obtener una propiedad por su referencia
 *
 * NOTA: El endpoint /offer/{reference} de Emblematic devuelve datos en formato diferente
 * al del listado. Para mayor consistencia, buscamos en el listado completo.
 */
export async function getOfferByReference(reference: string): Promise<EmblematicOffer | null> {
  try {
    // Primero intentar con el endpoint directo
    const response = await fetchEmblematic<any>(`/offer/${reference}`);
    // La API puede devolver el offer en diferentes campos
    const offer = response.offer || response.featured || response;

    // Verificar si tiene los datos necesarios (title, address, features)
    if (offer && offer.title && (offer.features || offer.address)) {
      return offer;
    }

    // Si el endpoint directo no devuelve datos completos, buscar en el listado
    console.log(`[Emblematic] Datos incompletos del endpoint /offer, buscando en listado...`);
    return await findOfferInListing(reference);
  } catch (error) {
    console.error(`[Emblematic] Error obteniendo oferta ${reference}:`, error);
    // Intentar buscar en el listado como fallback
    return await findOfferInListing(reference);
  }
}

/**
 * Buscar una oferta en el listado de propiedades
 */
async function findOfferInListing(reference: string): Promise<EmblematicOffer | null> {
  try {
    // Obtener todas las ofertas (la API de Emblematic tiene paginación)
    const response = await getOffers({ page: 1 });
    const offer = response.offers.find(o => String(o.reference) === String(reference));

    if (offer) {
      console.log(`[Emblematic] Oferta ${reference} encontrada en listado`);
      return offer;
    }

    // Si hay más páginas, buscar en ellas
    if (response.last_page > 1) {
      for (let page = 2; page <= response.last_page; page++) {
        const pageResponse = await getOffers({ page });
        const foundOffer = pageResponse.offers.find(o => String(o.reference) === String(reference));
        if (foundOffer) {
          console.log(`[Emblematic] Oferta ${reference} encontrada en página ${page}`);
          return foundOffer;
        }
      }
    }

    console.log(`[Emblematic] Oferta ${reference} no encontrada en listado`);
    return null;
  } catch (error) {
    console.error(`[Emblematic] Error buscando oferta ${reference} en listado:`, error);
    return null;
  }
}

/**
 * Obtener una propiedad normalizada por su referencia
 */
export async function getPropertyByReference(reference: string): Promise<EmblematicPropertyNormalized | null> {
  const offer = await getOfferByReference(reference);
  if (!offer) return null;
  return normalizeOffer(offer);
}

/**
 * Obtener listado de propiedades con filtros
 */
export async function getOffers(params: EmblematicSearchParams = {}): Promise<EmblematicOffersResponse> {
  const { page = 1, ...filters } = params;
  return fetchEmblematic<EmblematicOffersResponse>(`/offers/${page}`, filters);
}

/**
 * Obtener listado de propiedades normalizadas
 */
export async function getProperties(params: EmblematicSearchParams = {}): Promise<{
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  properties: EmblematicPropertyNormalized[];
}> {
  const response = await getOffers(params);

  return {
    total: response.total,
    perPage: response.per_page,
    currentPage: response.current_page,
    lastPage: response.last_page,
    properties: response.offers.map(normalizeOffer),
  };
}

/**
 * Obtener propiedades destacadas, últimas y de footer
 */
export async function getFeatured(): Promise<EmblematicFeaturedResponse> {
  const response = await fetchEmblematic<EmblematicFeaturedResponse>('/offers/featured');
  console.log('[Emblematic] Featured response:', JSON.stringify({
    featured: response.featured?.length || 0,
    latest: response.latest?.length || 0,
    footer: response.footer?.length || 0,
  }));
  return response;
}

/**
 * Obtener propiedades destacadas normalizadas
 * Si no hay propiedades destacadas, intenta obtener las primeras propiedades disponibles
 */
export async function getFeaturedProperties(): Promise<{
  featured: EmblematicPropertyNormalized[];
  latest: EmblematicPropertyNormalized[];
  footer: EmblematicPropertyNormalized[];
}> {
  // Primero intentar con el endpoint de featured
  const featuredResponse = await getFeatured();

  let featured = (featuredResponse.featured || []).map(normalizeOffer);
  let latest = (featuredResponse.latest || []).map(normalizeOffer);
  let footer = (featuredResponse.footer || []).map(normalizeOffer);

  // Si no hay propiedades destacadas, intentar obtener las primeras propiedades disponibles
  if (featured.length === 0 && latest.length === 0) {
    console.log('[Emblematic] No featured properties found, trying regular offers endpoint...');
    try {
      const offersResponse = await getOffers({ page: 1 });
      console.log('[Emblematic] Offers response:', JSON.stringify({
        total: offersResponse.total,
        offers: offersResponse.offers?.length || 0,
      }));

      if (offersResponse.offers && offersResponse.offers.length > 0) {
        // Usar las primeras propiedades como "latest"
        latest = offersResponse.offers.map(normalizeOffer);
        console.log(`[Emblematic] Using ${latest.length} properties from regular offers endpoint`);
      }
    } catch (error) {
      console.error('[Emblematic] Error fetching regular offers:', error);
    }
  }

  return { featured, latest, footer };
}

/**
 * Buscar propiedades con filtros comunes
 */
export async function searchProperties(filters: {
  operation?: 'SALE' | 'RENT';
  type?: string;
  city?: string;
  priceMin?: number;
  priceMax?: number;
  rooms?: number;
  bathrooms?: number;
  page?: number;
}): Promise<{
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  properties: EmblematicPropertyNormalized[];
}> {
  // Convertir filtros amigables a parámetros de Emblematic
  const params: EmblematicSearchParams = {
    page: filters.page || 1,
  };

  // TODO: Necesitamos mapear los IDs de mode, type, city
  // Por ahora pasamos los filtros que podemos
  if (filters.priceMin) params.feature_price_from = filters.priceMin;
  if (filters.priceMax) params.feature_price_to = filters.priceMax;
  if (filters.rooms) params.rooms = filters.rooms;
  if (filters.bathrooms) params.bathrooms = filters.bathrooms;

  return getProperties(params);
}

/**
 * Verificar si la integración con Emblematic está configurada
 */
export function isConfigured(): boolean {
  return Boolean(EMBLEMATIC_TOKEN);
}

/**
 * Obtener ciudades únicas de las propiedades disponibles
 * Como la API de Emblematic no proporciona un listado de ciudades directamente,
 * las extraemos de las propiedades existentes.
 */
export async function getAvailableCities(): Promise<{ name: string; count: number }[]> {
  try {
    // Obtener todas las propiedades para extraer ciudades
    const response = await getOffers({ page: 1 });
    const allOffers = [...response.offers];

    // Si hay más páginas, obtenerlas todas
    if (response.last_page > 1) {
      for (let page = 2; page <= response.last_page; page++) {
        const pageResponse = await getOffers({ page });
        allOffers.push(...pageResponse.offers);
      }
    }

    // Normalizar y extraer ciudades únicas con conteo
    const cityMap = new Map<string, number>();

    for (const offer of allOffers) {
      const normalized = normalizeOffer(offer);
      if (normalized.city && normalized.city.trim()) {
        const cityName = normalized.city.trim();
        cityMap.set(cityName, (cityMap.get(cityName) || 0) + 1);
      }
    }

    // Convertir a array y ordenar por nombre
    const cities = Array.from(cityMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));

    console.log(`[Emblematic] Ciudades disponibles: ${cities.map(c => c.name).join(', ')}`);

    return cities;
  } catch (error) {
    console.error('[Emblematic] Error obteniendo ciudades:', error);
    return [];
  }
}

/**
 * Exportar funciones auxiliares para uso externo
 */
export { slugify, generateCanonicalUrl, normalizeOffer };
