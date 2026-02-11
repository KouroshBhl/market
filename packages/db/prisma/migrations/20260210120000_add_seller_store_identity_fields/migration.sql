-- CreateEnum
CREATE TYPE "SupportResponseTime" AS ENUM ('UNDER_15_MIN', 'UNDER_1_HOUR', 'UNDER_24_HOURS');

-- AlterTable: Add new columns (nullable first to handle existing data)
ALTER TABLE "seller_profiles" ADD COLUMN "slug" TEXT;
ALTER TABLE "seller_profiles" ADD COLUMN "logo_url" TEXT;
ALTER TABLE "seller_profiles" ADD COLUMN "bio" TEXT;
ALTER TABLE "seller_profiles" ADD COLUMN "support_response_time" "SupportResponseTime";
ALTER TABLE "seller_profiles" ADD COLUMN "timezone" TEXT;
ALTER TABLE "seller_profiles" ADD COLUMN "languages" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Generate slugs from existing display names
-- Convert to lowercase, replace spaces with hyphens, remove special chars
UPDATE "seller_profiles" 
SET "slug" = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE("display_name", '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  )
)
WHERE "slug" IS NULL;

-- Handle duplicate slugs by appending a unique suffix
WITH ranked_slugs AS (
  SELECT 
    id,
    slug,
    ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) as rn
  FROM "seller_profiles"
)
UPDATE "seller_profiles" sp
SET slug = CONCAT(rs.slug, '-', rs.rn)
FROM ranked_slugs rs
WHERE sp.id = rs.id AND rs.rn > 1;

-- Now make slug NOT NULL and UNIQUE
ALTER TABLE "seller_profiles" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "seller_profiles_slug_key" ON "seller_profiles"("slug");
CREATE INDEX "seller_profiles_slug_idx" ON "seller_profiles"("slug");
