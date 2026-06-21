/*
  Warnings:

  - You are about to drop the column `mime_type` on the `documentos` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `documentos` table. All the data in the column will be lost.
  - You are about to drop the column `s3_key` on the `facturas` table. All the data in the column will be lost.
  - You are about to drop the column `refresh_token_hash` on the `usuarios` table. All the data in the column will be lost.
  - The `role` column on the `usuarios` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `plan` column on the `usuarios` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[documento_id]` on the table `facturas` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `descripcion` to the `documentos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `titulo` to the `documentos` table without a default value. This is not possible if the table is not empty.
  - Made the column `expediente_id` on table `facturas` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `expediente_id` to the `suplidos` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ABOGADO', 'CLIENTE');

-- CreateEnum
CREATE TYPE "PlanUsuario" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');

-- DropForeignKey
ALTER TABLE "facturas" DROP CONSTRAINT "facturas_expediente_id_fkey";

-- DropForeignKey
ALTER TABLE "suplidos" DROP CONSTRAINT "suplidos_factura_id_fkey";

-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "empresa" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "documentos" DROP COLUMN "mime_type",
DROP COLUMN "nombre",
ADD COLUMN     "cifrado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "descripcion" TEXT NOT NULL,
ADD COLUMN     "factura_id" TEXT,
ADD COLUMN     "hash_sha256" TEXT,
ADD COLUMN     "s3_url" TEXT,
ADD COLUMN     "suplido_id" TEXT,
ADD COLUMN     "titulo" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "facturas" DROP COLUMN "s3_key",
ADD COLUMN     "documento_id" TEXT,
ALTER COLUMN "expediente_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "suplidos" ADD COLUMN     "expediente_id" TEXT NOT NULL,
ALTER COLUMN "factura_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "usuarios" DROP COLUMN "refresh_token_hash",
DROP COLUMN "role",
ADD COLUMN     "role" "RolUsuario" NOT NULL DEFAULT 'CLIENTE',
DROP COLUMN "plan",
ADD COLUMN     "plan" "PlanUsuario" NOT NULL DEFAULT 'FREE';

-- DropEnum
DROP TYPE "UserPlan";

-- DropEnum
DROP TYPE "UserRole";

-- CreateIndex
CREATE UNIQUE INDEX "facturas_documento_id_key" ON "facturas"("documento_id");

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_suplido_id_fkey" FOREIGN KEY ("suplido_id") REFERENCES "suplidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_expediente_id_fkey" FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_documento_id_fkey" FOREIGN KEY ("documento_id") REFERENCES "documentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suplidos" ADD CONSTRAINT "suplidos_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suplidos" ADD CONSTRAINT "suplidos_expediente_id_fkey" FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
