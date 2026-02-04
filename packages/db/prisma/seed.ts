import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Parent categories
const PARENTS = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Games', slug: 'games', sortOrder: 10 },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Gift Cards', slug: 'gift-cards', sortOrder: 20 },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Software', slug: 'software', sortOrder: 30 },
  { id: '00000000-0000-0000-0000-000000000004', name: 'Services', slug: 'services', sortOrder: 40 },
] as const;

// Child categories
const CHILDREN = [
  // Games
  { id: '10000000-0000-0000-0000-000000000001', parentId: PARENTS[0].id, name: 'World of Warcraft', slug: 'world-of-warcraft', sortOrder: 10 },
  { id: '10000000-0000-0000-0000-000000000002', parentId: PARENTS[0].id, name: 'League of Legends', slug: 'league-of-legends', sortOrder: 20 },
  { id: '10000000-0000-0000-0000-000000000003', parentId: PARENTS[0].id, name: 'Counter-Strike 2', slug: 'counter-strike-2', sortOrder: 30 },
  { id: '10000000-0000-0000-0000-000000000004', parentId: PARENTS[0].id, name: 'Valorant', slug: 'valorant', sortOrder: 40 },
  { id: '10000000-0000-0000-0000-000000000005', parentId: PARENTS[0].id, name: 'Fortnite', slug: 'fortnite', sortOrder: 50 },
  
  // Gift Cards
  { id: '20000000-0000-0000-0000-000000000001', parentId: PARENTS[1].id, name: 'Steam', slug: 'steam', sortOrder: 10 },
  { id: '20000000-0000-0000-0000-000000000002', parentId: PARENTS[1].id, name: 'PlayStation', slug: 'playstation', sortOrder: 20 },
  { id: '20000000-0000-0000-0000-000000000003', parentId: PARENTS[1].id, name: 'Xbox', slug: 'xbox', sortOrder: 30 },
  { id: '20000000-0000-0000-0000-000000000004', parentId: PARENTS[1].id, name: 'Apple', slug: 'apple', sortOrder: 40 },
  { id: '20000000-0000-0000-0000-000000000005', parentId: PARENTS[1].id, name: 'Google Play', slug: 'google-play', sortOrder: 50 },
  { id: '20000000-0000-0000-0000-000000000006', parentId: PARENTS[1].id, name: 'Netflix', slug: 'netflix', sortOrder: 60 },
  
  // Software
  { id: '30000000-0000-0000-0000-000000000001', parentId: PARENTS[2].id, name: 'Windows', slug: 'windows', sortOrder: 10 },
  { id: '30000000-0000-0000-0000-000000000002', parentId: PARENTS[2].id, name: 'Microsoft Office', slug: 'microsoft-office', sortOrder: 20 },
  { id: '30000000-0000-0000-0000-000000000003', parentId: PARENTS[2].id, name: 'Adobe Creative Cloud', slug: 'adobe-creative-cloud', sortOrder: 30 },
  { id: '30000000-0000-0000-0000-000000000004', parentId: PARENTS[2].id, name: 'Antivirus Software', slug: 'antivirus-software', sortOrder: 40 },
  
  // Services
  { id: '40000000-0000-0000-0000-000000000001', parentId: PARENTS[3].id, name: 'Game Coaching', slug: 'game-coaching', sortOrder: 10 },
  { id: '40000000-0000-0000-0000-000000000002', parentId: PARENTS[3].id, name: 'Account Leveling', slug: 'account-leveling', sortOrder: 20 },
  { id: '40000000-0000-0000-0000-000000000003', parentId: PARENTS[3].id, name: 'Rank Boosting', slug: 'rank-boosting', sortOrder: 30 },
  { id: '40000000-0000-0000-0000-000000000004', parentId: PARENTS[3].id, name: 'Custom Artwork', slug: 'custom-artwork', sortOrder: 40 },
] as const;

// Catalog Products - WoW Game Time
const WOW_CATEGORY_ID = '10000000-0000-0000-0000-000000000001'; // World of Warcraft
const CATALOG_PRODUCTS = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    categoryId: WOW_CATEGORY_ID,
    name: 'WoW Game Time',
    slug: 'wow-game-time',
    description: 'World of Warcraft game time subscription',
    imageUrl: 'https://placehold.co/400x300/1e293b/94a3b8?text=WoW+Game+Time',
    isActive: true,
    sortOrder: 10,
  },
] as const;

