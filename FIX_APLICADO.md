# ✅ Corrección Aplicada - Error SASL PostgreSQL

## 🐛 Problema Identificado

El error `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string` tenía **DOS causas**:

### 1. ❌ Comillas en DATABASE_URL (.env)

**Antes**:
```env
DATABASE_URL="postgresql://postgres:pablo2012@localhost:5432/korvalia?schema=public"
```

Las comillas dobles hacen que `dotenv` cargue la variable INCLUYENDO las comillas:
```javascript
process.env.DATABASE_URL === '"postgresql://postgres:pablo2012@localhost:5432/korvalia?schema=public"'
```

Esto causa que el Pool de pg reciba:
- Host: `"localhost` (con comilla)
- Password: `pablo2012@localhost:5432/korvalia?schema=public"` (incorrecta)

**Después** (✅ CORREGIDO):
```env
DATABASE_URL=postgresql://postgres:pablo2012@localhost:5432/korvalia?schema=public
```

### 2. ❌ dotenv se cargaba después de crear el Pool

**Antes**:
- `server.ts` importaba `prisma/client.ts`
- `client.ts` creaba el Pool inmediatamente
- `app.ts` llamaba `dotenv.config()` después

**Resultado**: `process.env.DATABASE_URL` estaba `undefined` al crear el Pool.

**Después** (✅ CORREGIDO):
```typescript
// src/prisma/client.ts
import dotenv from 'dotenv';

// Cargar ANTES de usar process.env
dotenv.config();

import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
```

## 🔧 Cambios Aplicados

### 1. Actualizado `.env`

```env
# SERVIDOR
NODE_ENV=development
PORT=4000

# BASE DE DATOS (SIN COMILLAS)
DATABASE_URL=postgresql://postgres:pablo2012@localhost:5432/korvalia?schema=public

# JWT
JWT_SECRET=tu_secreto_super_seguro_aqui_cambiar_en_produccion
JWT_EXPIRES_IN=7d

# UPLOADS
UPLOADS_PATH=uploads
```

### 2. Actualizado `src/prisma/client.ts`

```typescript
import dotenv from 'dotenv';

// Cargar variables de entorno ANTES de usar process.env
dotenv.config();

import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('⚠️  DATABASE_URL no está definida en el entorno.');
} else {
  // Log de debug para verificar la URL (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    const urlWithoutPassword = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@');
    console.log('📍 DATABASE_URL cargada:', urlWithoutPassword);
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

// ... resto del código
```

### 3. Agregado Log de Verificación en `src/server.ts`

```typescript
async function checkDatabaseConnection() {
  try {
    await prisma.city.findFirst();
    console.log('✅ Conexión a base de datos exitosa');
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:');
    console.error(error instanceof Error ? error.message : error);
    console.error('Verifica que DATABASE_URL esté correctamente configurada en .env');
  }
}
```

## 🚀 Verificación

### Al arrancar el servidor ahora deberías ver:

```
📍 DATABASE_URL cargada: postgresql://postgres:****@localhost:5432/korvalia?schema=public
🚀 Servidor ejecutándose en puerto 4000
📦 Entorno: development
✅ Conexión a base de datos exitosa
```

### Si todo está bien:
- ✅ La DATABASE_URL se muestra sin comillas
- ✅ La contraseña está oculta (`****`)
- ✅ La conexión a BD es exitosa

### Si aún hay error:
- Verifica que PostgreSQL esté corriendo
- Verifica que la base de datos `korvalia` exista
- Verifica que el usuario `postgres` tenga la contraseña correcta

## ⚙️ Comandos de Verificación

```bash
# Verificar que PostgreSQL esté corriendo
pg_isready

# Conectar a la base de datos para verificar credenciales
psql -U postgres -d korvalia

# Crear la base de datos si no existe
createdb korvalia

# Ejecutar migraciones de Prisma
npm run prisma:push

# Iniciar el servidor
npm run dev
```

## 📋 Checklist

- [x] Quitar comillas de DATABASE_URL en `.env`
- [x] Cargar `dotenv.config()` en `src/prisma/client.ts`
- [x] Agregar log de debug de DATABASE_URL
- [x] Agregar verificación de conexión en servidor
- [ ] PostgreSQL está corriendo
- [ ] Base de datos `korvalia` existe
- [ ] Credenciales son correctas

## 🎯 Reglas para .env

**SIEMPRE**:
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
```

**NUNCA**:
```env
DATABASE_URL="postgresql://user:pass@host:5432/db"  ❌
DATABASE_URL='postgresql://user:pass@host:5432/db'  ❌
```

## 💡 Notas

1. **Caracteres especiales en password**: Si la contraseña tiene caracteres especiales (`@`, `#`, `%`, etc.), deben ser URL-encoded:
   - `p@ssw0rd` → `p%40ssw0rd`
   - `pass#word` → `pass%23word`

2. **Múltiples bases de datos**: Si necesitas conectarte a varias BD, usa variables separadas:
   ```env
   DATABASE_URL=postgresql://user:pass@host:5432/db1
   DATABASE_URL_ANALYTICS=postgresql://user:pass@host:5432/db2
   ```

3. **Producción**: En producción, usa variables de entorno del sistema, no `.env`:
   ```bash
   export DATABASE_URL="postgresql://..."
   ```

---

**¡Error corregido! El servidor debería arrancar sin problemas ahora. 🎉**
