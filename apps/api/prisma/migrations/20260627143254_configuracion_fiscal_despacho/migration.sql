/*
  Warnings:

  - You are about to drop the column `usuario_id` on the `configuracion_fiscal` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[despacho_id]` on the table `configuracion_fiscal` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `despacho_id` to the `configuracion_fiscal` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "configuracion_fiscal" DROP CONSTRAINT "configuracion_fiscal_usuario_id_fkey";

-- DropIndex
DROP INDEX "configuracion_fiscal_usuario_id_key";

-- AlterTable
ALTER TABLE "configuracion_fiscal" DROP COLUMN "usuario_id",
ADD COLUMN     "despacho_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "configuracion_fiscal_despacho_id_key" ON "configuracion_fiscal"("despacho_id");

-- AddForeignKey
ALTER TABLE "configuracion_fiscal" ADD CONSTRAINT "configuracion_fiscal_despacho_id_fkey" FOREIGN KEY ("despacho_id") REFERENCES "despachos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
