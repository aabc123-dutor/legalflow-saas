-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "despacho_id" TEXT;

-- CreateIndex
CREATE INDEX "audit_logs_despacho_id_created_at_idx" ON "audit_logs"("despacho_id", "created_at");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_despacho_id_fkey" FOREIGN KEY ("despacho_id") REFERENCES "despachos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
