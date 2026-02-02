-- CreateEnum for KeyAuditAction
CREATE TYPE "KeyAuditAction" AS ENUM ('UPLOAD', 'EDIT', 'INVALIDATE', 'REVEAL');

-- CreateTable: key_audit_logs
CREATE TABLE "key_audit_logs" (
    "id" TEXT NOT NULL,
    "key_id" TEXT NOT NULL,
    "pool_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "action" "KeyAuditAction" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "key_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: For efficient key listing with filters
CREATE INDEX "keys_pool_id_status_created_at_idx" ON "keys"("pool_id", "status", "created_at");

-- CreateIndex: Key audit log indexes
CREATE INDEX "key_audit_logs_key_id_idx" ON "key_audit_logs"("key_id");
CREATE INDEX "key_audit_logs_pool_id_created_at_idx" ON "key_audit_logs"("pool_id", "created_at");
CREATE INDEX "key_audit_logs_seller_id_created_at_idx" ON "key_audit_logs"("seller_id", "created_at");

-- AddForeignKey
ALTER TABLE "key_audit_logs" ADD CONSTRAINT "key_audit_logs_key_id_fkey" FOREIGN KEY ("key_id") REFERENCES "keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