// Catalog Variants - Different durations and regions
const CATALOG_VARIANTS = [
  // WoW Game Time EU - 60 days: supports both auto_key and manual
  {
    id: 'v0000000-0000-0000-0000-000000000001',
    productId: CATALOG_PRODUCTS[0].id,
    region: 'EU' as const,
    durationDays: 60,
    edition: null,
    sku: 'WOW-GT-EU-60D',
    supportsAutoKey: true,  // Has automated key delivery
    supportsManual: true,   // Also supports manual delivery
    isActive: true,
    sortOrder: 10,
  },
  // WoW Game Time EU - 30 days: supports manual only (no auto-key available)
  {
    id: 'v0000000-0000-0000-0000-000000000002',
    productId: CATALOG_PRODUCTS[0].id,
    region: 'EU' as const,
    durationDays: 30,
    edition: null,
    sku: 'WOW-GT-EU-30D',
    supportsAutoKey: false, // No automated key delivery
    supportsManual: true,   // Manual delivery only
    isActive: true,
    sortOrder: 20,
  },
  // WoW Game Time US - 60 days: supports both
  {
    id: 'v0000000-0000-0000-0000-000000000003',
    productId: CATALOG_PRODUCTS[0].id,
    region: 'US' as const,
    durationDays: 60,
    edition: null,
    sku: 'WOW-GT-US-60D',
    supportsAutoKey: true,
    supportsManual: true,
    isActive: true,
    sortOrder: 30,
  },
  // WoW Game Time US - 30 days: supports manual only
  {
    id: 'v0000000-0000-0000-0000-000000000004',
    productId: CATALOG_PRODUCTS[0].id,
    region: 'US' as const,
    durationDays: 30,
    edition: null,
    sku: 'WOW-GT-US-30D',
    supportsAutoKey: false,
    supportsManual: true,
    isActive: true,
    sortOrder: 40,
  },
  // WoW Game Time GLOBAL - 90 days: auto-key only (example of automated-only variant)
  {
    id: 'v0000000-0000-0000-0000-000000000005',
    productId: CATALOG_PRODUCTS[0].id,
    region: 'GLOBAL' as const,
    durationDays: 90,
    edition: null,
    sku: 'WOW-GT-GLOBAL-90D',
    supportsAutoKey: true,
    supportsManual: false,  // Only automated delivery
    isActive: true,
    sortOrder: 50,
  },
] as const;

/**
 * Validate category depth (max 2 levels: parent -> child)
 * This is application-level validation since Prisma can't enforce depth easily
 */
async function validateCategoryDepth(categoryId: string): Promise<void> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { parent: true },
  });

  if (!category) return;

  // If this category has a parent, check that parent has no parent
  if (category.parentId && category.parent?.parentId) {
    throw new Error(
      `Category depth violation: Cannot create category deeper than 2 levels. ` +
      `Category "${category.name}" has parent "${category.parent.name}" which already has a parent.`
    );
  }
}

