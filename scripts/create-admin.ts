/**
 * Script para crear usuario administrador
 *
 * Uso: npx ts-node scripts/create-admin.ts
 *
 * También puedes pasar parámetros:
 * npx ts-node scripts/create-admin.ts --email=admin@korvalia.com --password=tu_password --name="Admin"
 */

import { PrismaClient } from '../src/generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Configuración por defecto (cambiar antes de ejecutar)
const DEFAULT_CONFIG = {
  email: 'admin@korvalia.com',
  password: 'Admin123!',  // ⚠️ CAMBIAR EN PRODUCCIÓN
  name: 'Administrador',
  isSuper: true,
};

async function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };

  for (const arg of args) {
    if (arg.startsWith('--email=')) {
      config.email = arg.split('=')[1];
    } else if (arg.startsWith('--password=')) {
      config.password = arg.split('=')[1];
    } else if (arg.startsWith('--name=')) {
      config.name = arg.split('=')[1];
    }
  }

  return config;
}

async function createAdmin() {
  const config = await parseArgs();

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  CREACIÓN DE USUARIO ADMINISTRADOR - KORVALIA');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  try {
    // Verificar si ya existe el usuario
    const existingUser = await prisma.adminUser.findUnique({
      where: { email: config.email },
    });

    if (existingUser) {
      console.log(`⚠️  Ya existe un usuario con el email: ${config.email}`);
      console.log('');
      console.log('Opciones:');
      console.log('  1. Usar otro email: --email=otro@email.com');
      console.log('  2. Eliminar el usuario existente manualmente');
      console.log('');
      process.exit(1);
    }

    // Validar contraseña
    if (config.password.length < 6) {
      console.log('❌ La contraseña debe tener al menos 6 caracteres');
      process.exit(1);
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(config.password, 10);

    // Crear usuario
    const user = await prisma.adminUser.create({
      data: {
        email: config.email,
        password: hashedPassword,
        name: config.name,
        isSuper: config.isSuper,
      },
    });

    console.log('✅ Usuario administrador creado correctamente');
    console.log('');
    console.log('───────────────────────────────────────────────────────────');
    console.log('  DATOS DE ACCESO');
    console.log('───────────────────────────────────────────────────────────');
    console.log(`  Email:      ${config.email}`);
    console.log(`  Contraseña: ${config.password}`);
    console.log(`  Nombre:     ${config.name}`);
    console.log(`  Super:      ${config.isSuper ? 'Sí' : 'No'}`);
    console.log('───────────────────────────────────────────────────────────');
    console.log('');
    console.log('⚠️  IMPORTANTE: Guarda estos datos en un lugar seguro');
    console.log('    y cambia la contraseña después del primer acceso.');
    console.log('');
    console.log('  URL de acceso: https://tu-dominio.com/admin/login');
    console.log('');

  } catch (error) {
    console.error('❌ Error al crear el usuario:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
