# Backend Korvalia - Proyecto Inmobiliario

Backend completo para un sistema de gestión inmobiliaria con Express, Prisma 7 y PostgreSQL.

## 🚀 Características

- ✅ **Auth JWT** - Login y autenticación con tokens
- ✅ **CRUD Propiedades** - Gestión completa de propiedades inmobiliarias
- ✅ **Gestión de Imágenes** - Upload múltiple con almacenamiento en filesystem
- ✅ **Filtros Avanzados** - Por operación, tipo, ciudad, precio, características, etc.
- ✅ **Gestión de Ciudades** - CRUD completo con slugs únicos
- ✅ **Configuración de Empresa** - Hero section y datos de contacto
- ✅ **Validación de Datos** - Validaciones manuales integradas
- ✅ **Manejo de Errores** - Sistema global de errores estructurados

## 📁 Estructura del Proyecto

```
backend/
├── prisma/
│   └── schema.prisma          # Modelos de base de datos
├── src/
│   ├── prisma/
│   │   └── client.ts          # Cliente Prisma con adapter PG
│   ├── controllers/           # Controladores de rutas
│   │   ├── auth.controller.ts
│   │   ├── properties.controller.ts
│   │   ├── cities.controller.ts
│   │   └── settings.controller.ts
│   ├── services/              # Lógica de negocio
│   │   ├── auth.service.ts
│   │   ├── properties.service.ts
│   │   ├── cities.service.ts
│   │   ├── settings.service.ts
│   │   └── upload.service.ts
│   ├── routes/                # Definición de rutas
│   │   ├── auth.routes.ts
│   │   ├── properties.routes.ts
│   │   ├── cities.routes.ts
│   │   ├── settings.routes.ts
│   │   └── index.ts
│   ├── middlewares/           # Middlewares personalizados
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── upload.middleware.ts
│   ├── utils/                 # Utilidades
│   │   ├── slugify.ts
│   │   ├── file.ts
│   │   └── response.ts
│   ├── scripts/
│   │   └── seed.ts            # Script de inicialización
│   ├── app.ts                 # Configuración de Express
│   └── server.ts              # Punto de entrada
├── uploads/                   # Archivos subidos
│   ├── properties/
│   └── settings/
└── .env.example               # Variables de entorno de ejemplo
```

## 🛠️ Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y configura tus variables:

```bash
cp .env.example .env
```

Edita el archivo `.env`:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://usuario:password@localhost:5432/korvalia_db
JWT_SECRET=tu_secreto_super_seguro_aqui_cambiar_en_produccion
JWT_EXPIRES_IN=7d
UPLOADS_PATH=uploads
```

### 3. Generar cliente de Prisma

```bash
npm run prisma:generate
```

### 4. Crear la base de datos

```bash
npm run prisma:push
# o si prefieres usar migraciones:
npm run prisma:migrate
```

### 5. Poblar la base de datos (opcional)

Ejecuta el seed para crear un usuario admin y datos de ejemplo:

```bash
npm run seed
```

Esto creará:
- **Usuario admin**: `admin@korvalia.com` / `admin123` (⚠️ **cambiar la contraseña después del primer login**)
- **Configuración inicial** de la empresa
- **4 ciudades de ejemplo**: Madrid, Barcelona, Valencia, Sevilla

## 🚀 Uso

### Desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:4000`

### Producción

```bash
npm run build
npm start
```

## 📡 API Endpoints

### 🔐 Autenticación

```
POST   /api/auth/login      # Login y obtención de token
GET    /api/auth/me         # Datos del usuario autenticado (requiere auth)
```

### 🏠 Propiedades

```
GET    /api/properties                    # Listar con filtros (público)
GET    /api/properties/featured           # Propiedades destacadas (público)
GET    /api/properties/:id                # Obtener por ID (público)
GET    /api/properties/slug/:slug         # Obtener por slug (público)
POST   /api/properties                    # Crear (requiere auth)
PUT    /api/properties/:id                # Actualizar (requiere auth)
DELETE /api/properties/:id                # Eliminar (requiere auth)
POST   /api/properties/:id/images         # Agregar imágenes (requiere auth)
DELETE /api/properties/images/:imageId    # Eliminar imagen (requiere auth)
PUT    /api/properties/:id/images/order   # Ordenar imágenes (requiere auth)
```

