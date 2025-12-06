/**
 * Script para poblar la base de datos con propiedades de Sanlúcar de Barrameda
 *
 * Uso: npx ts-node src/scripts/seed-sanlucar.ts
 *
 * Este script:
 * 1. Crea la ciudad de Sanlúcar de Barrameda si no existe
 * 2. Inserta 15 propiedades con datos realistas
 * 3. Cada propiedad tiene entre 3-5 imágenes
 */

import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Coordenadas base de Sanlúcar de Barrameda
const SANLUCAR_CENTER = {
  lat: 36.7783,
  lng: -6.3517,
};

// Barrios/zonas de Sanlúcar de Barrameda
const NEIGHBORHOODS = [
  "Centro",
  "Bajo de Guía",
  "Bonanza",
  "La Jara",
  "El Palomar",
  "Las Piletas",
  "Monte Algaida",
  "Barrio Alto",
  "El Pino",
  "La Calzada",
];

// Imágenes de propiedades (URLs de Unsplash - imágenes de alta calidad y gratuitas)
const PROPERTY_IMAGES = {
  exterior: [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop",
  ],
  salon: [
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&h=600&fit=crop",
  ],
  cocina: [
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&h=600&fit=crop",
  ],
  dormitorio: [
    "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop",
  ],
  bano: [
    "https://images.unsplash.com/photo-1600566752734-2a0cd66cd61e?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&h=600&fit=crop",
  ],
  terraza: [
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1600566752547-33a8f8b2e3f4?w=800&h=600&fit=crop",
  ],
};

// Función para generar coordenadas aleatorias cerca del centro
function generateCoordinates(): { lat: number; lng: number } {
  // Generar variación de +/- 0.02 grados (aprox 2km)
  const latVariation = (Math.random() - 0.5) * 0.04;
  const lngVariation = (Math.random() - 0.5) * 0.04;
  return {
    lat: SANLUCAR_CENTER.lat + latVariation,
    lng: SANLUCAR_CENTER.lng + lngVariation,
  };
}

// Función para generar slug único
function generateSlug(title: string, index: number): string {
  return (
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + `-${index}`
  );
}

// Función para seleccionar imágenes aleatorias
function selectImages(count: number): string[] {
  const images: string[] = [];
  const categories = Object.keys(PROPERTY_IMAGES) as Array<keyof typeof PROPERTY_IMAGES>;

  // Siempre incluir una imagen exterior primero
  images.push(PROPERTY_IMAGES.exterior[Math.floor(Math.random() * PROPERTY_IMAGES.exterior.length)]);

  // Añadir imágenes de otras categorías
  while (images.length < count) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const categoryImages = PROPERTY_IMAGES[category];
    const randomImage = categoryImages[Math.floor(Math.random() * categoryImages.length)];
    if (!images.includes(randomImage)) {
      images.push(randomImage);
    }
  }

  return images;
}

