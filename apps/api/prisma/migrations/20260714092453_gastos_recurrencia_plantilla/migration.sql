-- AlterTable
ALTER TABLE "gastos" ADD COLUMN     "es_plantilla" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fecha_fin" TIMESTAMP(3),
ADD COLUMN     "plantilla_id" TEXT,
ADD COLUMN     "ultimo_periodo_generado" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_plantilla_id_fkey" FOREIGN KEY ("plantilla_id") REFERENCES "gastos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
