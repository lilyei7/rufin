import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed ejecutado');
  console.log('✅ Base de datos lista. Usa "npx tsx prisma/migrate-data.ts" para cargar datos iniciales');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