// Datos de las 15 propiedades
const PROPERTIES_DATA = [
  {
    title: "Piso luminoso en el centro de Sanlúcar",
    description:
      "Magnífico piso reformado en pleno centro de Sanlúcar de Barrameda. Dispone de 3 dormitorios, 2 baños completos, salón amplio y luminoso con balcón a la calle principal. Cocina equipada con electrodomésticos de alta gama. Suelos de mármol y carpintería de aluminio con doble acristalamiento. Muy cerca de todos los servicios: colegios, supermercados, transporte público y zona comercial.",
    operation: "SALE",
    propertyType: "FLAT",
    price: 185000,
    bedrooms: 3,
    bathrooms: 2,
    areaM2: 110,
    floor: 2,
    hasElevator: true,
    hasParking: false,
    hasTerrace: true,
    energyRating: "D",
  },
  {
    title: "Casa adosada con jardín en Bajo de Guía",
    description:
      "Espectacular casa adosada a 200 metros de la playa de Bajo de Guía. Cuenta con 4 dormitorios, 3 baños, amplio salón-comedor con chimenea, cocina independiente totalmente equipada y un jardín privado de 60m² con barbacoa. Garaje para 2 vehículos. Orientación sur con vistas al mar. Perfecta para familias que buscan calidad de vida junto al mar.",
    operation: "SALE",
    propertyType: "HOUSE",
    price: 320000,
    bedrooms: 4,
    bathrooms: 3,
    areaM2: 180,
    hasElevator: false,
    hasParking: true,
    hasPool: false,
    hasTerrace: true,
    hasGarden: true,
    energyRating: "C",
  },
  {
    title: "Ático con terraza panorámica",
    description:
      "Impresionante ático dúplex con terraza de 50m² y vistas panorámicas a la desembocadura del Guadalquivir y Doñana. Planta principal con salón, cocina americana y aseo. Planta superior con 2 dormitorios en suite con vestidor. Acabados de lujo, domótica integral, aire acondicionado por conductos. Plaza de garaje y trastero incluidos. Urbanización con piscina comunitaria.",
    operation: "SALE",
    propertyType: "PENTHOUSE",
    price: 275000,
    bedrooms: 2,
    bathrooms: 2,
    areaM2: 95,
    floor: 4,
    hasElevator: true,
    hasParking: true,
    hasPool: true,
    hasTerrace: true,
    energyRating: "B",
  },
  {
    title: "Apartamento reformado junto a la playa",
    description:
      "Acogedor apartamento completamente reformado a 100 metros de la playa de La Calzada. Ideal como primera vivienda o inversión turística. 2 dormitorios, 1 baño, salón con cocina americana y terraza con vistas laterales al mar. Amueblado y equipado, listo para entrar a vivir. Comunidad con piscina y zonas ajardinadas. Excelente rentabilidad en temporada de verano.",
    operation: "SALE",
    propertyType: "APARTMENT",
    price: 145000,
    bedrooms: 2,
    bathrooms: 1,
    areaM2: 65,
    floor: 1,
    hasElevator: true,
    hasParking: false,
    hasPool: true,
    hasTerrace: true,
    furnished: true,
    energyRating: "E",
  },
  {
    title: "Chalet independiente con piscina privada",
    description:
      "Espléndido chalet independiente en parcela de 500m² con piscina privada y jardín. La vivienda dispone de 5 dormitorios (principal en suite), 4 baños, amplio salón con chimenea, cocina de diseño con isla central y lavadero. Porche cubierto de 30m² ideal para comidas al aire libre. Garaje para 3 coches. Sistema de riego automático y alarma. Zona residencial muy tranquila.",
    operation: "SALE",
    propertyType: "HOUSE",
    price: 450000,
    bedrooms: 5,
    bathrooms: 4,
    areaM2: 280,
    hasElevator: false,
    hasParking: true,
    hasPool: true,
    hasTerrace: true,
    hasGarden: true,
    energyRating: "C",
  },
  {
    title: "Piso en alquiler zona Las Piletas",
    description:
      "Piso exterior muy luminoso disponible para alquiler de larga temporada. 3 dormitorios con armarios empotrados, 1 baño completo con plato de ducha, salón-comedor de 25m² y cocina independiente con galería. Orientación este-oeste que garantiza luz natural todo el día. Edificio con ascensor. Gastos de comunidad incluidos. Se requiere nómina y fianza de 2 meses.",
    operation: "RENT",
    propertyType: "FLAT",
    price: 650,
    bedrooms: 3,
    bathrooms: 1,
    areaM2: 90,
    floor: 3,
    hasElevator: true,
    hasParking: false,
    hasTerrace: false,
    petsAllowed: false,
    energyRating: "E",
  },
  {
    title: "Dúplex moderno en urbanización cerrada",
    description:
      "Dúplex de obra nueva en urbanización privada con seguridad 24h. Planta baja: salón de 35m², cocina equipada Bosch, aseo y acceso directo a jardín privado. Planta alta: 3 dormitorios (principal con baño en suite y vestidor) y baño completo. Preinstalación de aire acondicionado. 2 plazas de garaje y trastero. Zonas comunes con piscina, pádel y gimnasio.",
    operation: "SALE",
    propertyType: "DUPLEX",
    price: 235000,
    bedrooms: 3,
    bathrooms: 2,
    areaM2: 140,
    builtYear: 2023,
    hasElevator: false,
    hasParking: true,
    hasPool: true,
    hasTerrace: true,
    hasGarden: true,
    energyRating: "A",
  },
  {
    title: "Local comercial en calle peatonal",
    description:
      "Excelente local comercial en la principal calle peatonal de Sanlúcar. 120m² diáfanos con escaparate de 8 metros lineales. Altura libre de 4 metros, ideal para cualquier tipo de negocio. Instalación eléctrica renovada, aire acondicionado y salida de humos. Aseo adaptado. Alto tránsito peatonal durante todo el año. Disponible para venta o alquiler.",
    operation: "SALE",
    propertyType: "COMMERCIAL",
    price: 195000,
    areaM2: 120,
    hasParking: false,
    energyRating: "G",
  },
  {
    title: "Estudio acogedor para inversión",
    description:
      "Estudio completamente reformado ideal para inversión o primera vivienda. Espacio diáfano de 40m² muy bien aprovechado con zona de dormitorio, salón y cocina americana. Baño completo con ducha. Totalmente amueblado con muebles de diseño. Edificio histórico rehabilitado en el casco antiguo. Alta rentabilidad en alquiler turístico o de larga temporada.",
    operation: "SALE",
    propertyType: "APARTMENT",
    price: 78000,
    bedrooms: 1,
    bathrooms: 1,
    areaM2: 40,
    floor: 1,
    hasElevator: false,
    hasParking: false,
    furnished: true,
    energyRating: "F",
  },
  {
    title: "Casa de pueblo con encanto andaluz",
    description:
      "Preciosa casa de pueblo tradicional totalmente restaurada respetando su esencia andaluza. Patio central con fuente, 3 dormitorios con techos de vigas de madera, 2 baños, salón con chimenea y cocina rústica equipada. Azotea privada con vistas a los tejados del pueblo y al Coto de Doñana. Suelos de barro cocido originales. Una joya del patrimonio local.",
    operation: "SALE",
    propertyType: "HOUSE",
    price: 210000,
    bedrooms: 3,
    bathrooms: 2,
    areaM2: 150,
    builtYear: 1920,
    hasElevator: false,
    hasParking: false,
    hasTerrace: true,
    energyRating: "G",
  },
  {
    title: "Piso grande para familia en El Palomar",
    description:
      "Amplio piso familiar de 130m² en la tranquila zona de El Palomar. 4 dormitorios exteriores (2 con balcón), 2 baños completos, gran salón de 30m² y cocina independiente con despensa. Trastero en planta baja incluido. Garaje opcional. Comunidad con jardines y zona infantil. Cerca de colegios, instituto y polideportivo. Ideal para familias con niños.",
    operation: "SALE",
    propertyType: "FLAT",
    price: 165000,
    bedrooms: 4,
    bathrooms: 2,
    areaM2: 130,
    floor: 2,
    hasElevator: true,
    hasParking: true,
    hasTerrace: true,
    petsAllowed: true,
    energyRating: "D",
  },
  {
    title: "Apartamento en alquiler frente al mar",
    description:
      "Fantástico apartamento en primera línea de playa disponible para alquiler. Vistas directas al mar desde el salón y dormitorio principal. 2 dormitorios, 1 baño, salón luminoso y cocina equipada. Terraza de 12m² perfecta para disfrutar de las puestas de sol. Urbanización con piscina, jardines y acceso directo a la playa. Disponible todo el año.",
    operation: "RENT",
    propertyType: "APARTMENT",
    price: 850,
    bedrooms: 2,
    bathrooms: 1,
    areaM2: 75,
    floor: 2,
    hasElevator: true,
    hasParking: true,
    hasPool: true,
    hasTerrace: true,
    furnished: true,
    petsAllowed: false,
    energyRating: "D",
  },
  {
    title: "Plaza de garaje en centro",
    description:
      "Plaza de garaje amplia (15m²) en sótano de edificio céntrico. Fácil acceso y maniobra, apta para vehículos grandes o furgonetas. Puerta automática con mando a distancia. Muy bien iluminado y ventilado. Ideal para residentes del centro histórico donde el aparcamiento es muy limitado. También disponible para alquiler mensual.",
    operation: "SALE",
    propertyType: "GARAGE",
    price: 18000,
    areaM2: 15,
    hasParking: true,
  },
  {
    title: "Parcela urbana para construir tu casa",
    description:
      "Parcela urbana de 400m² con todos los servicios (agua, luz, alcantarillado) en urbanización consolidada. Edificabilidad de 0.6 que permite construir vivienda unifamiliar de hasta 240m² más sótano. Orientación sur perfecta. Proyecto básico disponible. Zona muy demandada con excelentes comunicaciones. No se admiten promociones, solo vivienda unifamiliar.",
    operation: "SALE",
    propertyType: "LAND",
    price: 95000,
    areaM2: 400,
  },
  {
    title: "Habitación en piso compartido",
    description:
      "Habitación individual amueblada en piso compartido con otros 2 jóvenes profesionales. 12m² con cama, armario, escritorio y silla. Zonas comunes: salón, cocina equipada y 2 baños. WiFi de alta velocidad incluido. Gastos de agua y luz incluidos hasta 50€/mes. Ambiente tranquilo y respetuoso. Cerca del centro y bien comunicado. Ideal para estudiantes o trabajadores.",
    operation: "RENT",
    propertyType: "ROOM",
    price: 280,
    bedrooms: 1,
    bathrooms: 2,
    areaM2: 12,
    floor: 1,
    hasElevator: false,
    furnished: true,
    petsAllowed: false,
    energyRating: "E",
  },
];