**Filtros disponibles** en `GET /api/properties`:
- `operation` - RENT | SALE
- `propertyType` - FLAT | HOUSE | PENTHOUSE | DUPLEX | LAND | COMMERCIAL | GARAGE | ROOM | OTHER
- `city` - slug de ciudad
- `cityId` - ID de ciudad
- `bedrooms` - número mínimo
- `bathrooms` - número mínimo
- `priceMin` - precio mínimo
- `priceMax` - precio máximo
- `hasPool` - true/false
- `hasParking` - true/false
- `hasElevator` - true/false
- `orderBy` - price_asc | price_desc | recent | oldest
- `limit` - límite de resultados
- `offset` - offset para paginación

### 🏙️ Ciudades

```
GET    /api/cities       # Listar todas (público)
GET    /api/cities/:id   # Obtener por ID (público)
POST   /api/cities       # Crear (requiere auth)
PUT    /api/cities/:id   # Actualizar (requiere auth)
DELETE /api/cities/:id   # Eliminar (requiere auth)
```

### ⚙️ Configuración

```
GET    /api/settings     # Obtener configuración (público)
PUT    /api/settings     # Actualizar (requiere auth, acepta multipart/form-data para imagen)
```

### 🏥 Health Check

```
GET    /api/health       # Estado de la API
```

## 🔒 Autenticación

Las rutas protegidas requieren un token JWT en el header `Authorization`:

```
Authorization: Bearer <token>
```

El token se obtiene al hacer login en `/api/auth/login`.

## 📤 Upload de Imágenes

Las rutas que aceptan imágenes usan `multipart/form-data`:

- **Propiedades**: Campo `images` (múltiples archivos)
- **Settings**: Campo `image` (archivo único)

**Formatos aceptados**: JPEG, PNG, WebP, GIF
**Tamaño máximo**: 5MB por archivo
**Límite de archivos**: 20 imágenes por propiedad

## 🗄️ Modelos de Base de Datos

### Property
- Información completa de la propiedad
- Relación con ciudad e imágenes
- Estados: ACTIVE, INACTIVE, RESERVED, SOLD, RENTED

### PropertyImage
- Imágenes asociadas a propiedades
- Campo `order` para ordenamiento

### City
- Ciudades con slug único
- Relación con propiedades

### CompanySettings
- Configuración del hero y datos de contacto
- Siempre existe un único registro

### AdminUser
- Usuarios administradores
- Contraseñas hasheadas con bcrypt

## 🛠️ Scripts Disponibles

```bash
npm run dev              # Desarrollo con hot-reload
npm run build            # Compilar TypeScript
npm start                # Ejecutar en producción
npm run seed             # Poblar base de datos inicial
npm run prisma:generate  # Generar cliente de Prisma
npm run prisma:migrate   # Crear migración
npm run prisma:push      # Sincronizar schema sin migración
npm run prisma:studio    # Abrir Prisma Studio
```

## 📝 Notas Importantes

1. **JWT_SECRET**: Cambia el valor en producción por uno seguro
2. **Contraseña Admin**: Cambia la contraseña del admin después del primer login
3. **Uploads**: Las carpetas `uploads/properties` y `uploads/settings` deben existir y tener permisos de escritura
4. **Archivos estáticos**: Las imágenes se sirven desde `/uploads` automáticamente

## 🔧 Tecnologías

- **Express 5** - Framework web
- **Prisma 7** - ORM con adapter PostgreSQL
- **TypeScript** - Tipado estático
- **JWT** - Autenticación
- **Bcrypt** - Hash de contraseñas
- **Multer** - Upload de archivos
- **Morgan** - Logging de peticiones
- **Helmet** - Seguridad HTTP
- **CORS** - Control de acceso

## 📦 Respuestas de la API

### Éxito
```json
{
  "success": true,
  "data": { ... },
  "message": "Mensaje opcional"
}
```

### Error
```json
{
  "success": false,
  "error": "Mensaje de error",
  "details": { ... }  // Solo en desarrollo
}
```

## 🚀 Próximos Pasos

1. Conecta el frontend (Next.js) a esta API
2. Configura los datos de la empresa en `/api/settings`
3. Agrega ciudades adicionales en `/api/cities`
4. Comienza a crear propiedades en `/api/properties`

---

**¡Backend completo y listo para usar! 🎉**
