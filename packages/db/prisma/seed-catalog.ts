import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding catalog data...');

  // Create parent category: Games
  // First try to find existing category
  let gamesCategory = await prisma.category.findFirst({
    where: {
      slug: 'games',
      parentId: null,
    },
  });

  if (!gamesCategory) {
    gamesCategory = await prisma.category.create({
      data: {
        name: 'Games',
        slug: 'games',
        isActive: true,
        sortOrder: 1,
      },
    });
  }

  console.log(`✓ Created/updated parent category: ${gamesCategory.name}`);

  // Create child category: World of Warcraft
  let wowCategory = await prisma.category.findFirst({
    where: {
      slug: 'world-of-warcraft',
      parentId: gamesCategory.id,
    },
  });

  if (!wowCategory) {
    wowCategory = await prisma.category.create({
      data: {
        name: 'World of Warcraft',
        slug: 'world-of-warcraft',
        parentId: gamesCategory.id,
        isActive: true,
        sortOrder: 1,
      },
    });
  }

  console.log(`✓ Created/updated child category: ${wowCategory.name}`);

  // Create catalog product: WoW Game Time
  let wowGameTime = await prisma.catalogProduct.findFirst({
    where: {
      categoryId: wowCategory.id,
      slug: 'wow-game-time',
    },
  });

  if (!wowGameTime) {
    wowGameTime = await prisma.catalogProduct.create({
      data: {
        categoryId: wowCategory.id,
        name: 'World of Warcraft - Game Time',
        slug: 'wow-game-time',
        description:
          'World of Warcraft game time subscription. Get access to WoW Classic, Burning Crusade Classic, and more.',
        imageUrl: 'https://images.blz-contentstack.com/v3/assets/blt3452e3b114fab0cd/bltc965e5d9a3589617/wow-icon.png',
        isActive: true,
        sortOrder: 1,
      },
    });
  }

  console.log(`✓ Created/updated catalog product: ${wowGameTime.name}`);

  // Create variants for WoW Game Time
  const variants = [
    {
      region: 'EU',
      durationDays: 30,
      edition: null,
      sku: 'WOW-EU-30D',
      sortOrder: 1,
    },
    {
      region: 'EU',
      durationDays: 60,
      edition: null,
      sku: 'WOW-EU-60D',
      sortOrder: 2,
    },
    {
      region: 'EU',
      durationDays: 90,
      edition: null,
      sku: 'WOW-EU-90D',
      sortOrder: 3,
    },
    {
      region: 'US',
      durationDays: 30,
      edition: null,
      sku: 'WOW-US-30D',
      sortOrder: 4,
    },
    {
      region: 'US',
      durationDays: 60,
      edition: null,
      sku: 'WOW-US-60D',
      sortOrder: 5,
    },
    {
      region: 'US',
      durationDays: 90,
      edition: null,
      sku: 'WOW-US-90D',
      sortOrder: 6,
    },
    {
      region: 'GLOBAL',
      durationDays: 30,
      edition: null,
      sku: 'WOW-GLOBAL-30D',
      sortOrder: 7,
    },
  ];

  for (const variant of variants) {
    await prisma.catalogVariant.upsert({
      where: {
        sku: variant.sku,
      },
      update: {},
      create: {
        productId: wowGameTime.id,
        region: variant.region as any,
        durationDays: variant.durationDays,
        edition: variant.edition,
        sku: variant.sku,
        isActive: true,
        sortOrder: variant.sortOrder,
      },
    });

    console.log(`✓ Created/updated variant: ${variant.sku}`);
  }

  console.log('✅ Catalog seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