async function seedSanlucar() {
  console.log("");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  SEED DE PROPIEDADES - SANLÚCAR DE BARRAMEDA");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("");

  try {
    // 1. Crear o encontrar la ciudad de Sanlúcar de Barrameda
    console.log("📍 Buscando/creando ciudad de Sanlúcar de Barrameda...");

    let city = await prisma.city.findFirst({
      where: {
        OR: [{ slug: "sanlucar-de-barrameda" }, { name: { contains: "Sanlúcar", mode: "insensitive" } }],
      },
    });

    if (!city) {
      city = await prisma.city.create({
        data: {
          name: "Sanlúcar de Barrameda",
          slug: "sanlucar-de-barrameda",
          province: "Cádiz",
          latitude: SANLUCAR_CENTER.lat,
          longitude: SANLUCAR_CENTER.lng,
          active: true,
        },
      });
      console.log("   ✅ Ciudad creada: Sanlúcar de Barrameda");
    } else {
      console.log(`   ✅ Ciudad encontrada: ${city.name} (ID: ${city.id})`);
    }

    // 2. Crear las propiedades
    console.log("");
    console.log("🏠 Creando propiedades...");
    console.log("");

    let created = 0;
    let skipped = 0;

    for (let i = 0; i < PROPERTIES_DATA.length; i++) {
      const propData = PROPERTIES_DATA[i];
      const slug = generateSlug(propData.title, i + 1);

      // Verificar si ya existe
      const existing = await prisma.property.findUnique({
        where: { slug },
      });

      if (existing) {
        console.log(`   ⏭️  Saltando: ${propData.title} (ya existe)`);
        skipped++;
        continue;
      }

      // Generar coordenadas únicas
      const coords = generateCoordinates();

      // Seleccionar barrio aleatorio
      const neighborhood = NEIGHBORHOODS[Math.floor(Math.random() * NEIGHBORHOODS.length)];

      // Seleccionar imágenes (3-5 por propiedad)
      const imageCount = 3 + Math.floor(Math.random() * 3);
      const images = selectImages(imageCount);

      // Crear la propiedad con sus imágenes
      const property = await prisma.property.create({
        data: {
          title: propData.title,
          slug,
          description: propData.description,
          operation: propData.operation as any,
          propertyType: propData.propertyType as any,
          price: propData.price,
          currency: "EUR",
          cityId: city.id,
          neighborhood,
          address: `Calle ${neighborhood} ${Math.floor(Math.random() * 50) + 1}, Sanlúcar de Barrameda`,
          latitude: coords.lat,
          longitude: coords.lng,
          bedrooms: propData.bedrooms || null,
          bathrooms: propData.bathrooms || null,
          areaM2: propData.areaM2 || null,
          builtYear: propData.builtYear || null,
          floor: propData.floor || null,
          hasElevator: propData.hasElevator || null,
          hasParking: propData.hasParking || null,
          hasPool: propData.hasPool || null,
          hasTerrace: propData.hasTerrace || null,
          hasGarden: propData.hasGarden || null,
          furnished: propData.furnished || null,
          petsAllowed: propData.petsAllowed || null,
          energyRating: propData.energyRating || null,
          status: "ACTIVE",
          isFeatured: i < 6, // Las primeras 6 serán destacadas
          images: {
            create: images.map((url, idx) => ({
              url,
              alt: `${propData.title} - Imagen ${idx + 1}`,
              order: idx,
              isPrimary: idx === 0,
            })),
          },
        },
      });

      const priceStr =
        propData.operation === "RENT" ? `${propData.price}€/mes` : `${propData.price.toLocaleString("es-ES")}€`;

      console.log(`   ✅ ${property.title}`);
      console.log(`      📍 ${neighborhood} | 💰 ${priceStr} | 🖼️  ${images.length} imágenes`);
      created++;
    }

    // Resumen
    console.log("");
    console.log("───────────────────────────────────────────────────────────");
    console.log("  RESUMEN");
    console.log("───────────────────────────────────────────────────────────");
    console.log(`  ✅ Propiedades creadas: ${created}`);
    console.log(`  ⏭️  Propiedades omitidas: ${skipped}`);
    console.log(`  📍 Ciudad: Sanlúcar de Barrameda (ID: ${city.id})`);
    console.log("───────────────────────────────────────────────────────────");
    console.log("");
    console.log("🎉 ¡Seed completado con éxito!");
    console.log("");
  } catch (error) {
    console.error("❌ Error durante el seed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Ejecutar
seedSanlucar();
