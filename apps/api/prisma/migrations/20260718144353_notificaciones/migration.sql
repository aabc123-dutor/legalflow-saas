-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('DOCUMENTO_SUBIDO', 'DOCUMENTO_COMPARTIDO', 'FACTURA_EMITIDA', 'HITO_PROXIMO', 'FACTURA_POR_VENCER', 'FACTURA_VENCIDA');

-- AlterEnum
ALTER TYPE "FrecuenciaGasto" ADD VALUE 'CUATRIMESTRAL';

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "despacho_id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "destinatario_email" TEXT NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" TEXT,
    "asunto" TEXT NOT NULL,
    "enviado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notificaciones_despacho_id_enviado_en_idx" ON "notificaciones"("despacho_id", "enviado_en");

-- CreateIndex
CREATE INDEX "notificaciones_tipo_entidad_id_idx" ON "notificaciones"("tipo", "entidad_id");

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_despacho_id_fkey" FOREIGN KEY ("despacho_id") REFERENCES "despachos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
