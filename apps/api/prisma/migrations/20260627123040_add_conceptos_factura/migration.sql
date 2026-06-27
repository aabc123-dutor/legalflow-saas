-- CreateTable
CREATE TABLE "conceptos_factura" (
    "id" TEXT NOT NULL,
    "factura_id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "importe" DECIMAL(12,2) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "conceptos_factura_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "conceptos_factura" ADD CONSTRAINT "conceptos_factura_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
