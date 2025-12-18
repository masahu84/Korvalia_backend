/**
 * Servicio del Chatbot de Korvalia
 * Chatbot híbrido para inmobiliaria - Detección de intenciones + Búsqueda en Emblematic
 */

import prisma from '../prisma/client';
import { ChatStatus } from '../generated/prisma/client';
import * as emblematicService from './emblematic.service';

// Tipos
interface ChatResponse {
  message: string;
  suggestions?: string[];
  properties?: any[];
  askForContact?: boolean;
}

interface PropertySearchParams {
  operation?: 'RENT' | 'SALE';
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
}

// ============================================
// DICCIONARIO DE INTENCIONES Y PALABRAS CLAVE
// ============================================

const KEYWORDS = {
  // Saludos
  GREETING: [
    'hola', 'buenas', 'buenos días', 'buenos dias', 'buenas tardes',
    'buenas noches', 'hey', 'saludos', 'qué tal', 'que tal'
  ],

  // Despedidas
  GOODBYE: [
    'adiós', 'adios', 'hasta luego', 'chao', 'bye', 'nos vemos',
    'hasta pronto', 'me voy'
  ],

  // Agradecimientos
  THANKS: [
    'gracias', 'muchas gracias', 'te lo agradezco', 'genial', 'perfecto',
    'estupendo', 'excelente'
  ],

  // Afirmaciones
  YES: ['sí', 'si', 'claro', 'por supuesto', 'vale', 'ok', 'de acuerdo', 'adelante'],

  // Negaciones
  NO: ['no', 'no gracias', 'ahora no', 'quizás luego', 'mejor no'],

  // Alquiler
  RENT: [
    'alquiler', 'alquilar', 'arrendar', 'renta', 'rentar', 'alquilo',
    'para alquilar', 'en alquiler'
  ],

  // Compra/Venta
  SALE: [
    'comprar', 'compra', 'venta', 'vender', 'adquirir', 'compro',
    'para comprar', 'en venta'
  ],

  // Tipos de propiedad
  PROPERTY_TYPES: {
    'piso': 'FLAT',
    'pisos': 'FLAT',
    'apartamento': 'APARTMENT',
    'apartamentos': 'APARTMENT',
    'casa': 'HOUSE',
    'casas': 'HOUSE',
    'chalet': 'HOUSE',
    'chalets': 'HOUSE',
    'vivienda': 'FLAT',
    'viviendas': 'FLAT',
    'ático': 'PENTHOUSE',
    'atico': 'PENTHOUSE',
    'áticos': 'PENTHOUSE',
    'aticos': 'PENTHOUSE',
    'dúplex': 'DUPLEX',
    'duplex': 'DUPLEX',
    'terreno': 'LAND',
    'terrenos': 'LAND',
    'parcela': 'LAND',
    'parcelas': 'LAND',
    'local': 'COMMERCIAL',
    'locales': 'COMMERCIAL',
    'nave': 'COMMERCIAL',
    'garaje': 'GARAGE',
    'garajes': 'GARAGE',
    'parking': 'GARAGE',
    'plaza de garaje': 'GARAGE',
  },

  // Características
  FEATURES: {
    'piscina': 'hasPool',
    'terraza': 'hasTerrace',
    'jardín': 'hasGarden',
    'jardin': 'hasGarden',
    'ascensor': 'hasElevator',
    'parking': 'hasParking',
    'garaje': 'hasParking',
    'amueblado': 'furnished',
    'mascotas': 'petsAllowed',
  },

  // Contacto
  CONTACT: [
    'contacto', 'contactar', 'llamar', 'teléfono', 'telefono', 'email',
    'correo', 'whatsapp', 'hablar con', 'agente', 'asesor', 'comercial'
  ],

  // Visita
  VISIT: [
    'visita', 'visitar', 'ver el piso', 'ver la casa', 'ver la vivienda',
    'conocer', 'enseñar', 'mostrar', 'cita', 'quedar'
  ],

  // Horario
  SCHEDULE: [
    'horario', 'hora', 'abren', 'abierto', 'cerrado', 'cuando', 'cuándo',
    'atienden', 'disponibilidad'
  ],

  // Precio
  PRICE: [
    'precio', 'precios', 'costar', 'cuesta', 'cuestan', 'vale', 'valen',
    'presupuesto', 'económico', 'barato', 'caro'
  ],

  // Ubicación
  LOCATION: [
    'ubicación', 'ubicacion', 'zona', 'barrio', 'donde', 'dónde',
    'localización', 'localizacion', 'dirección', 'direccion', 'calle'
  ],

  // Interés
  INTEREST: [
    'interesa', 'interesado', 'interesada', 'me gusta', 'quiero',
    'quisiera', 'gustaría', 'gustaria', 'necesito', 'busco'
  ],

  // Información
  INFO: [
    'información', 'informacion', 'info', 'detalles', 'más datos',
    'saber más', 'conocer más', 'características', 'caracteristicas'
  ],

  // Servicios
  SERVICES: [
    'servicios', 'qué hacéis', 'que haceis', 'a qué os dedicáis',
    'qué ofrecéis', 'ayuda', 'ayudar'
  ],
};

