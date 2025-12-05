import app from './app';
import prisma from './prisma/client';

const PORT = process.env.PORT || 4000;

// Verificar conexión a la base de datos al iniciar
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

const server = app.listen(PORT, async () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📦 Entorno: ${process.env.NODE_ENV || 'development'}`);

  // Verificar conexión a DB
  await checkDatabaseConnection();
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM recibido. Cerrando servidor...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT recibido. Cerrando servidor...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Servidor cerrado correctamente');
    process.exit(0);
  });
});
