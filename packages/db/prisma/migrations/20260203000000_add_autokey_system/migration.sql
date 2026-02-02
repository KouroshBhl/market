-- CreateEnum for KeyStatus
CREATE TYPE "KeyStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'DELIVERED', 'INVALID');

-- CreateEnum for OrderStatus
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'FULFILLED', 'CANCELED');

-- AlterTable: offers - add unique constraint to key_pool_id
ALTER TABLE "offers" ADD CONSTRAINT "offers_key_pool_id_key" UNIQUE ("key_pool_id");

-- CreateTable: key_pools
CREATE TABLE "key_pools" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "key_pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable: keys
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

-- CreateTable: orders
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "key_pools_seller_id_idx" ON "key_pools"("seller_id");

-- CreateIndex
CREATE UNIQUE INDEX "keys_code_hash_key" ON "keys"("code_hash");

-- CreateIndex
CREATE INDEX "keys_pool_id_status_idx" ON "keys"("pool_id", "status");

-- CreateIndex
CREATE INDEX "keys_order_id_idx" ON "keys"("order_id");

-- CreateIndex
CREATE INDEX "orders_buyer_id_idx" ON "orders"("buyer_id");

-- CreateIndex
CREATE INDEX "orders_offer_id_idx" ON "orders"("offer_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_key_pool_id_fkey" FOREIGN KEY ("key_pool_id") REFERENCES "key_pools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keys" ADD CONSTRAINT "keys_pool_id_fkey" FOREIGN KEY ("pool_id") REFERENCES "key_pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keys" ADD CONSTRAINT "keys_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
