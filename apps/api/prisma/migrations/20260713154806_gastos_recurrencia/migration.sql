-- CreateEnum
CREATE TYPE "FrecuenciaGasto" AS ENUM ('MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');

-- AlterTable
ALTER TABLE "gastos" ADD COLUMN     "frecuencia" "FrecuenciaGasto",
ADD COLUMN     "recurrente" BOOLEAN NOT NULL DEFAULT false;
