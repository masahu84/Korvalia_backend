# Fix: Error de Conexión a PostgreSQL

## ✅ Cambios Realizados

### 1. **Actualizado `src/prisma/client.ts`**

**Problema**: El import usando `import pkg from "pg"` puede causar problemas con la contraseña al crear el Pool.

**Solución**: Cambiado a import directo de named export:

```typescript
// ❌ ANTES (causaba error SASL)
import pkg from "pg";
const { Pool } = pkg;

// ✅ AHORA (correcto)
import { Pool } from 'pg';
```

**Archivo completo**:
```typescript
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('⚠️  DATABASE_URL no está definida en el entorno.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

// Singleton para evitar múltiples instancias en desarrollo
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

### 2. **Agregado Test de Conexión en `src/server.ts`**

Se agregó una función para verificar la conexión a la base de datos al arrancar:

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

### 3. **Verificado `prisma/schema.prisma`**

✅ Configuración correcta:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```

## 🧪 Cómo Verificar que Funciona

### 1. Asegúrate de tener DATABASE_URL en `.env`

```env
DATABASE_URL=postgresql://usuario:password@localhost:5432/nombre_bd
```

**Formato correcto**:
- `postgresql://` - Protocolo
- `usuario:password` - Credenciales
- `@localhost:5432` - Host y puerto
- `/nombre_bd` - Nombre de la base de datos

### 2. Regenera el cliente de Prisma

```bash
npm run prisma:generate
```

### 3. Inicia el servidor

```bash
npm run dev
```

### 4. Verifica la salida

Deberías ver:

```
🚀 Servidor ejecutándose en puerto 4000
📦 Entorno: development
✅ Conexión a base de datos exitosa
```

Si hay error, verás:

```
❌ Error al conectar con la base de datos:
[mensaje de error detallado]
Verifica que DATABASE_URL esté correctamente configurada en .env
```

## 🔍 Diagnóstico de Errores Comunes

### Error: "client password must be a string"

**Causa**: Import incorrecto de `Pool` desde `pg`

**Solución**: ✅ Ya corregido en `src/prisma/client.ts`

### Error: "Connection refused"

**Causas posibles**:
1. PostgreSQL no está corriendo
2. Puerto incorrecto en DATABASE_URL
3. Host incorrecto

**Verificar**:
```bash
# Ver si PostgreSQL está corriendo
pg_isready

# O con psql
psql -U usuario -d nombre_bd
```

### Error: "password authentication failed"

**Causa**: Credenciales incorrectas en DATABASE_URL

**Verificar**:
1. Usuario existe en PostgreSQL
2. Password es correcto
3. Usuario tiene permisos en la base de datos

### Error: "database does not exist"

**Causa**: La base de datos no existe

**Crear base de datos**:
```bash
createdb nombre_bd

# O con psql
psql -U usuario
CREATE DATABASE nombre_bd;
```

## 📋 Checklist de Configuración

- [ ] DATABASE_URL está en `.env`
- [ ] DATABASE_URL tiene el formato correcto
- [ ] PostgreSQL está corriendo
- [ ] La base de datos existe
- [ ] El usuario tiene permisos
- [ ] Se ejecutó `npm run prisma:generate`
- [ ] No hay caracteres especiales sin escapar en la password

## 🎯 Ejemplo de DATABASE_URL Correcto

```env
# Localhost
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/korvalia_db

# Con caracteres especiales (URL encoded)
DATABASE_URL=postgresql://user:p%40ssw0rd@localhost:5432/korvalia_db

# Cloud (ej: Supabase)
DATABASE_URL=postgresql://user:pass@db.xxx.supabase.co:5432/postgres

# Con SSL
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

## ⚙️ Próximos Pasos

1. **Crear las tablas** (si es primera vez):
   ```bash
   npm run prisma:push
   # o
   npm run prisma:migrate
   ```

2. **Poblar datos iniciales**:
   ```bash
   npm run seed
   ```

3. **Verificar con Prisma Studio** (opcional):
   ```bash
   npm run prisma:studio
   ```

---

**Error SASL corregido y verificación de conexión implementada! ✅**
