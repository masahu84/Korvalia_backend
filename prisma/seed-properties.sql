-- Script para poblar la base de datos con propiedades de ejemplo
-- Este script crea propiedades variadas para testing

-- ============================================
-- PROPIEDADES EN MADRID
-- ============================================

-- Piso moderno en venta - Destacado
INSERT INTO "Property" (
  "title", "slug", "description", "operation", "propertyType", "price", "currency",
  "cityId", "neighborhood", "address", "bedrooms", "bathrooms", "areaM2", "builtYear",
  "floor", "hasElevator", "hasParking", "hasPool", "hasTerrace", "hasGarden",
  "furnished", "petsAllowed", "energyRating", "status", "isFeatured", "createdAt", "updatedAt"
) VALUES (
  'Piso exclusivo en Salamanca',
  'piso-exclusivo-salamanca',
  'Espectacular piso de lujo en el barrio de Salamanca. Totalmente reformado con materiales de primera calidad. Cuenta con amplios espacios, mucha luz natural y acabados excepcionales. Ideal para familias que buscan el máximo confort en una de las mejores zonas de Madrid.',
  'SALE', 'FLAT', 450000, 'EUR',
  1, 'Salamanca', 'Calle Serrano 125',
  3, 2, 120, 2018,
  4, true, true, false, true, false,
  false, false, 'B', 'ACTIVE', true,
  NOW(), NOW()
);

-- Ático con terraza en venta
INSERT INTO "Property" (
  "title", "slug", "description", "operation", "propertyType", "price", "currency",
  "cityId", "neighborhood", "address", "bedrooms", "bathrooms", "areaM2", "builtYear",
  "floor", "hasElevator", "hasParking", "hasPool", "hasTerrace", "hasGarden",
  "furnished", "petsAllowed", "energyRating", "status", "isFeatured", "createdAt", "updatedAt"
) VALUES (
  'Ático con terraza panorámica',
  'atico-terraza-panoramica',
  'Impresionante ático en el centro de Madrid con terraza de 80m². Vistas despejadas a toda la ciudad. Diseño moderno y funcional con cocina americana totalmente equipada. Perfecto para quienes valoran los espacios exteriores.',
  'SALE', 'PENTHOUSE', 650000, 'EUR',
  1, 'Centro', 'Gran Vía 42',
  4, 3, 150, 2020,
  8, true, true, false, true, false,
  true, true, 'A', 'ACTIVE', true,
  NOW(), NOW()
);

-- Estudio en alquiler
INSERT INTO "Property" (
  "title", "slug", "description", "operation", "propertyType", "price", "currency",
  "cityId", "neighborhood", "address", "bedrooms", "bathrooms", "areaM2",
  "floor", "hasElevator", "furnished", "petsAllowed", "energyRating", "status", "createdAt", "updatedAt"
) VALUES (
  'Estudio moderno en Malasaña',
  'estudio-moderno-malasana',
  'Acogedor estudio completamente amueblado en pleno corazón de Malasaña. Perfecto para estudiantes o jóvenes profesionales. Zona con excelente ambiente, cerca de metro y todos los servicios.',
  'RENT', 'STUDIO', 850, 'EUR',
  1, 'Malasaña', 'Calle del Pez 15',
  1, 1, 35,
  2, true, true, false, 'D', 'ACTIVE',
  NOW(), NOW()
);

-- ============================================
-- PROPIEDADES EN BARCELONA
-- ============================================

-- Piso en el Eixample - Destacado
INSERT INTO "Property" (
  "title", "slug", "description", "operation", "propertyType", "price", "currency",
  "cityId", "neighborhood", "address", "bedrooms", "bathrooms", "areaM2", "builtYear",
  "floor", "hasElevator", "hasParking", "hasTerrace", "petsAllowed", "energyRating", "status", "isFeatured", "createdAt", "updatedAt"
) VALUES (
  'Piso modernista en Eixample',
  'piso-modernista-eixample',
  'Excepcional piso en finca modernista rehabilitada. Techos altos con molduras originales, suelos hidráulicos restaurados y mucha luz natural. Combina el encanto histórico con las comodidades modernas.',
  'SALE', 'FLAT', 520000, 'EUR',
  2, 'Eixample', 'Passeig de Gràcia 88',
  3, 2, 110, 1920,
  3, true, false, true, true, 'C', 'ACTIVE', true,
  NOW(), NOW()
);

