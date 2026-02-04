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

  // ==========================================================================
  // REQUIREMENT TEMPLATES (Admin-defined buyer requirements for manual offers)
  // ==========================================================================
  console.log('\n📋 Creating requirement templates...');

  // Template 1: ACCOUNT_DELIVERY
  // Use case: Netflix, Spotify, streaming accounts where buyer needs credentials
  const accountTemplate = await prisma.requirementTemplate.upsert({
    where: { id: 't0000000-0000-0000-0000-000000000001' },
    update: {
      name: 'Account Delivery',
      description: 'For digital accounts (Netflix, Spotify, etc.) where seller provides credentials',
      isActive: true,
    },
    create: {
      id: 't0000000-0000-0000-0000-000000000001',
      name: 'Account Delivery',
      description: 'For digital accounts (Netflix, Spotify, etc.) where seller provides credentials',
      isActive: true,
    },
  });

  // Fields for Account Delivery template
  await prisma.requirementField.upsert({
    where: { id: 'f0000000-0000-0000-0000-000000000001' },
    update: {
      templateId: accountTemplate.id,
      key: 'buyer_email',
      label: 'Your Email Address',
      type: 'EMAIL',
      required: true,
      helpText: 'We will send account details to this email',
      placeholder: 'buyer@example.com',
      sensitive: true, // Email is sensitive
      sortOrder: 1,
    },
    create: {
      id: 'f0000000-0000-0000-0000-000000000001',
      templateId: accountTemplate.id,
      key: 'buyer_email',
      label: 'Your Email Address',
      type: 'EMAIL',
      required: true,
      helpText: 'We will send account details to this email',
      placeholder: 'buyer@example.com',
      sensitive: true,
      sortOrder: 1,
    },
  });

  await prisma.requirementField.upsert({
    where: { id: 'f0000000-0000-0000-0000-000000000002' },
    update: {
      templateId: accountTemplate.id,
      key: 'preferred_password',
      label: 'Preferred Password (Optional)',
      type: 'TEXT',
      required: false,
      helpText: 'If you want a specific password for the account',
      placeholder: 'Leave blank for auto-generated',
      sensitive: true, // Password is sensitive
      sortOrder: 2,
    },
    create: {
      id: 'f0000000-0000-0000-0000-000000000002',
      templateId: accountTemplate.id,
      key: 'preferred_password',
      label: 'Preferred Password (Optional)',
      type: 'TEXT',
      required: false,
      helpText: 'If you want a specific password for the account',
      placeholder: 'Leave blank for auto-generated',
      sensitive: true,
      sortOrder: 2,
    },
  });

  await prisma.requirementField.upsert({
    where: { id: 'f0000000-0000-0000-0000-000000000003' },
    update: {
      templateId: accountTemplate.id,
      key: 'platform_preference',
      label: 'Platform/Device',
      type: 'SELECT',
      required: true,
      helpText: 'Primary device you will use',
      options: ['Web Browser', 'iOS App', 'Android App', 'Smart TV', 'Game Console'],
      sensitive: false,
      sortOrder: 3,
    },
    create: {
      id: 'f0000000-0000-0000-0000-000000000003',
      templateId: accountTemplate.id,
      key: 'platform_preference',
      label: 'Platform/Device',
      type: 'SELECT',
      required: true,
      helpText: 'Primary device you will use',
      options: ['Web Browser', 'iOS App', 'Android App', 'Smart TV', 'Game Console'],
      sensitive: false,
      sortOrder: 3,
    },
  });

  console.log('  ✓ Account Delivery (3 fields)');

  // Template 2: IN_GAME_CURRENCY
  // Use case: WoW gold, V-Bucks, in-game currency delivery
  const currencyTemplate = await prisma.requirementTemplate.upsert({
    where: { id: 't0000000-0000-0000-0000-000000000002' },
    update: {
      name: 'In-Game Currency Delivery',
      description: 'For delivering in-game currency (gold, credits, etc.) to player accounts',
      isActive: true,
    },
    create: {
      id: 't0000000-0000-0000-0000-000000000002',
      name: 'In-Game Currency Delivery',
      description: 'For delivering in-game currency (gold, credits, etc.) to player accounts',
      isActive: true,
    },
  });

  await prisma.requirementField.upsert({
    where: { id: 'f0000000-0000-0000-0000-000000000011' },
    update: {
      templateId: currencyTemplate.id,
      key: 'player_tag',
      label: 'Player Name/Tag',
      type: 'TEXT',
      required: true,
      helpText: 'Your in-game character or player name',
      placeholder: 'PlayerName#1234',
      validation: { minLength: 3, maxLength: 50 },
      sensitive: false,
      sortOrder: 1,
    },
    create: {
      id: 'f0000000-0000-0000-0000-000000000011',
      templateId: currencyTemplate.id,
      key: 'player_tag',
      label: 'Player Name/Tag',
      type: 'TEXT',
      required: true,
      helpText: 'Your in-game character or player name',
      placeholder: 'PlayerName#1234',
      validation: { minLength: 3, maxLength: 50 },
      sensitive: false,
      sortOrder: 1,
    },
  });

  await prisma.requirementField.upsert({
    where: { id: 'f0000000-0000-0000-0000-000000000012' },
    update: {
      templateId: currencyTemplate.id,
      key: 'server_realm',
      label: 'Server/Realm',
      type: 'TEXT',
      required: true,
      helpText: 'The server or realm where your character exists',
      placeholder: 'EU-Ragnaros',
      sensitive: false,
      sortOrder: 2,
    },
    create: {
      id: 'f0000000-0000-0000-0000-000000000012',
      templateId: currencyTemplate.id,
      key: 'server_realm',
      label: 'Server/Realm',
      type: 'TEXT',
      required: true,
      helpText: 'The server or realm where your character exists',
      placeholder: 'EU-Ragnaros',
      sensitive: false,
      sortOrder: 2,
    },
  });

  await prisma.requirementField.upsert({
    where: { id: 'f0000000-0000-0000-0000-000000000013' },
    update: {
      templateId: currencyTemplate.id,
      key: 'amount_confirmation',
      label: 'Confirm Amount',
      type: 'NUMBER',
      required: true,
      helpText: 'Re-enter the amount of currency you are purchasing to confirm',
      validation: { min: 1 },
      sensitive: false,
      sortOrder: 3,
    },
    create: {
      id: 'f0000000-0000-0000-0000-000000000013',
      templateId: currencyTemplate.id,
      key: 'amount_confirmation',
      label: 'Confirm Amount',
      type: 'NUMBER',
      required: true,
      helpText: 'Re-enter the amount of currency you are purchasing to confirm',
      validation: { min: 1 },
      sensitive: false,
      sortOrder: 3,
    },
  });

  await prisma.requirementField.upsert({
    where: { id: 'f0000000-0000-0000-0000-000000000014' },
    update: {
      templateId: currencyTemplate.id,
      key: 'delivery_notes',
      label: 'Additional Notes (Optional)',
      type: 'TEXTAREA',
      required: false,
      helpText: 'Any special instructions or preferences for delivery',
      placeholder: 'e.g., "I am online between 6-10 PM EST"',
      validation: { maxLength: 500 },
      sensitive: false,
      sortOrder: 4,
    },
    create: {
      id: 'f0000000-0000-0000-0000-000000000014',
      templateId: currencyTemplate.id,
      key: 'delivery_notes',
      label: 'Additional Notes (Optional)',
      type: 'TEXTAREA',
      required: false,
      helpText: 'Any special instructions or preferences for delivery',
      placeholder: 'e.g., "I am online between 6-10 PM EST"',
      validation: { maxLength: 500 },
      sensitive: false,
      sortOrder: 4,
    },
  });

  console.log('  ✓ In-Game Currency Delivery (4 fields)');

  // Template 3: ITEM_DELIVERY
  // Use case: WoW items, CS:GO skins, in-game items/equipment
  const itemTemplate = await prisma.requirementTemplate.upsert({
    where: { id: 't0000000-0000-0000-0000-000000000003' },
    update: {
      name: 'In-Game Item Delivery',
      description: 'For delivering items, equipment, or skins in online games',
      isActive: true,
    },
    create: {
      id: 't0000000-0000-0000-0000-000000000003',
      name: 'In-Game Item Delivery',
      description: 'For delivering items, equipment, or skins in online games',
      isActive: true,
    },
  });

  await prisma.requirementField.upsert({
    where: { id: 'f0000000-0000-0000-0000-000000000021' },
    update: {
      templateId: itemTemplate.id,
      key: 'character_name',
      label: 'Character Name',
      type: 'TEXT',
      required: true,
      helpText: 'The character that will receive the item',
      placeholder: 'MyCharacter',
      validation: { minLength: 2, maxLength: 30 },
      sensitive: false,
      sortOrder: 1,
    },
    create: {
      id: 'f0000000-0000-0000-0000-000000000021',
      templateId: itemTemplate.id,
      key: 'character_name',
      label: 'Character Name',
      type: 'TEXT',
      required: true,
      helpText: 'The character that will receive the item',
      placeholder: 'MyCharacter',
      validation: { minLength: 2, maxLength: 30 },
      sensitive: false,
      sortOrder: 1,
    },
  });

  await prisma.requirementField.upsert({
    where: { id: 'f0000000-0000-0000-0000-000000000022' },
    update: {
      templateId: itemTemplate.id,
      key: 'server_name',
      label: 'Server',
      type: 'TEXT',
      required: true,
      helpText: 'Server where your character is located',
      placeholder: 'US-Illidan',
      sensitive: false,
      sortOrder: 2,
    },
    create: {
      id: 'f0000000-0000-0000-0000-000000000022',
      templateId: itemTemplate.id,
      key: 'server_name',
      label: 'Server',
      type: 'TEXT',
      required: true,
      helpText: 'Server where your character is located',
      placeholder: 'US-Illidan',
      sensitive: false,
      sortOrder: 2,
    },
  });

  await prisma.requirementField.upsert({
    where: { id: 'f0000000-0000-0000-0000-000000000023' },
    update: {
      templateId: itemTemplate.id,
      key: 'trade_method',
      label: 'Preferred Trade Method',
      type: 'SELECT',
      required: true,
      helpText: 'How you want to receive the item',
      options: ['In-Game Mail', 'Face-to-Face Trade', 'Auction House'],
      sensitive: false,
      sortOrder: 3,
    },
    create: {
      id: 'f0000000-0000-0000-0000-000000000023',
      templateId: itemTemplate.id,
      key: 'trade_method',
      label: 'Preferred Trade Method',
      type: 'SELECT',
      required: true,
      helpText: 'How you want to receive the item',
      options: ['In-Game Mail', 'Face-to-Face Trade', 'Auction House'],
      sensitive: false,
      sortOrder: 3,
    },
  });

  await prisma.requirementField.upsert({
    where: { id: 'f0000000-0000-0000-0000-000000000024' },
    update: {
      templateId: itemTemplate.id,
      key: 'availability_window',
      label: 'When are you available? (Optional)',
      type: 'TEXT',
      required: false,
      helpText: 'Time window when you can be online for face-to-face trades',
      placeholder: 'e.g., "Weekdays 7-11 PM CET"',
      validation: { maxLength: 100 },
      sensitive: false,
      sortOrder: 4,
    },
    create: {
      id: 'f0000000-0000-0000-0000-000000000024',
      templateId: itemTemplate.id,
      key: 'availability_window',
      label: 'When are you available? (Optional)',
      type: 'TEXT',
      required: false,
      helpText: 'Time window when you can be online for face-to-face trades',
      placeholder: 'e.g., "Weekdays 7-11 PM CET"',
      validation: { maxLength: 100 },
      sensitive: false,
      sortOrder: 4,
    },
  });

  console.log('  ✓ In-Game Item Delivery (4 fields)');

  // Link one of the templates to a variant (example: WoW 30-day manual-only variant)
  // This shows how admin would assign templates to catalog variants
  await prisma.catalogVariant.update({
    where: { id: 'v0000000-0000-0000-0000-000000000002' }, // WoW EU 30-day manual-only
    data: {
      requirementTemplateId: currencyTemplate.id, // Use currency template for this variant
    },
  });
  console.log('  ✓ Linked "In-Game Currency" template to WoW EU 30-day variant');

  // ============================================
  // SEED USERS & SELLER TEAM (for order assignment)
  // ============================================
  console.log('\n👥 Seeding users and seller team...');

  const demoSellerId = '00000000-0000-0000-0000-000000000001';
  const demoBuyerId = '00000000-0000-0000-0000-000000000002';

  // Create demo users
  const ownerUser = await prisma.user.upsert({
    where: { id: 'u0000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'u0000000-0000-0000-0000-000000000001',
      email: 'owner@seller.com',
      name: 'John Doe (Owner)',
    },
  });

  const staffUser1 = await prisma.user.upsert({
    where: { id: 'u0000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: 'u0000000-0000-0000-0000-000000000002',
      email: 'sarah@seller.com',
      name: 'Sarah Smith',
    },
  });

  const staffUser2 = await prisma.user.upsert({
    where: { id: 'u0000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: 'u0000000-0000-0000-0000-000000000003',
      email: 'mike@seller.com',
      name: 'Mike Johnson',
    },
  });

  // Create seller team members
  await prisma.sellerTeamMember.upsert({
    where: {
      sellerId_userId: {
        sellerId: demoSellerId,
        userId: ownerUser.id,
      },
    },
    update: {},
    create: {
      sellerId: demoSellerId,
      userId: ownerUser.id,
      role: 'OWNER',
    },
  });

  await prisma.sellerTeamMember.upsert({
    where: {
      sellerId_userId: {
        sellerId: demoSellerId,
        userId: staffUser1.id,
      },
    },
    update: {},
    create: {
      sellerId: demoSellerId,
      userId: staffUser1.id,
      role: 'STAFF',
    },
  });

  await prisma.sellerTeamMember.upsert({
    where: {
      sellerId_userId: {
        sellerId: demoSellerId,
        userId: staffUser2.id,
      },
    },
    update: {},
    create: {
      sellerId: demoSellerId,
      userId: staffUser2.id,
      role: 'STAFF',
    },
  });

  console.log('  ✓ 3 users created');
  console.log('  ✓ Seller team: 1 OWNER + 2 STAFF');

  // ============================================
  // SEED SAMPLE ORDERS (for testing Orders UI)
  // ============================================
  console.log('\n📦 Seeding sample orders...');

  // Get some offers to create orders for
  const offers = await prisma.offer.findMany({
    where: { status: 'active' },
    take: 3,
    include: { variant: true },
  });

  if (offers.length > 0) {
    // Order 1: PAID manual order that's OVERDUE (created 2 days ago, 1h SLA)
    const manualOffer = offers.find((o) => o.deliveryType === 'MANUAL') || offers[0];
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    
    await prisma.order.upsert({
      where: { id: 'o0000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: 'o0000000-0000-0000-0000-000000000001',
        buyerId: demoBuyerId,
        sellerId: manualOffer.sellerId,
        offerId: manualOffer.id,
        status: 'PAID',
        basePriceAmount: manualOffer.priceAmount,
        platformFeeBpsSnapshot: 300,
        feeAmount: Math.round((manualOffer.priceAmount * 300) / 10000),
        buyerTotalAmount: manualOffer.priceAmount + Math.round((manualOffer.priceAmount * 300) / 10000),
        currency: manualOffer.currency,
        paidAt: twoDaysAgo,
        createdAt: new Date(twoDaysAgo.getTime() - 60000), // 1 min before paid
        requirementsPayload: {
          server_name: 'EU-Ravencrest',
          character_name: 'TestCharacter123',
        },
      },
    });
    console.log('  ✓ PAID manual order (overdue)');

    // Order 2: PAID auto-key order (ready for fulfillment)
    const autoOffer = offers.find((o) => o.deliveryType === 'AUTO_KEY') || offers[0];
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    await prisma.order.upsert({
      where: { id: 'o0000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: 'o0000000-0000-0000-0000-000000000002',
        buyerId: demoBuyerId,
        sellerId: autoOffer.sellerId,
        offerId: autoOffer.id,
        status: 'PAID',
        basePriceAmount: autoOffer.priceAmount,
        platformFeeBpsSnapshot: 300,
        feeAmount: Math.round((autoOffer.priceAmount * 300) / 10000),
        buyerTotalAmount: autoOffer.priceAmount + Math.round((autoOffer.priceAmount * 300) / 10000),
        currency: autoOffer.currency,
        paidAt: oneHourAgo,
        createdAt: new Date(oneHourAgo.getTime() - 60000),
      },
    });
    console.log('  ✓ PAID auto-key order (ready to fulfill)');

    // Order 3: FULFILLED order
    const fulfilledOffer = offers[0];
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    
    await prisma.order.upsert({
      where: { id: 'o0000000-0000-0000-0000-000000000003' },
      update: {},
      create: {
        id: 'o0000000-0000-0000-0000-000000000003',
        buyerId: demoBuyerId,
        sellerId: fulfilledOffer.sellerId,
        offerId: fulfilledOffer.id,
        status: 'FULFILLED',
        basePriceAmount: fulfilledOffer.priceAmount,
        platformFeeBpsSnapshot: 300,
        feeAmount: Math.round((fulfilledOffer.priceAmount * 300) / 10000),
        buyerTotalAmount: fulfilledOffer.priceAmount + Math.round((fulfilledOffer.priceAmount * 300) / 10000),
        currency: fulfilledOffer.currency,
        paidAt: threeDaysAgo,
        fulfilledAt: new Date(threeDaysAgo.getTime() + 30 * 60 * 1000), // 30 min after paid
        createdAt: new Date(threeDaysAgo.getTime() - 60000),
      },
    });
    console.log('  ✓ FULFILLED order');

    // Order 4: PAID manual order assigned to staff user
    if (manualOffer) {
      const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
      
      await prisma.order.upsert({
        where: { id: 'o0000000-0000-0000-0000-000000000004' },
        update: {},
        create: {
          id: 'o0000000-0000-0000-0000-000000000004',
          buyerId: demoBuyerId,
          sellerId: manualOffer.sellerId,
          offerId: manualOffer.id,
          status: 'PAID',
          basePriceAmount: manualOffer.priceAmount,
          platformFeeBpsSnapshot: 300,
          feeAmount: Math.round((manualOffer.priceAmount * 300) / 10000),
          buyerTotalAmount: manualOffer.priceAmount + Math.round((manualOffer.priceAmount * 300) / 10000),
          currency: manualOffer.currency,
          paidAt: fiveHoursAgo,
          createdAt: new Date(fiveHoursAgo.getTime() - 60000),
          assignedToUserId: staffUser1.id, // Assigned to Sarah
          assignedAt: new Date(fiveHoursAgo.getTime() + 10 * 60 * 1000), // 10 min after paid
          workState: 'IN_PROGRESS',
        },
      });
      console.log('  ✓ PAID manual order (assigned to staff member)');
    }
  }

  const teamMemberCount = await prisma.sellerTeamMember.count();
  const userCount = await prisma.user.count();

  // Verify counts
  const parentCount = await prisma.category.count({
    where: { parentId: null },
  });
  const childCount = await prisma.category.count({
    where: { parentId: { not: null } },
  });
  const productCount = await prisma.catalogProduct.count();
  const variantCount = await prisma.catalogVariant.count();
  const templateCount = await prisma.requirementTemplate.count();
  const fieldCount = await prisma.requirementField.count();
  const orderCount = await prisma.order.count();

  console.log('\n✅ Seeding complete!');
  console.log(`   • ${parentCount} parent categories`);
  console.log(`   • ${childCount} child categories`);
  console.log(`   • ${productCount} catalog products`);
  console.log(`   • ${variantCount} catalog variants`);
  console.log(`   • Platform fee configured: 3%`);
  console.log(`   • ${templateCount} requirement templates`);
  console.log(`   • ${fieldCount} requirement fields`);
  console.log(`   • ${userCount} users`);
  console.log(`   • ${teamMemberCount} seller team members (1 OWNER + 2 STAFF)`);
  console.log(`   • ${orderCount} sample orders`);
  console.log('\n📍 View in Prisma Studio:');
  console.log('   • RequirementTemplate table - see 3 admin-defined templates');
  console.log('   • RequirementField table - see all fields with validation rules');
  console.log('   • CatalogVariant table - check requirementTemplateId FK');
  console.log('   • User table - see 3 demo users');
  console.log('   • SellerTeamMember table - see team members with roles');
  console.log('   • Order table - see sample orders with seller team assignments\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
