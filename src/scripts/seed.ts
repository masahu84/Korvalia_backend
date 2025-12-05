import { createAdminUser } from '../services/auth.service';
import { getSettings } from '../services/settings.service';
import prisma from '../prisma/client';

/**
 * Script de seed para inicializar la base de datos
 */
async function seed() {
  try {
    console.log('🌱 Iniciando seed de la base de datos...\n');

    // 1. Crear usuario admin si no existe
    console.log('👤 Verificando usuario admin...');
    const existingAdmin = await prisma.adminUser.findFirst({
      where: { email: 'admin@korvalia.com' },
    });

    if (!existingAdmin) {
      const admin = await createAdminUser({
        name: 'Administrador',
        email: 'admin@korvalia.com',
        password: 'admin123', // CAMBIAR EN PRODUCCIÓN
        isSuper: true,
      });
      console.log('✅ Usuario admin creado:', admin.email);
      console.log('   Email: admin@korvalia.com');
      console.log('   Password: admin123');
      console.log('   ⚠️  IMPORTANTE: Cambiar la contraseña después del primer login\n');
    } else {
      console.log('✅ Usuario admin ya existe:', existingAdmin.email, '\n');
    }

    // 2. Verificar/crear configuración de la compañía
    console.log('⚙️  Verificando configuración de la compañía...');
    const settings = await getSettings();
    console.log('✅ Configuración inicializada:', settings.heroTitle, '\n');

    // 3. Crear algunas ciudades de ejemplo si no existen
    console.log('🏙️  Verificando ciudades de ejemplo...');
    const citiesCount = await prisma.city.count();

    if (citiesCount === 0) {
      const exampleCities = [
        { name: 'Madrid', slug: 'madrid', province: 'Madrid' },
        { name: 'Barcelona', slug: 'barcelona', province: 'Barcelona' },
        { name: 'Valencia', slug: 'valencia', province: 'Valencia' },
        { name: 'Sevilla', slug: 'sevilla', province: 'Sevilla' },
      ];

      for (const city of exampleCities) {
        await prisma.city.create({ data: city });
        console.log(`  ✅ Ciudad creada: ${city.name}`);
      }
      console.log('');
    } else {
      console.log(`✅ Ya existen ${citiesCount} ciudades en la base de datos\n`);
    }

    console.log('🎉 Seed completado exitosamente!\n');
    console.log('📝 Próximos pasos:');
    console.log('   1. Accede con: admin@korvalia.com / admin123');
    console.log('   2. Cambia la contraseña del admin');
    console.log('   3. Configura los datos de la compañía en /api/settings');
    console.log('   4. Comienza a agregar propiedades\n');

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en el seed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seed();