-- Chalet cerca de la playa - Destacado
INSERT INTO "Property" (
  "title", "slug", "description", "operation", "propertyType", "price", "currency",
  "cityId", "neighborhood", "address", "bedrooms", "bathrooms", "areaM2", "builtYear",
  "hasParking", "hasPool", "hasGarden", "petsAllowed", "energyRating", "status", "isFeatured", "createdAt", "updatedAt"
) VALUES (
  'Chalet con piscina en Castelldefels',
  'chalet-piscina-castelldefels',
  'Magnífico chalet independiente a 5 minutos de la playa. Amplio jardín con piscina privada, porche cubierto y zona BBQ. Ideal para familias que buscan tranquilidad sin renunciar a la cercanía del mar.',
  'SALE', 'HOUSE', 890000, 'EUR',
  2, 'Castelldefels', 'Avenida del Mar 234',
  5, 3, 280, 2015,
  true, true, true, true, 'B', 'ACTIVE', true,
  NOW(), NOW()
);

-- Loft en alquiler
INSERT INTO "Property" (
  "title", "slug", "description", "operation", "propertyType", "price", "currency",
  "cityId", "neighborhood", "address", "bedrooms", "bathrooms", "areaM2", "builtYear",
  "floor", "hasElevator", "furnished", "petsAllowed", "energyRating", "status", "createdAt", "updatedAt"
) VALUES (
  'Loft industrial en Poblenou',
  'loft-industrial-poblenou',
  'Espectacular loft de diseño en antiguo edificio industrial rehabilitado. Espacios diáfanos con doble altura, grandes ventanales y acabados de calidad. Perfecto para creativos y amantes del diseño contemporáneo.',
  'RENT', 'FLAT', 1800, 'EUR',
  2, 'Poblenou', 'Carrer de Llull 50',
  2, 2, 95, 2019,
  1, true, true, true, 'A', 'ACTIVE',
  NOW(), NOW()
);

-- ============================================
-- PROPIEDADES EN SEVILLA
-- ============================================

-- Casa tradicional andaluza - Destacado
INSERT INTO "Property" (
  "title", "slug", "description", "operation", "propertyType", "price", "currency",
  "cityId", "neighborhood", "address", "bedrooms", "bathrooms", "areaM2", "builtYear",
  "hasParking", "hasTerrace", "hasGarden", "petsAllowed", "energyRating", "status", "isFeatured", "createdAt", "updatedAt"
) VALUES (
  'Casa tradicional en Triana',
  'casa-tradicional-triana',
  'Encantadora casa andaluza completamente reformada en el corazón de Triana. Patio interior típico sevillano con fuente, azulejos originales y mucha personalidad. Una joya arquitectónica que respeta la esencia del barrio.',
  'SALE', 'HOUSE', 385000, 'EUR',
  4, 'Triana', 'Calle Betis 76',
  4, 3, 180, 1950,
  false, true, true, true, 'C', 'ACTIVE', true,
  NOW(), NOW()
);

-- Piso cerca de la Catedral
INSERT INTO "Property" (
  "title", "slug", "description", "operation", "propertyType", "price", "currency",
  "cityId", "neighborhood", "address", "bedrooms", "bathrooms", "areaM2", "builtYear",
  "floor", "hasElevator", "hasTerrace", "petsAllowed", "energyRating", "status", "isFeatured", "createdAt", "updatedAt"
) VALUES (
  'Piso histórico junto a la Catedral',
  'piso-historico-catedral',
  'Piso señorial en edificio histórico a dos pasos de la Catedral y la Giralda. Techos altos, balcones con vistas y elementos arquitectónicos originales. Ubicación inmejorable en pleno casco antiguo.',
  'SALE', 'FLAT', 295000, 'EUR',
  4, 'Casco Antiguo', 'Calle Mateos Gago 12',
  3, 2, 95, 1890,
  2, false, true, false, 'D', 'ACTIVE', false,
  NOW(), NOW()
);