// ============================================
// FUNCIONES DE DETECCIÓN
// ============================================

/**
 * Normalizar texto para comparación
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Quitar acentos
}

/**
 * Detectar si el mensaje contiene alguna palabra clave
 */
function containsKeyword(message: string, keywords: string[]): boolean {
  const normalized = normalizeText(message);
  return keywords.some(keyword => normalized.includes(normalizeText(keyword)));
}

/**
 * Detectar tipo de propiedad mencionado
 */
function detectPropertyType(message: string): string | null {
  const normalized = normalizeText(message);
  for (const [keyword, type] of Object.entries(KEYWORDS.PROPERTY_TYPES)) {
    if (normalized.includes(normalizeText(keyword))) {
      return type;
    }
  }
  return null;
}

/**
 * Extraer número de habitaciones del mensaje
 */
function extractBedrooms(message: string): number | null {
  const patterns = [
    /(\d+)\s*(?:habitacion|habitaciones|dormitorio|dormitorios|cuarto|cuartos)/i,
    /(?:de\s+)?(\d+)\s*(?:hab|dorm)/i,
    /(\d+)\s*(?:h|d)(?:\s|$|,|\.)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      const num = parseInt(match[1]);
      if (num >= 1 && num <= 10) return num;
    }
  }
  return null;
}

/**
 * Extraer rango de precio del mensaje
 */
function extractPriceRange(message: string): { min?: number; max?: number } {
  const result: { min?: number; max?: number } = {};
  const normalized = message.toLowerCase();

  // Patrones de precio
  const pricePatterns = [
    /(\d+(?:[.,]\d{3})*)\s*(?:€|euros?|eur)/gi,
    /(?:€|euros?)\s*(\d+(?:[.,]\d{3})*)/gi,
    /(\d{3,})\s*(?:€|euros?|eur|al mes|mensuales?)?/gi,
  ];

  const prices: number[] = [];
  for (const pattern of pricePatterns) {
    let match;
    while ((match = pattern.exec(message)) !== null) {
      const priceStr = match[1].replace(/\./g, '').replace(',', '.');
      const price = parseFloat(priceStr);
      if (price > 0 && price < 10000000) {
        prices.push(price);
      }
    }
  }

  if (prices.length > 0) {
    // Detectar si es máximo o mínimo
    if (normalized.includes('hasta') || normalized.includes('máximo') ||
        normalized.includes('maximo') || normalized.includes('menos de') ||
        normalized.includes('no más de') || normalized.includes('como mucho')) {
      result.max = Math.max(...prices);
    } else if (normalized.includes('desde') || normalized.includes('mínimo') ||
               normalized.includes('minimo') || normalized.includes('más de') ||
               normalized.includes('al menos') || normalized.includes('como poco')) {
      result.min = Math.min(...prices);
    } else if (prices.length === 1) {
      // Si solo hay un precio, asumir rango aproximado
      result.min = prices[0] * 0.8;
      result.max = prices[0] * 1.2;
    } else {
      // Si hay varios precios, usar como rango
      result.min = Math.min(...prices);
      result.max = Math.max(...prices);
    }
  }

  return result;
}

/**
 * Detectar si el mensaje contiene datos de contacto
 */
function extractContactInfo(message: string): { email?: string; phone?: string; name?: string } {
  const result: { email?: string; phone?: string; name?: string } = {};

  // Email
  const emailMatch = message.match(/[\w.-]+@[\w.-]+\.\w{2,}/);
  if (emailMatch) {
    result.email = emailMatch[0];
  }

  // Teléfono (español)
  const phoneMatch = message.match(/(?:\+34\s?)?[6789]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}/);
  if (phoneMatch) {
    result.phone = phoneMatch[0].replace(/[\s.-]/g, '');
  }

  // Nombre (si dice "me llamo X" o "soy X")
  const nameMatch = message.match(/(?:me llamo|soy|mi nombre es)\s+([A-Za-záéíóúñÁÉÍÓÚÑ]+(?:\s+[A-Za-záéíóúñÁÉÍÓÚÑ]+)?)/i);
  if (nameMatch) {
    result.name = nameMatch[1].trim();
  }

  return result;
}

// ============================================
// BÚSQUEDA DE PROPIEDADES (usando Emblematic)
// ============================================

/**
 * Mapear tipo de propiedad interno a subtipo de Emblematic
 */
