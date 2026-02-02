import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating old variants with delivery capabilities...\n');

  // Count variants that need updating (those without WOW-GT prefix which are the new ones)
  const oldVariants = await prisma.catalogVariant.findMany({
    where: {
      NOT: {
        sku: {
          startsWith: 'WOW-GT',
        },
      },
    },
    select: { id: true, sku: true },
  });

  console.log(`Found ${oldVariants.length} old variants to update:`);
  oldVariants.forEach(v => console.log(`  - ${v.sku}`));
  console.log();

  // Update all old variants (those that don't start with WOW-GT)
  const result = await prisma.catalogVariant.updateMany({
    where: {
      NOT: {
        sku: {
          startsWith: 'WOW-GT',
        },
      },
    },
    data: {
      supportsAutoKey: true,
      supportsManual: true,
    },
  });

  console.log(`✅ Updated ${result.count} variants with default delivery capabilities\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