async function main() {
  console.log('🌱 Seeding database...\n');

  // Create parent categories
  console.log('📁 Creating parent categories...');
  for (const parent of PARENTS) {
    await prisma.category.upsert({
      where: { id: parent.id },
      update: {
        name: parent.name,
        slug: parent.slug,
        sortOrder: parent.sortOrder,
        isActive: true,
      },
      create: {
        id: parent.id,
        name: parent.name,
        slug: parent.slug,
        sortOrder: parent.sortOrder,
        isActive: true,
      },
    });
    console.log(`  ✓ ${parent.name}`);
  }

  // Create child categories
  console.log('\n📄 Creating child categories...');
  for (const child of CHILDREN) {
    // Validate depth before creating
    if (child.parentId) {
      await validateCategoryDepth(child.parentId);
    }

    await prisma.category.upsert({
      where: { id: child.id },
      update: {
        name: child.name,
        slug: child.slug,
        sortOrder: child.sortOrder,
        parentId: child.parentId,
        isActive: true,
      },
      create: {
        id: child.id,
        name: child.name,
        slug: child.slug,
        sortOrder: child.sortOrder,
        parentId: child.parentId,
        isActive: true,
      },
    });
    console.log(`  ✓ ${child.name}`);
  }

  // Create catalog products
  console.log('\n📦 Creating catalog products...');
  const productIdMap = new Map<string, string>(); // old ID -> actual ID
  
  for (const product of CATALOG_PRODUCTS) {
    const existing = await prisma.catalogProduct.findFirst({
      where: {
        categoryId: product.categoryId,
        slug: product.slug,
      },
    });

    let actualProduct;
    if (existing) {
      actualProduct = await prisma.catalogProduct.update({
        where: { id: existing.id },
        data: {
          name: product.name,
          description: product.description,
          imageUrl: product.imageUrl,
          isActive: product.isActive,
          sortOrder: product.sortOrder,
        },
      });
    } else {
      actualProduct = await prisma.catalogProduct.create({
        data: {
          id: product.id,
          categoryId: product.categoryId,
          name: product.name,
          slug: product.slug,
          description: product.description,
          imageUrl: product.imageUrl,
          isActive: product.isActive,
          sortOrder: product.sortOrder,
        },
      });
    }
    productIdMap.set(product.id, actualProduct.id);
    console.log(`  ✓ ${product.name}`);
  }

  // Create catalog variants
  console.log('\n🎯 Creating catalog variants...');
  for (const variant of CATALOG_VARIANTS) {
    const actualProductId = productIdMap.get(variant.productId) || variant.productId;
    
    await prisma.catalogVariant.upsert({
      where: { id: variant.id },
      update: {
        productId: actualProductId,
        region: variant.region,
        durationDays: variant.durationDays,
        edition: variant.edition,
        sku: variant.sku,
        supportsAutoKey: variant.supportsAutoKey,
        supportsManual: variant.supportsManual,
        isActive: variant.isActive,
        sortOrder: variant.sortOrder,
      },
      create: {
        id: variant.id,
        productId: actualProductId,
        region: variant.region,
        durationDays: variant.durationDays,
        edition: variant.edition,
        sku: variant.sku,
        supportsAutoKey: variant.supportsAutoKey,
        supportsManual: variant.supportsManual,
        isActive: variant.isActive,
        sortOrder: variant.sortOrder,
      },
    });
    const deliveryMethods = [];
    if (variant.supportsAutoKey) deliveryMethods.push('auto-key');
    if (variant.supportsManual) deliveryMethods.push('manual');
    console.log(`  ✓ ${variant.sku} (${deliveryMethods.join(', ')})`);
  }

  // Create platform settings (single-row table)
  console.log('\n⚙️  Creating platform settings...');
  
  // Clean up old key-value pattern rows if they exist
  try {
    const oldRows = await prisma.platformSettings.findMany();
    if (oldRows.length > 1) {
      console.log(`  ⚠️  Found ${oldRows.length} settings rows. Cleaning up...`);
      // Delete all existing rows
      await prisma.platformSettings.deleteMany({});
    }
  } catch (error) {
    // Ignore errors during cleanup (e.g., if column doesn't exist yet)
  }

  // Ensure exactly one settings row exists
  const existingSettings = await prisma.platformSettings.findFirst();
  
  if (existingSettings) {
    // Update existing row
    await prisma.platformSettings.update({
      where: { id: existingSettings.id },
      data: {
        platformFeeBps: 300, // 3.00%
      },
    });
    console.log('  ✓ Platform fee updated: 300 bps (3.00%)');
  } else {
    // Create the single settings row
    await prisma.platformSettings.create({
      data: {
        platformFeeBps: 300, // 3.00%
      },
    });
    console.log('  ✓ Platform fee created: 300 bps (3.00%)');
  }

  // Verify counts
  const parentCount = await prisma.category.count({
    where: { parentId: null },
  });
  const childCount = await prisma.category.count({
    where: { parentId: { not: null } },
  });
  const productCount = await prisma.catalogProduct.count();
  const variantCount = await prisma.catalogVariant.count();

  console.log('\n✅ Seeding complete!');
  console.log(`   • ${parentCount} parent categories`);
  console.log(`   • ${childCount} child categories`);
  console.log(`   • ${productCount} catalog products`);
  console.log(`   • ${variantCount} catalog variants`);
  console.log(`   • ${parentCount + childCount} total categories`);
  console.log(`   • Platform fee configured: 3%\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
