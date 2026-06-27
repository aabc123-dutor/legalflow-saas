-- AlterTable
ALTER TABLE "configuracion_fiscal" ADD COLUMN     "banco" TEXT,
ADD COLUMN     "dias_pago" INTEGER DEFAULT 7,
ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "iban" TEXT,
ADD COLUMN     "titulares" TEXT;
