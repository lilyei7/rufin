import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Base de datos lista para usar');
  console.log('✅ Usa el comando "npx tsx prisma/migrate-data.ts" para cargar datos iniciales desde JSON');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
