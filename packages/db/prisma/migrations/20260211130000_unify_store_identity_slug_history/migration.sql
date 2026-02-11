-- Unify Store Identity: slug IS the public identity
-- Remove storeName, add StoreSlugHistory table, drop previousSlugs array

-- 1) Create StoreSlugHistory table
CREATE TABLE "store_slug_history" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_slug_history_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "store_slug_history_slug_key" ON "store_slug_history"("slug");
CREATE INDEX "store_slug_history_slug_idx" ON "store_slug_history"("slug");
CREATE INDEX "store_slug_history_seller_id_idx" ON "store_slug_history"("seller_id");

ALTER TABLE "store_slug_history" ADD CONSTRAINT "store_slug_history_seller_id_fkey"
    FOREIGN KEY ("seller_id") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2) Migrate existing previousSlugs array into the history table
INSERT INTO "store_slug_history" ("id", "seller_id", "slug", "created_at")
SELECT
    gen_random_uuid(),
    sp.id,
    unnest(sp.previous_slugs),
    sp.created_at
FROM "seller_profiles" sp
WHERE array_length(sp.previous_slugs, 1) > 0;

-- 3) Drop the previousSlugs column and storeName column
ALTER TABLE "seller_profiles" DROP COLUMN IF EXISTS "previous_slugs";
ALTER TABLE "seller_profiles" DROP COLUMN IF EXISTS "store_name";