-- Dúplex en alquiler
INSERT INTO "Property" (
  "title", "slug", "description", "operation", "propertyType", "price", "currency",
  "cityId", "neighborhood", "address", "bedrooms", "bathrooms", "areaM2", "builtYear",
  "floor", "hasElevator", "hasParking", "hasTerrace", "furnished", "petsAllowed", "energyRating", "status", "createdAt", "updatedAt"
) VALUES (
  'Dúplex moderno en Nervión',
  'duplex-moderno-nervion',
  'Dúplex de reciente construcción en zona residencial tranquila. Distribución perfecta en dos plantas, terraza privada en planta superior y plaza de garaje. Ideal para familias.',
  'RENT', 'DUPLEX', 1200, 'EUR',
  4, 'Nervión', 'Avenida Luis de Morales 34',
  3, 2, 115, 2021,
  4, true, true, true, false, true, 'A', 'ACTIVE',
  NOW(), NOW()
);

-- ============================================
-- PROPIEDADES EN VALENCIA
-- ============================================

-- Apartamento en primera línea de playa - Destacado
INSERT INTO "Property" (
  "title", "slug", "description", "operation", "propertyType", "price", "currency",
  "cityId", "neighborhood", "address", "bedrooms", "bathrooms", "areaM2", "builtYear",
  "floor", "hasElevator", "hasParking", "hasPool", "hasTerrace", "energyRating", "status", "isFeatured", "createdAt", "updatedAt"
) VALUES (
  'Apartamento frente al mar en Malvarrosa',
  'apartamento-mar-malvarrosa',
  'Espectacular apartamento en primera línea de playa con vistas panorámicas al Mediterráneo. Amplia terraza orientada al mar, cocina equipada y acabados de lujo. Vive frente al mar todo el año.',
  'SALE', 'FLAT', 420000, 'EUR',
  3, 'La Malvarrosa', 'Paseo Marítimo 156',
  2, 2, 85, 2017,
  6, true, true, true, true, 'B', 'ACTIVE', true,
  NOW(), NOW()
);

-- Piso en el centro histórico
INSERT INTO "Property" (
  "title", "slug", "description", "operation", "propertyType", "price", "currency",
  "cityId", "neighborhood", "address", "bedrooms", "bathrooms", "areaM2", "builtYear",
  "floor", "hasElevator", "hasTerrace", "petsAllowed", "energyRating", "status", "createdAt", "updatedAt"
) VALUES (
  'Piso reformado en el Carmen',
  'piso-reformado-carmen',
  'Piso completamente reformado en el vibrante barrio del Carmen. Combina elementos tradicionales con diseño moderno. Cerca de todos los servicios, restaurantes y vida cultural del centro histórico.',
  'SALE', 'FLAT', 280000, 'EUR',
  3, 'El Carmen', 'Calle Caballeros 45',
  2, 1, 75, 2022,
  1, false, true, true, 'B', 'ACTIVE',
  NOW(), NOW()
);

-- Villa de lujo en alquiler
INSERT INTO "Property" (
  "title", "slug", "description", "operation", "propertyType", "price", "currency",
  "cityId", "neighborhood", "address", "bedrooms", "bathrooms", "areaM2", "builtYear",
  "hasParking", "hasPool", "hasGarden", "furnished", "petsAllowed", "energyRating", "status", "createdAt", "updatedAt"
) VALUES (
  'Villa de lujo con piscina infinita',
  'villa-lujo-piscina-infinita',
  'Impresionante villa de diseño contemporáneo con piscina infinity y vistas panorámicas. Domótica completa, gimnasio privado y jardines cuidados. El máximo lujo y confort en una ubicación privilegiada.',
  'RENT', 'VILLA', 3500, 'EUR',
  3, 'La Cañada', 'Urbanización El Pinar 8',
  4, 4, 350, 2020,
  true, true, true, true, true, 'A', 'ACTIVE',
  NOW(), NOW()
);

-- Pequeño piso en alquiler para estudiantes
INSERT INTO "Property" (
  "title", "slug", "description", "operation", "propertyType", "price", "currency",
  "cityId", "neighborhood", "address", "bedrooms", "bathrooms", "areaM2",
  "floor", "hasElevator", "furnished", "petsAllowed", "energyRating", "status", "createdAt", "updatedAt"
) VALUES (
  'Piso cerca de la Universidad',
  'piso-cerca-universidad',
  'Piso funcional y bien ubicado cerca del campus universitario. Perfecto para estudiantes o jóvenes profesionales. Zona tranquila con buenas conexiones de transporte público.',
  'RENT', 'FLAT', 650, 'EUR',
  3, 'Benimaclet', 'Calle Alboraya 89',
  2, 1, 60,
  3, true, true, false, 'C', 'ACTIVE',
  NOW(), NOW()
);

COMMIT;