function mapPropertyTypeToEmblematic(type: string | undefined): number | undefined {
  if (!type) return undefined;
  const mapping: Record<string, number> = {
    'FLAT': 46458,        // Piso
    'APARTMENT': 46449,   // Apartamento
    'HOUSE': 46452,       // Casa
    'PENTHOUSE': 46450,   // Ático
    'DUPLEX': 46455,      // Dúplex
    'LAND': 46498,        // Solar
    'COMMERCIAL': 46484,  // Local comercial
    'GARAGE': 46468,      // Garaje
  };
  return mapping[type];
}

/**
 * Mapear operación a mode_id de Emblematic
 */
function mapOperationToEmblematic(operation: string | undefined): number | undefined {
  if (!operation) return undefined;
  const mapping: Record<string, number> = {
    'RENT': 2,   // Alquiler
    'SALE': 1,   // Venta
  };
  return mapping[operation];
}

/**
 * Buscar propiedades en Emblematic según parámetros
 */
async function searchProperties(params: PropertySearchParams, limit: number = 3): Promise<any[]> {
  try {
    const emblematicParams: any = { page: 1 };

    // Mapear operación (Venta/Alquiler)
    const modeId = mapOperationToEmblematic(params.operation);
    if (modeId) emblematicParams.mode_id = modeId;

    // Mapear tipo de propiedad a subtipo
    const subtypeId = mapPropertyTypeToEmblematic(params.propertyType);
    if (subtypeId) emblematicParams.subtype_id = subtypeId;

    // Filtros de precio
    if (params.minPrice) emblematicParams.feature_price_from = params.minPrice;
    if (params.maxPrice) emblematicParams.feature_price_to = params.maxPrice;

    // Habitaciones
    if (params.bedrooms) emblematicParams.rooms = params.bedrooms;

    const data = await emblematicService.getProperties(emblematicParams);

    // Limitar resultados
    const properties = (data.properties || []).slice(0, limit);

    // Formatear para el chatbot
    return properties.map(p => ({
      id: p.reference,
      reference: p.reference,
      title: p.title,
      slug: p.slug,
      price: p.price,
      operation: p.operation,
      propertyType: p.propertySubtype || p.propertyType,
      bedrooms: p.rooms,
      bathrooms: p.bathrooms,
      areaM2: p.area || p.areaBuilt,
      city: p.city,
      image: p.images?.[0] || null,
      canonicalUrl: p.canonicalUrl,
    }));
  } catch (error) {
    console.error('[Chatbot] Error buscando propiedades en Emblematic:', error);
    return [];
  }
}

/**
 * Obtener propiedades destacadas de Emblematic
 */
async function getFeaturedProperties(limit: number = 3): Promise<any[]> {
  try {
    const data = await emblematicService.getFeaturedProperties();

    // Combinar featured y latest, priorizando featured
    let properties = [...(data.featured || []), ...(data.latest || [])];

    // Eliminar duplicados por referencia
    const seen = new Set();
    properties = properties.filter(p => {
      if (seen.has(p.reference)) return false;
      seen.add(p.reference);
      return true;
    });

    // Limitar resultados
    properties = properties.slice(0, limit);

    // Formatear para el chatbot
    return properties.map(p => ({
      id: p.reference,
      reference: p.reference,
      title: p.title,
      slug: p.slug,
      price: p.price,
      operation: p.operation,
      propertyType: p.propertySubtype || p.propertyType,
      bedrooms: p.rooms,
      bathrooms: p.bathrooms,
      areaM2: p.area || p.areaBuilt,
      city: p.city,
      image: p.images?.[0] || null,
      canonicalUrl: p.canonicalUrl,
    }));
  } catch (error) {
    console.error('[Chatbot] Error obteniendo propiedades destacadas de Emblematic:', error);
    return [];
  }
}

/**
 * Formatear propiedades para el mensaje
 */
function formatPropertiesMessage(properties: any[], intro?: string): string {
  if (properties.length === 0) {
    return 'Actualmente no tenemos propiedades que coincidan exactamente con esos criterios, pero nuestro catálogo se actualiza constantemente. ¿Te gustaría que te avisemos cuando tengamos algo disponible?';
  }

  const opLabels: Record<string, string> = { RENT: 'Alquiler', SALE: 'Venta' };

  let msg = intro || `Te muestro ${properties.length} propiedad${properties.length > 1 ? 'es' : ''} que podrían interesarte:`;
  msg += '\n\n';

  properties.forEach(p => {
    const priceText = p.operation === 'RENT'
      ? `${p.price.toLocaleString('es-ES')} €/mes`
      : `${p.price.toLocaleString('es-ES')} €`;

    msg += `🏠 ${p.title}\n`;
    msg += `📍 ${p.city} • ${opLabels[p.operation]}\n`;
    msg += `💰 ${priceText}`;
    if (p.bedrooms) msg += ` • ${p.bedrooms} hab.`;
    if (p.areaM2) msg += ` • ${p.areaM2}m²`;
    msg += '\n\n';
  });

  return msg.trim();
}

