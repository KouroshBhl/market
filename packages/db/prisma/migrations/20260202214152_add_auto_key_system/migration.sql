-- CreateEnum
CREATE TYPE "Region" AS ENUM ('EU', 'US', 'TR', 'GLOBAL');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('draft', 'active', 'inactive');

-- CreateEnum
CREATE TYPE "KeyStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'DELIVERED', 'INVALID');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'FULFILLED', 'CANCELED');

-- CreateTable
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

-- CreateTable
CREATE TABLE "catalog_variants" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "duration_days" INTEGER,
    "edition" TEXT,
    "sku" TEXT NOT NULL,
    "supports_auto_key" BOOLEAN NOT NULL DEFAULT false,
    "supports_manual" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "key_pools" (
    "id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "key_pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keys" (
    "id" TEXT NOT NULL,
    "pool_id" TEXT NOT NULL,
    "code_encrypted" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "status" "KeyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "reserved_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "order_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "price_amount" INTEGER NOT NULL,
    "currency" "Currency" NOT NULL,
    "delivered_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "catalog_products_category_id_is_active_idx" ON "catalog_products"("category_id", "is_active");

-- CreateIndex
CREATE INDEX "catalog_products_is_active_idx" ON "catalog_products"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_products_category_id_slug_key" ON "catalog_products"("category_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_variants_sku_key" ON "catalog_variants"("sku");

-- CreateIndex
CREATE INDEX "catalog_variants_product_id_is_active_idx" ON "catalog_variants"("product_id", "is_active");

-- CreateIndex
CREATE INDEX "catalog_variants_is_active_idx" ON "catalog_variants"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_variants_product_id_region_duration_days_edition_key" ON "catalog_variants"("product_id", "region", "duration_days", "edition");

-- CreateIndex
CREATE INDEX "offers_seller_id_status_idx" ON "offers"("seller_id", "status");

-- CreateIndex
CREATE INDEX "offers_variant_id_idx" ON "offers"("variant_id");

-- CreateIndex
CREATE INDEX "offers_variant_id_status_idx" ON "offers"("variant_id", "status");

-- CreateIndex
CREATE INDEX "offers_status_published_at_idx" ON "offers"("status", "published_at");

-- CreateIndex
CREATE UNIQUE INDEX "key_pools_offer_id_key" ON "key_pools"("offer_id");

-- CreateIndex
CREATE INDEX "key_pools_seller_id_idx" ON "key_pools"("seller_id");

-- CreateIndex
CREATE INDEX "key_pools_offer_id_is_active_idx" ON "key_pools"("offer_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "keys_code_hash_key" ON "keys"("code_hash");

-- CreateIndex
CREATE INDEX "keys_pool_id_status_idx" ON "keys"("pool_id", "status");

-- CreateIndex
CREATE INDEX "keys_order_id_idx" ON "keys"("order_id");

-- CreateIndex
CREATE INDEX "orders_buyer_id_status_idx" ON "orders"("buyer_id", "status");

-- CreateIndex
CREATE INDEX "orders_offer_id_idx" ON "orders"("offer_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- AddForeignKey
ALTER TABLE "catalog_products" ADD CONSTRAINT "catalog_products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_variants" ADD CONSTRAINT "catalog_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "catalog_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "catalog_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_pools" ADD CONSTRAINT "key_pools_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keys" ADD CONSTRAINT "keys_pool_id_fkey" FOREIGN KEY ("pool_id") REFERENCES "key_pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keys" ADD CONSTRAINT "keys_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
