-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'EUR', 'UAH', 'RUB', 'IRR');

-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('AUTO_KEY', 'MANUAL');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('draft', 'active', 'inactive');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'draft',
    "delivery_type" "DeliveryType" NOT NULL,
    "category_id" TEXT,
    "title" TEXT,
    "description" TEXT,
    "price_amount" INTEGER,
    "currency" "Currency",
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_auto_key_configs" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "key_pool_id" TEXT,
    "auto_delivery" BOOLEAN NOT NULL DEFAULT true,
    "stock_alert" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_auto_key_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_manual_delivery_configs" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "delivery_instructions" TEXT,
    "estimated_delivery_sla" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_manual_delivery_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- CreateIndex
CREATE INDEX "categories_is_active_idx" ON "categories"("is_active");

-- CreateIndex
CREATE INDEX "categories_sort_order_idx" ON "categories"("sort_order");

-- CreateIndex
CREATE INDEX "categories_is_active_parent_id_idx" ON "categories"("is_active", "parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_parent_id_key" ON "categories"("slug", "parent_id");

-- CreateIndex
CREATE INDEX "products_seller_id_status_idx" ON "products"("seller_id", "status");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "products_status_published_at_idx" ON "products"("status", "published_at");

-- CreateIndex
CREATE UNIQUE INDEX "product_auto_key_configs_product_id_key" ON "product_auto_key_configs"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_manual_delivery_configs_product_id_key" ON "product_manual_delivery_configs"("product_id");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_auto_key_configs" ADD CONSTRAINT "product_auto_key_configs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_manual_delivery_configs" ADD CONSTRAINT "product_manual_delivery_configs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