// ============================================
// PROCESAMIENTO PRINCIPAL
// ============================================

/**
 * Procesar mensaje y generar respuesta
 */
export async function processMessage(
  sessionId: string,
  userMessage: string,
  propertyContext?: number
): Promise<ChatResponse> {
  const message = userMessage.trim();
  const lowerMessage = message.toLowerCase();

  // Obtener o crear conversación
  let conversation = await prisma.chatConversation.findUnique({
    where: { sessionId },
    include: { messages: { orderBy: { createdAt: 'desc' }, take: 3 } },
  });

  if (!conversation) {
    conversation = await prisma.chatConversation.create({
      data: {
        sessionId,
        propertyId: propertyContext,
        source: propertyContext ? 'property_page' : 'widget',
      },
      include: { messages: true },
    });
  }

  // Guardar mensaje del usuario
  await prisma.chatMessage.create({
    data: {
      conversationId: conversation.id,
      role: 'USER',
      content: message,
    },
  });

  let response: ChatResponse;

  // ============================================
  // LÓGICA DE RESPUESTAS (orden importante)
  // ============================================

  // --- SUGERENCIAS EXACTAS (alta prioridad) ---

  // "Pisos en alquiler" / "Pisos en venta"
  if (lowerMessage === 'pisos en alquiler' || lowerMessage === 'ver pisos en alquiler') {
    const properties = await searchProperties({ operation: 'RENT', propertyType: 'FLAT' }, 4);
    response = {
      message: formatPropertiesMessage(properties, '🔑 Pisos en alquiler:'),
      properties,
      suggestions: ['Ver más pisos', 'Me interesa uno', 'Ver casas', 'Contactar']
    };
  }
  else if (lowerMessage === 'pisos en venta' || lowerMessage === 'ver pisos en venta') {
    const properties = await searchProperties({ operation: 'SALE', propertyType: 'FLAT' }, 4);
    response = {
      message: formatPropertiesMessage(properties, '🏷️ Pisos en venta:'),
      properties,
      suggestions: ['Ver más pisos', 'Me interesa uno', 'Ver casas', 'Contactar']
    };
  }

  // "Casas en alquiler" / "Casas en venta"
  else if (lowerMessage === 'casas en alquiler' || lowerMessage === 'ver casas en alquiler') {
    const properties = await searchProperties({ operation: 'RENT', propertyType: 'HOUSE' }, 4);
    response = {
      message: formatPropertiesMessage(properties, '🔑 Casas en alquiler:'),
      properties,
      suggestions: ['Ver más casas', 'Me interesa una', 'Ver pisos', 'Contactar']
    };
  }
  else if (lowerMessage === 'casas en venta' || lowerMessage === 'ver casas en venta') {
    const properties = await searchProperties({ operation: 'SALE', propertyType: 'HOUSE' }, 4);
    response = {
      message: formatPropertiesMessage(properties, '🏷️ Casas en venta:'),
      properties,
      suggestions: ['Ver más casas', 'Me interesa una', 'Ver pisos', 'Contactar']
    };
  }

  // "Ver pisos" / "Ver casas"
  else if (lowerMessage === 'ver pisos' || lowerMessage === 'pisos') {
    const properties = await searchProperties({ propertyType: 'FLAT' }, 4);
    response = {
      message: formatPropertiesMessage(properties, '🏠 Pisos disponibles:'),
      properties,
      suggestions: ['Solo alquiler', 'Solo venta', 'Me interesa uno', 'Contactar']
    };
  }
  else if (lowerMessage === 'ver casas' || lowerMessage === 'casas') {
    const properties = await searchProperties({ propertyType: 'HOUSE' }, 4);
    response = {
      message: formatPropertiesMessage(properties, '🏡 Casas disponibles:'),
      properties,
      suggestions: ['Solo alquiler', 'Solo venta', 'Me interesa una', 'Contactar']
    };
  }

  // "Ver destacados" / "Ver propiedades destacadas"
  else if (lowerMessage === 'ver destacados' || lowerMessage === 'ver propiedades destacadas' ||
           lowerMessage === 'destacados' || lowerMessage === 'propiedades destacadas') {
    const properties = await getFeaturedProperties(4);
    response = {
      message: properties.length > 0
        ? formatPropertiesMessage(properties, '⭐ Propiedades destacadas:')
        : 'Actualmente no hay propiedades destacadas. Te muestro las más recientes.',
      properties: properties.length > 0 ? properties : await searchProperties({}, 4),
      suggestions: ['Me interesa una', 'Ver pisos', 'Ver casas', 'Contactar']
    };
  }

  // "Hablar con un agente" / "Contactar" / "Contactar con agente"
  else if (lowerMessage === 'hablar con un agente' || lowerMessage === 'contactar' ||
           lowerMessage === 'contactar con agente' || lowerMessage === 'contactar con un agente') {
    const settings = await prisma.companySettings.findFirst();
    let contactMsg = 'Estaremos encantados de atenderte personalmente.\n\n';
    if (settings?.phone) contactMsg += `📞 Teléfono: ${settings.phone}\n`;
    if (settings?.email) contactMsg += `📧 Email: ${settings.email}\n`;
    if (settings?.address) contactMsg += `📍 Oficina: ${settings.address}\n`;
    contactMsg += '\n¿Quieres que te llamemos? Déjame tu teléfono o email.';

    response = {
      message: contactMsg,
      suggestions: ['Dejar mis datos', 'Ver propiedades', 'Ver horarios'],
      askForContact: true
    };
  }

  // "Ver más opciones" / "Ver más propiedades" / "Ver más"
  else if (lowerMessage === 'ver más opciones' || lowerMessage === 'ver mas opciones' ||
           lowerMessage === 'ver más propiedades' || lowerMessage === 'ver mas propiedades' ||
           lowerMessage === 'ver más' || lowerMessage === 'ver mas' || lowerMessage === 'más opciones') {
    const properties = await searchProperties({}, 6);
    response = {
      message: formatPropertiesMessage(properties, 'Más propiedades disponibles:'),
      properties,
      suggestions: ['Solo alquiler', 'Solo venta', 'Me interesa una', 'Contactar']
    };
  }

  // "Solo alquiler" / "Solo venta"
  else if (lowerMessage === 'solo alquiler' || lowerMessage === 'ver todo en alquiler' || lowerMessage === 'todo en alquiler') {
    const properties = await searchProperties({ operation: 'RENT' }, 4);
    response = {
      message: formatPropertiesMessage(properties, '🔑 Propiedades en alquiler:'),
      properties,
      suggestions: ['Ver pisos', 'Ver casas', 'Me interesa una', 'Contactar']
    };
  }
  else if (lowerMessage === 'solo venta' || lowerMessage === 'ver todo en venta' || lowerMessage === 'todo en venta') {
    const properties = await searchProperties({ operation: 'SALE' }, 4);
    response = {
      message: formatPropertiesMessage(properties, '🏷️ Propiedades en venta:'),
      properties,
      suggestions: ['Ver pisos', 'Ver casas', 'Me interesa una', 'Contactar']
    };
  }

  // "Me interesa una" / "Me interesa uno"
  else if (lowerMessage === 'me interesa una' || lowerMessage === 'me interesa uno' ||
           lowerMessage === 'me interesa' || lowerMessage === 'me gusta') {
    response = {
      message: '¡Estupendo! 🎉\n\nPara enviarte información detallada y coordinar una visita, necesito tus datos de contacto.\n\n¿Puedes indicarme tu teléfono o email?',
      askForContact: true,
      suggestions: ['Prefiero llamar yo', 'Ver más propiedades']
    };
  }

  // "Dejar mis datos"
  else if (lowerMessage === 'dejar mis datos' || lowerMessage === 'dejar datos' || lowerMessage === 'mis datos') {
    response = {
      message: 'Perfecto, indícame tu teléfono o email y un agente se pondrá en contacto contigo lo antes posible.',
      askForContact: true,
      suggestions: ['Prefiero llamar yo', 'Ver propiedades primero']
    };
  }

  // "Prefiero llamar yo"
  else if (lowerMessage === 'prefiero llamar yo' || lowerMessage === 'llamar yo' || lowerMessage === 'llamo yo') {
    const settings = await prisma.companySettings.findFirst();
    response = {
      message: `¡Por supuesto! Puedes llamarnos al ${settings?.phone || 'nuestro teléfono de contacto'}.\n\nEstaremos encantados de atenderte.`,
      suggestions: ['Ver propiedades', 'Ver horarios', 'Gracias']
    };
  }

  // "Ver propiedades" / "Ver propiedades primero" / "Buscar propiedades"
  else if (lowerMessage === 'ver propiedades' || lowerMessage === 'ver propiedades primero' ||
           lowerMessage === 'buscar propiedades' || lowerMessage === 'buscar más propiedades') {
    const properties = await searchProperties({}, 4);
    response = {
      message: formatPropertiesMessage(properties, '🏠 Propiedades disponibles:'),
      properties,
      suggestions: ['Pisos en alquiler', 'Casas en venta', 'Me interesa una', 'Contactar']
    };
  }

  // "Ver horarios" / "Información de horarios"
  else if (lowerMessage === 'ver horarios' || lowerMessage === 'horarios' ||
           lowerMessage === 'información de horarios' || lowerMessage === 'informacion de horarios') {
    const settings = await prisma.companySettings.findFirst();
    const schedule = settings?.schedule || 'Lunes a Viernes: 9:00 - 14:00 y 17:00 - 20:00\nSábados: 10:00 - 14:00';
    response = {
      message: `📅 Nuestro horario de atención:\n\n${schedule}`,
      suggestions: ['Ver propiedades', 'Contactar', 'Gracias']
    };
  }

  // "Programar una visita" / "Sí, programar cita"
  else if (lowerMessage === 'programar una visita' || lowerMessage === 'programar visita' ||
           lowerMessage === 'sí, programar cita' || lowerMessage === 'si, programar cita') {
    response = {
      message: 'Para programar una visita, necesito tus datos de contacto. Un agente te llamará para acordar el día y hora que mejor te venga.\n\n¿Cuál es tu teléfono o email?',
      askForContact: true,
      suggestions: ['Prefiero llamar yo', 'Ver propiedades primero']
    };
  }

  // "Eso es todo" / "Eso es todo, gracias"
  else if (lowerMessage === 'eso es todo' || lowerMessage === 'eso es todo, gracias' ||
           lowerMessage === 'eso es todo gracias' || lowerMessage === 'nada más') {
    response = {
      message: '¡Perfecto! Ha sido un placer ayudarte. Si necesitas algo más, aquí estaré. ¡Que tengas un excelente día! 👋',
      suggestions: ['Ver propiedades', 'Contactar']
    };
  }

  // "Gracias" / "Muchas gracias"
  else if (lowerMessage === 'gracias' || lowerMessage === 'muchas gracias' || lowerMessage === 'ok gracias') {
    response = {
      message: '¡De nada! 😊 ¿Hay algo más en lo que pueda ayudarte?',
      suggestions: ['Ver propiedades', 'Contactar', 'Eso es todo']
    };
  }

  // "No, gracias" / "No gracias"
  else if (lowerMessage === 'no, gracias' || lowerMessage === 'no gracias' || lowerMessage === 'ahora no') {
    response = {
      message: 'De acuerdo. Si cambias de opinión, aquí estaré para ayudarte. 😊',
      suggestions: ['Ver propiedades', 'Ver destacados', 'Contactar']
    };
  }

  // "Cambiar filtros" / "Cualquier tipo"
  else if (lowerMessage === 'cambiar filtros' || lowerMessage === 'otros filtros') {
    response = {
      message: '¿Qué tipo de propiedad te interesa?',
      suggestions: ['Pisos en alquiler', 'Casas en venta', 'Ver todo', 'Contactar']
    };
  }
  else if (lowerMessage === 'cualquier tipo' || lowerMessage === 'ver todo' || lowerMessage === 'ver todas las opciones') {
    const properties = await searchProperties({}, 6);
    response = {
      message: formatPropertiesMessage(properties, 'Todas las propiedades disponibles:'),
      properties,
      suggestions: ['Solo alquiler', 'Solo venta', 'Me interesa una', 'Contactar']
    };
  }

  // "Busco para comprar" / "Busco para alquilar"
  else if (lowerMessage === 'busco para comprar' || lowerMessage === 'quiero comprar' || lowerMessage === 'quiero comprar una casa') {
    const properties = await searchProperties({ operation: 'SALE' }, 4);
    response = {
      message: formatPropertiesMessage(properties, '🏷️ Propiedades en venta:'),
      properties,
      suggestions: ['Ver pisos', 'Ver casas', 'Me interesa una', 'Contactar']
    };
  }
  else if (lowerMessage === 'busco para alquilar' || lowerMessage === 'busco piso en alquiler') {
    const properties = await searchProperties({ operation: 'RENT' }, 4);
    response = {
      message: formatPropertiesMessage(properties, '🔑 Propiedades en alquiler:'),
      properties,
      suggestions: ['Ver pisos', 'Ver casas', 'Me interesa una', 'Contactar']
    };
  }

  // --- DETECCIÓN POR PALABRAS CLAVE ---

  // 1. SALUDO
  else if (containsKeyword(message, KEYWORDS.GREETING) && message.length < 30) {
    response = {
      message: '¡Hola! 👋 Bienvenido a Korvalia. Soy tu asistente virtual y estoy aquí para ayudarte a encontrar la propiedad ideal.\n\n¿Qué estás buscando?',
      suggestions: [
        'Pisos en alquiler',
        'Casas en venta',
        'Ver destacados',
        'Hablar con un agente'
      ]
    };
  }

  // 2. DESPEDIDA
  else if (containsKeyword(message, KEYWORDS.GOODBYE)) {
    response = {
      message: '¡Hasta pronto! 👋 Ha sido un placer atenderte. Si tienes más preguntas, aquí estaré. ¡Que tengas un excelente día!'
    };
  }

  // 3. AGRADECIMIENTO
  else if (containsKeyword(message, KEYWORDS.THANKS) && message.length < 50) {
    response = {
      message: '¡De nada! 😊 ¿Hay algo más en lo que pueda ayudarte?',
      suggestions: ['Ver propiedades', 'Contactar', 'Eso es todo']
    };
  }

  // 4. HORARIO
  else if (containsKeyword(message, KEYWORDS.SCHEDULE)) {
    const settings = await prisma.companySettings.findFirst();
    const schedule = settings?.schedule || 'Lunes a Viernes: 9:00 - 14:00 y 17:00 - 20:00\nSábados: 10:00 - 14:00';
    response = {
      message: `📅 Nuestro horario de atención:\n\n${schedule}\n\n¿Te gustaría programar una cita?`,
      suggestions: ['Programar visita', 'Ver propiedades', 'No, gracias']
    };
  }

  // 5. CONTACTO / HABLAR CON AGENTE
  else if (containsKeyword(message, KEYWORDS.CONTACT) || containsKeyword(message, KEYWORDS.VISIT)) {
    const settings = await prisma.companySettings.findFirst();
    let contactMsg = 'Estaremos encantados de atenderte.\n\n';
    if (settings?.phone) contactMsg += `📞 Teléfono: ${settings.phone}\n`;
    if (settings?.email) contactMsg += `📧 Email: ${settings.email}\n`;
    if (settings?.address) contactMsg += `📍 Oficina: ${settings.address}\n`;
    contactMsg += '\n¿Quieres que te llamemos?';

    response = {
      message: contactMsg,
      suggestions: ['Dejar mis datos', 'Ver propiedades', 'Ver horarios'],
      askForContact: true
    };
  }

  // 6. SERVICIOS / AYUDA
  else if (containsKeyword(message, KEYWORDS.SERVICES)) {
    response = {
      message: 'En Korvalia te ayudamos con:\n\n🏠 Compra y venta de viviendas\n🔑 Alquiler de pisos y casas\n📋 Valoración de inmuebles\n🤝 Asesoramiento personalizado\n\n¿En qué puedo ayudarte?',
      suggestions: ['Busco para comprar', 'Busco para alquilar', 'Contactar']
    };
  }

  // 7. VER PROPIEDADES DESTACADAS
  else if (lowerMessage.includes('destacad') || lowerMessage.includes('recomend')) {
    const properties = await getFeaturedProperties(4);
    response = {
      message: properties.length > 0
        ? formatPropertiesMessage(properties, '⭐ Propiedades destacadas:')
        : 'Te muestro nuestras propiedades más recientes.',
      properties: properties.length > 0 ? properties : await searchProperties({}, 4),
      suggestions: ['Me interesa una', 'Ver pisos', 'Ver casas', 'Contactar']
    };
  }

  // 8. BÚSQUEDA DE PROPIEDADES POR PALABRAS CLAVE
  else if (containsKeyword(message, KEYWORDS.RENT) || containsKeyword(message, KEYWORDS.SALE) ||
           containsKeyword(message, KEYWORDS.INTEREST) || detectPropertyType(message)) {

    const params: PropertySearchParams = {};

    if (containsKeyword(message, KEYWORDS.RENT)) {
      params.operation = 'RENT';
    } else if (containsKeyword(message, KEYWORDS.SALE)) {
      params.operation = 'SALE';
    }

    const propType = detectPropertyType(message);
    if (propType) params.propertyType = propType;

    const bedrooms = extractBedrooms(message);
    if (bedrooms) params.bedrooms = bedrooms;

    const priceRange = extractPriceRange(message);
    if (priceRange.min) params.minPrice = priceRange.min;
    if (priceRange.max) params.maxPrice = priceRange.max;

    const properties = await searchProperties(params, 4);

    let introMsg = '🏠 Propiedades';
    if (params.operation === 'RENT') introMsg = '🔑 En alquiler';
    else if (params.operation === 'SALE') introMsg = '🏷️ En venta';
    if (params.bedrooms) introMsg += ` (${params.bedrooms}+ hab.)`;
    introMsg += ':';

    response = {
      message: properties.length > 0
        ? formatPropertiesMessage(properties, introMsg)
        : 'No encontré propiedades con esos criterios exactos. ¿Ampliamos la búsqueda?',
      properties,
      suggestions: properties.length > 0
        ? ['Ver más opciones', 'Me interesa una', 'Contactar']
        : ['Ver todo', 'Cambiar filtros', 'Contactar']
    };
  }

  // 9. PREGUNTAS SOBRE PRECIOS
  else if (containsKeyword(message, KEYWORDS.PRICE)) {
    response = {
      message: 'Los precios varían según el tipo y ubicación. ¿Qué buscas y cuál es tu presupuesto?',
      suggestions: ['Pisos en alquiler', 'Casas en venta', 'Ver todo']
    };
  }

  // 10. PREGUNTAS SOBRE UBICACIÓN
  else if (containsKeyword(message, KEYWORDS.LOCATION)) {
    response = {
      message: 'Trabajamos en Sanlúcar de Barrameda y alrededores. ¿Qué tipo de propiedad buscas?',
      suggestions: ['Ver pisos', 'Ver casas', 'Contactar']
    };
  }

  // 11. DATOS DE CONTACTO DETECTADOS
  else {
    const contactInfo = extractContactInfo(message);

    if (contactInfo.email || contactInfo.phone) {
      await prisma.chatConversation.update({
        where: { id: conversation.id },
        data: {
          visitorName: contactInfo.name || conversation.visitorName,
          visitorEmail: contactInfo.email || conversation.visitorEmail,
          visitorPhone: contactInfo.phone || conversation.visitorPhone,
          status: 'LEAD_CAPTURED',
        },
      });

      response = {
        message: `¡Perfecto${contactInfo.name ? ', ' + contactInfo.name : ''}! ✅\n\nHe registrado tus datos. Un agente te contactará pronto.\n\n¿Algo más?`,
        suggestions: ['Ver propiedades', 'Ver horarios', 'Eso es todo']
      };
    }

    // 12. RESPUESTAS SIMPLES
    else if (containsKeyword(message, KEYWORDS.YES) && message.length < 20) {
      response = {
        message: '¡Perfecto! ¿En qué puedo ayudarte?',
        suggestions: ['Ver propiedades', 'Contactar', 'Ver destacados']
      };
    }
    else if (containsKeyword(message, KEYWORDS.NO) && message.length < 25) {
      response = {
        message: 'De acuerdo. Si necesitas algo, aquí estaré. 😊',
        suggestions: ['Ver propiedades', 'Ver destacados', 'Contactar']
      };
    }

    // 13. FALLBACK
    else {
      response = {
        message: 'Disculpa, no he entendido bien. ¿Puedo ayudarte con alguna de estas opciones?',
        suggestions: [
          'Pisos en alquiler',
          'Casas en venta',
          'Ver destacados',
          'Contactar'
        ]
      };
    }
  }

  // Guardar respuesta del bot
  await prisma.chatMessage.create({
    data: {
      conversationId: conversation.id,
      role: 'BOT',
      content: response.message,
      metadata: response.properties ? { properties: response.properties } : undefined,
    },
  });

  return response;
}

