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
