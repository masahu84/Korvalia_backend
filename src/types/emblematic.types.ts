/**
 * Tipos para la integración con la API de Emblematic
 * Documentación: https://app.emblematic.es/api/documentation
 */

// ============================================
// TIPOS BASE (usados en múltiples respuestas)
// ============================================

export interface EmblematicRoadType {
  id: number;
  name: string;
  code: string;
}

export interface EmblematicCountry {
  id: number;
  name: string;
  iso: string;
}

export interface EmblematicRegion {
  id: number;
  name: string;
  code: string;
  postal_code: string;
  country_id?: string;
}

export interface EmblematicCity {
  id: number;
  name: string;
  region_id?: string;
  latitude: number;
  longitude: number;
}

export interface EmblematicZone {
  id: number;
  name: string;
  region_id?: string;
  city_id?: string;
}

export interface EmblematicAddress {
  road_type: EmblematicRoadType[];
  country: EmblematicCountry[];
  region: EmblematicRegion[];
  city: EmblematicCity[];
  zone?: EmblematicZone[];
}

// ============================================
// TIPOS PARA LISTAS DINÁMICAS (/api/v1/lists)
// ============================================

export interface EmblematicMode {
  id: number;
  name: string; // Ej: "Venta", "Alquiler"
}

export interface EmblematicType {
  id: number;
  name: string; // Ej: "Residencial", "Comercial"
}

export interface EmblematicSubtype {
  id: number;
  name: string; // Ej: "Piso", "Casa", "Chalet"
  type_id: string;
}

export interface EmblematicFeature {
  id: number;
  name: string;
  section: string;
  type: string;
  options: string;
}

export interface EmblematicListsResponse {
  modes?: EmblematicMode[];
  types?: EmblematicType[];
  subtypes?: EmblematicSubtype[];
  features?: EmblematicFeature[];
  countries?: EmblematicCountry[];
  regions?: EmblematicRegion[];
  cities?: EmblematicCity[];
  zones?: EmblematicZone[];
  roadTypes?: EmblematicRoadType[];
}

// ============================================
// TIPOS PARA OFERTAS/PROPIEDADES
// ============================================

export interface EmblematicOffer {
  reference: string;
  title: string;
  is_vpo: boolean;
  mode_id: number;
  mode_name: string; // "Venta", "Alquiler"
  type_id: number;
  type_name: string; // "Residencial", etc.
  subtype_id: number;
  subtype_name: string; // "Piso", "Casa", etc.
  latitude: number;
  longitude: number;
  images: string[];
  virtual_tour: string;
  videos: number;
  features: number | EmblematicOfferFeatures;
  address: EmblematicAddress[];
  energy_efficiency_certificate: string;
  energy_rating_consumption: number;
  energy_rating_consumption_letter: string;
  energy_rating_emissions: number;
  energy_rating_emissions_letter: string;
  // Campos adicionales que pueden venir en el detalle
  description?: string;
  price?: number;
  area?: number;
  rooms?: number;
  bathrooms?: number;
}

export interface EmblematicOfferFeatures {
  price?: number;
  area?: number;
  area_built?: number;
  area_plot?: number;
  rooms?: number;
  bathrooms?: number;
  floor?: number;
  has_elevator?: boolean;
  has_garage?: boolean;
  has_pool?: boolean;
  has_terrace?: boolean;
  has_garden?: boolean;
  has_storage?: boolean;
  has_air_conditioning?: boolean;
  has_heating?: boolean;
  year_built?: number;
  [key: string]: any; // Para features adicionales
}

// ============================================
// RESPUESTAS DE LA API
// ============================================

export interface EmblematicStatusResponse {
  message: string;
}

export interface EmblematicOfferResponse {
  featured?: EmblematicOffer;
  offer?: EmblematicOffer;
}

export interface EmblematicOffersResponse {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  offers: EmblematicOffer[];
}

export interface EmblematicFeaturedResponse {
  featured: EmblematicOffer[];
  latest: EmblematicOffer[];
  footer: EmblematicOffer[];
}

// ============================================
// PARÁMETROS DE BÚSQUEDA
// ============================================

export interface EmblematicSearchParams {
  page?: number;
  order_key?: 'offer_became_day' | 'reference';
  order_direction?: 'asc' | 'desc';
  reference?: string | string[];
  mode_id?: number;
  type_id?: number;
  subtype_id?: number;
  country_id?: number;
  region_id?: number;
  city_id?: number;
  zone_id?: number;
  feature_area_from?: number;
  feature_area_to?: number;
  feature_area_built_from?: number;
  feature_area_built_to?: number;
  feature_area_plot_to?: number;
  feature_price_from?: number;
  feature_price_to?: number;
  rooms?: number;
  bathrooms?: number;
  features?: number[];
}

export interface EmblematicListsParams {
  lists: (
    | 'modes'
    | 'types'
    | 'subtypes'
    | 'features'
    | 'countries'
    | 'regions'
    | 'cities'
    | 'zones'
    | 'roadTypes'
  )[];
  country_id?: number;
  region_id?: number;
  city_id?: number;
}

// ============================================
// TIPOS PARA USO INTERNO (transformados)
// ============================================

/**
 * Propiedad transformada para uso en el frontend
 * Normaliza los datos de Emblematic a un formato más fácil de usar
 */
export interface EmblematicPropertyNormalized {
  reference: string;
  title: string;
  description?: string;
  slug: string; // Generado: subtipo-en-localidad-zona
  price: number;
  currency: string;
  operation: 'SALE' | 'RENT'; // Normalizado de mode_name
  propertyType: string; // type_name
  propertySubtype: string; // subtype_name

  // Ubicación
  city: string;
  zone?: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;

  // Características
  area?: number;
  areaBuilt?: number;
  areaPlot?: number;
  rooms?: number;
  bathrooms?: number;
  floor?: number;
  hasElevator?: boolean;
  hasGarage?: boolean;
  hasPool?: boolean;
  hasTerrace?: boolean;
  hasGarden?: boolean;

  // Certificado energético
  energyRating?: string;
  energyConsumption?: number;
  energyEmissions?: number;

  // Media
  images: string[];
  virtualTour?: string;
  videosCount: number;

  // Flags
  isVPO: boolean;

  // URL canónica según el formato requerido
  canonicalUrl: string;
}