// ============================================
// FUNCIONES AUXILIARES EXPORTADAS
// ============================================

export async function saveVisitorContact(
  sessionId: string,
  data: { name?: string; email?: string; phone?: string }
): Promise<void> {
  await prisma.chatConversation.update({
    where: { sessionId },
    data: {
      visitorName: data.name,
      visitorEmail: data.email,
      visitorPhone: data.phone,
      status: 'LEAD_CAPTURED',
    },
  });
}

export async function getConversationHistory(sessionId: string): Promise<any[]> {
  const conversation = await prisma.chatConversation.findUnique({
    where: { sessionId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });

  if (!conversation) return [];

  return conversation.messages.map(m => ({
    role: m.role.toLowerCase(),
    content: m.content,
    timestamp: m.createdAt,
    metadata: m.metadata,
  }));
}

export async function getAllConversations(filters?: {
  status?: ChatStatus;
  hasContact?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ conversations: any[]; total: number }> {
  const where: any = {};

  if (filters?.status) where.status = filters.status;
  if (filters?.hasContact) {
    where.OR = [
      { visitorEmail: { not: null } },
      { visitorPhone: { not: null } },
    ];
  }

  const [conversations, total] = await Promise.all([
    prisma.chatConversation.findMany({
      where,
      take: filters?.limit || 20,
      skip: filters?.offset || 0,
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { messages: true } },
      },
    }),
    prisma.chatConversation.count({ where }),
  ]);

  return {
    conversations: conversations.map(c => ({
      id: c.id,
      sessionId: c.sessionId,
      visitorName: c.visitorName,
      visitorEmail: c.visitorEmail,
      visitorPhone: c.visitorPhone,
      status: c.status,
      source: c.source,
      propertyId: c.propertyId,
      lastMessage: c.messages[0]?.content || '',
      messageCount: c._count.messages,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    total,
  };
}

export async function getConversationById(id: string): Promise<any | null> {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });

  if (!conversation) return null;

  return {
    id: conversation.id,
    sessionId: conversation.sessionId,
    visitorName: conversation.visitorName,
    visitorEmail: conversation.visitorEmail,
    visitorPhone: conversation.visitorPhone,
    status: conversation.status,
    source: conversation.source,
    propertyId: conversation.propertyId,
    messages: conversation.messages.map(m => ({
      id: m.id,
      role: m.role.toLowerCase(),
      content: m.content,
      metadata: m.metadata,
      createdAt: m.createdAt,
    })),
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

export async function updateConversationStatus(id: string, status: ChatStatus): Promise<void> {
  await prisma.chatConversation.update({
    where: { id },
    data: { status },
  });
}
