-- Refactor SellerProfile for proper identity management
-- Separate seller display name from public store name
-- Add slug change tracking and remove unused fields

-- Add new columns (nullable first for migration)
ALTER TABLE "seller_profiles" ADD COLUMN "seller_display_name" TEXT;
ALTER TABLE "seller_profiles" ADD COLUMN "store_name" TEXT;
ALTER TABLE "seller_profiles" ADD COLUMN "slug_change_count" INTEGER DEFAULT 0;
ALTER TABLE "seller_profiles" ADD COLUMN "slug_changed_at" TIMESTAMP(3);
ALTER TABLE "seller_profiles" ADD COLUMN "previous_slugs" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Migrate data: copy displayName to both new fields
UPDATE "seller_profiles" 
SET 
  "seller_display_name" = "display_name",
  "store_name" = "display_name",
  "slug_change_count" = 0,
  "previous_slugs" = ARRAY[]::TEXT[];

-- Make new columns NOT NULL
ALTER TABLE "seller_profiles" ALTER COLUMN "seller_display_name" SET NOT NULL;
ALTER TABLE "seller_profiles" ALTER COLUMN "store_name" SET NOT NULL;
ALTER TABLE "seller_profiles" ALTER COLUMN "slug_change_count" SET NOT NULL;
ALTER TABLE "seller_profiles" ALTER COLUMN "slug_change_count" SET DEFAULT 0;

-- Drop old columns
ALTER TABLE "seller_profiles" DROP COLUMN "display_name";
ALTER TABLE "seller_profiles" DROP COLUMN "support_response_time";
ALTER TABLE "seller_profiles" DROP COLUMN "languages";

-- Drop the enum type (only if no other tables use it)
DROP TYPE IF EXISTS "SupportResponseTime";
