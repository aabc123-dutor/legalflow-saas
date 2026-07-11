-- CreateTable
CREATE TABLE "factura_counters" (
    "id" TEXT NOT NULL,
    "despacho_id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "ultimo" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "factura_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "factura_counters_despacho_id_anio_key" ON "factura_counters"("despacho_id", "anio");
