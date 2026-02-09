-- CreateEnum
CREATE TYPE "SettlementMode" AS ENUM ('PLATFORM_COLLECT', 'SELLER_DIRECT');

-- CreateTable
CREATE TABLE "platform_gateways" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "settlement_mode" "SettlementMode" NOT NULL DEFAULT 'PLATFORM_COLLECT',
    "fee_percent" DECIMAL(5,2),
    "supported_currencies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_enabled_globally" BOOLEAN NOT NULL DEFAULT true,
    "seller_can_toggle" BOOLEAN NOT NULL DEFAULT true,
    "default_enabled_for_new_sellers" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_gateways_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_gateway_preferences" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "gateway_id" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_gateway_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "platform_gateways_is_enabled_globally_sort_order_idx" ON "platform_gateways"("is_enabled_globally", "sort_order");

-- CreateIndex
CREATE INDEX "seller_gateway_preferences_seller_id_idx" ON "seller_gateway_preferences"("seller_id");

-- CreateIndex
CREATE INDEX "seller_gateway_preferences_gateway_id_idx" ON "seller_gateway_preferences"("gateway_id");

-- CreateIndex
CREATE UNIQUE INDEX "seller_gateway_preferences_seller_id_gateway_id_key" ON "seller_gateway_preferences"("seller_id", "gateway_id");

-- AddForeignKey
ALTER TABLE "seller_gateway_preferences" ADD CONSTRAINT "seller_gateway_preferences_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_gateway_preferences" ADD CONSTRAINT "seller_gateway_preferences_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "platform_gateways"("id") ON DELETE CASCADE ON UPDATE CASCADE;
