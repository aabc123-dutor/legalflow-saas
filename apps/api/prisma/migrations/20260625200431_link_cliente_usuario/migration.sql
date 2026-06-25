/*
  Warnings:

  - A unique constraint covering the columns `[usuario_id]` on the table `clientes` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "usuario_id" TEXT;

-- Backfill: vincula clientes existentes con su Usuario por email
UPDATE "clientes" c
SET "usuario_id" = u."id"
FROM "usuarios" u
WHERE c."email" = u."email" AND u."role" = 'CLIENTE';

-- CreateIndex
CREATE UNIQUE INDEX "clientes_usuario_id_key" ON "clientes"("usuario_id");

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
