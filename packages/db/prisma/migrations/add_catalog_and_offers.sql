-- CreateEnum for Region
CREATE TYPE "Region" AS ENUM ('EU', 'US', 'TR', 'GLOBAL');

-- CreateEnum for OfferStatus
CREATE TYPE "OfferStatus" AS ENUM ('draft', 'active', 'inactive');

-- CreateTable: catalog_products
CREATE TABLE "catalog_products" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable: catalog_variants
CREATE TABLE "catalog_variants" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "duration_days" INTEGER,
    "edition" TEXT,
    "sku" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable: offers
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'draft',
    "delivery_type" "DeliveryType" NOT NULL,
    "price_amount" INTEGER NOT NULL,
    "currency" "Currency" NOT NULL,
    "stock_count" INTEGER,
    "delivery_instructions" TEXT,
    "key_pool_id" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "catalog_products_category_id_slug_key" ON "catalog_products"("category_id", "slug");

-- CreateIndex
CREATE INDEX "catalog_products_category_id_is_active_idx" ON "catalog_products"("category_id", "is_active");

-- CreateIndex
CREATE INDEX "catalog_products_is_active_idx" ON "catalog_products"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_variants_sku_key" ON "catalog_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_variants_product_id_region_duration_days_edition_key" ON "catalog_variants"("product_id", "region", "duration_days", "edition");

-- CreateIndex
CREATE INDEX "catalog_variants_product_id_is_active_idx" ON "catalog_variants"("product_id", "is_active");

-- CreateIndex
CREATE INDEX "catalog_variants_is_active_idx" ON "catalog_variants"("is_active");

-- CreateIndex
CREATE INDEX "offers_seller_id_status_idx" ON "offers"("seller_id", "status");

-- CreateIndex
CREATE INDEX "offers_variant_id_status_idx" ON "offers"("variant_id", "status");

-- CreateIndex
CREATE INDEX "offers_status_published_at_idx" ON "offers"("status", "published_at");

-- AddForeignKey
ALTER TABLE "catalog_products" ADD CONSTRAINT "catalog_products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_variants" ADD CONSTRAINT "catalog_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "catalog_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
