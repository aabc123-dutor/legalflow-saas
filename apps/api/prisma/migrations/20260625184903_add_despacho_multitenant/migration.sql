/*
  Warnings:

  - You are about to drop the column `usuario_id` on the `clientes` table. All the data in the column will be lost.
  - You are about to drop the column `usuario_id` on the `conversaciones` table. All the data in the column will be lost.
  - You are about to drop the column `usuario_id` on the `documentos` table. All the data in the column will be lost.
  - You are about to drop the column `usuario_id` on the `expedientes` table. All the data in the column will be lost.
  - You are about to drop the column `usuario_id` on the `facturas` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[despacho_id,numero]` on the table `facturas` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RolDespacho" AS ENUM ('OWNER', 'MIEMBRO');

-- CreateTable despachos (movida antes del backfill)
CREATE TABLE "despachos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "plan" "PlanUsuario" NOT NULL DEFAULT 'FREE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "despachos_pkey" PRIMARY KEY ("id")
);

-- DropForeignKey
ALTER TABLE "clientes" DROP CONSTRAINT "clientes_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "conversaciones" DROP CONSTRAINT "conversaciones_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "documentos" DROP CONSTRAINT "documentos_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "expedientes" DROP CONSTRAINT "expedientes_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "facturas" DROP CONSTRAINT "facturas_usuario_id_fkey";

-- DropIndex
DROP INDEX "clientes_usuario_id_idx";

-- DropIndex
DROP INDEX "conversaciones_usuario_id_tipo_idx";

-- DropIndex
DROP INDEX "facturas_usuario_id_fecha_emision_idx";

-- DropIndex
DROP INDEX "facturas_usuario_id_numero_key";

-- AlterTable: añadimos columnas NULLABLE primero (el backfill las rellena después)
ALTER TABLE "clientes" ADD COLUMN "creado_por_id" TEXT,
ADD COLUMN     "despacho_id" TEXT;

ALTER TABLE "conversaciones" ADD COLUMN "creado_por_id" TEXT,
ADD COLUMN     "despacho_id" TEXT;

ALTER TABLE "documentos" ADD COLUMN "creado_por_id" TEXT,
ADD COLUMN     "despacho_id" TEXT;

ALTER TABLE "expedientes" ADD COLUMN "creado_por_id" TEXT,
ADD COLUMN     "despacho_id" TEXT;

ALTER TABLE "facturas" ADD COLUMN "creado_por_id" TEXT,
ADD COLUMN     "despacho_id" TEXT;

-- AlterTable usuarios
ALTER TABLE "usuarios" ADD COLUMN     "despacho_id" TEXT,
ADD COLUMN     "rol_despacho" "RolDespacho" DEFAULT 'OWNER';

-- CreateTable usage_events / plan_limits
CREATE TABLE "usage_events" (
    "id" TEXT NOT NULL,
    "despacho_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_limits" (
    "plan" "PlanUsuario" NOT NULL,
    "max_expedientes" INTEGER NOT NULL,
    "max_ai_calls_month" INTEGER NOT NULL,
    "max_storage_mb" INTEGER NOT NULL,

    CONSTRAINT "plan_limits_pkey" PRIMARY KEY ("plan")
);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  BACKFILL: un único despacho de prueba, todo vinculado a él  ║
-- ╚══════════════════════════════════════════════════════════════╝

-- 1. Crea el despacho único de prueba
INSERT INTO "despachos" ("id", "nombre", "plan", "activo", "created_at", "updated_at")
VALUES (gen_random_uuid(), 'Merino & Vaskovska Abogados', 'FREE', true, now(), now());

-- 2. Vincula todos los usuarios ABOGADO a ese despacho
UPDATE "usuarios"
SET "despacho_id" = (SELECT "id" FROM "despachos" WHERE "nombre" = 'Merino & Vaskovska Abogados')
WHERE "role" = 'ABOGADO';

-- 3. Rellena despacho_id / creado_por_id en las tablas hijas a partir del antiguo usuario_id
UPDATE "clientes" SET
  "despacho_id" = (SELECT "id" FROM "despachos" WHERE "nombre" = 'Merino & Vaskovska Abogados'),
  "creado_por_id" = "usuario_id";

UPDATE "expedientes" SET
  "despacho_id" = (SELECT "id" FROM "despachos" WHERE "nombre" = 'Merino & Vaskovska Abogados'),
  "creado_por_id" = "usuario_id";

UPDATE "documentos" SET
  "despacho_id" = (SELECT "id" FROM "despachos" WHERE "nombre" = 'Merino & Vaskovska Abogados'),
  "creado_por_id" = "usuario_id";

UPDATE "facturas" SET
  "despacho_id" = (SELECT "id" FROM "despachos" WHERE "nombre" = 'Merino & Vaskovska Abogados'),
  "creado_por_id" = "usuario_id";

UPDATE "conversaciones" SET
  "despacho_id" = (SELECT "id" FROM "despachos" WHERE "nombre" = 'Merino & Vaskovska Abogados'),
  "creado_por_id" = "usuario_id";

-- 4. Ahora que todo tiene valor, quitamos las columnas viejas y forzamos NOT NULL
ALTER TABLE "clientes" DROP COLUMN "usuario_id",
ALTER COLUMN "despacho_id" SET NOT NULL,
ALTER COLUMN "creado_por_id" SET NOT NULL;

ALTER TABLE "conversaciones" DROP COLUMN "usuario_id",
ALTER COLUMN "despacho_id" SET NOT NULL,
ALTER COLUMN "creado_por_id" SET NOT NULL;

ALTER TABLE "documentos" DROP COLUMN "usuario_id",
ALTER COLUMN "despacho_id" SET NOT NULL,
ALTER COLUMN "creado_por_id" SET NOT NULL;

ALTER TABLE "expedientes" DROP COLUMN "usuario_id",
ALTER COLUMN "despacho_id" SET NOT NULL,
ALTER COLUMN "creado_por_id" SET NOT NULL;

ALTER TABLE "facturas" DROP COLUMN "usuario_id",
ALTER COLUMN "despacho_id" SET NOT NULL,
ALTER COLUMN "creado_por_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "usage_events_despacho_id_event_type_created_at_idx" ON "usage_events"("despacho_id", "event_type", "created_at");

CREATE INDEX "clientes_despacho_id_idx" ON "clientes"("despacho_id");

CREATE INDEX "conversaciones_despacho_id_tipo_idx" ON "conversaciones"("despacho_id", "tipo");

CREATE INDEX "facturas_despacho_id_fecha_emision_idx" ON "facturas"("despacho_id", "fecha_emision" ASC);

CREATE UNIQUE INDEX "facturas_despacho_id_numero_key" ON "facturas"("despacho_id", "numero");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_despacho_id_fkey" FOREIGN KEY ("despacho_id") REFERENCES "despachos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "clientes" ADD CONSTRAINT "clientes_despacho_id_fkey" FOREIGN KEY ("despacho_id") REFERENCES "despachos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "expedientes" ADD CONSTRAINT "expedientes_despacho_id_fkey" FOREIGN KEY ("despacho_id") REFERENCES "despachos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "expedientes" ADD CONSTRAINT "expedientes_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "documentos" ADD CONSTRAINT "documentos_despacho_id_fkey" FOREIGN KEY ("despacho_id") REFERENCES "despachos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "facturas" ADD CONSTRAINT "facturas_despacho_id_fkey" FOREIGN KEY ("despacho_id") REFERENCES "despachos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "conversaciones" ADD CONSTRAINT "conversaciones_despacho_id_fkey" FOREIGN KEY ("despacho_id") REFERENCES "despachos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversaciones" ADD CONSTRAINT "conversaciones_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_despacho_id_fkey" FOREIGN KEY ("despacho_id") REFERENCES "despachos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;