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
  console.log('🌱 Seeding categories...\n');

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

  // Verify counts
  const parentCount = await prisma.category.count({
    where: { parentId: null },
  });
  const childCount = await prisma.category.count({
    where: { parentId: { not: null } },
  });

  console.log('\n✅ Seeding complete!');
  console.log(`   • ${parentCount} parent categories`);
  console.log(`   • ${childCount} child categories`);
  console.log(`   • ${parentCount + childCount} total categories\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
