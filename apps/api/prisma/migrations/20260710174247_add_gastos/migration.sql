-- CreateEnum
CREATE TYPE "CategoriaGasto" AS ENUM ('ALQUILER', 'SUMINISTROS', 'MATERIAL_OFICINA', 'SERVICIOS_PROFESIONALES', 'CUOTA_AUTONOMOS', 'COLEGIO_PROFESIONAL', 'SEGUROS', 'SOFTWARE_SUSCRIPCIONES', 'FORMACION', 'PUBLICIDAD', 'MANUTENCION', 'VEHICULO_DESPLAZAMIENTO', 'GASTOS_FINANCIEROS', 'TRIBUTOS', 'AMORTIZACION', 'OTROS');

-- CreateTable
CREATE TABLE "gastos" (
    "id" TEXT NOT NULL,
    "despacho_id" TEXT NOT NULL,
    "creado_por_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "categoria" "CategoriaGasto" NOT NULL DEFAULT 'OTROS',
    "proveedor" TEXT NOT NULL,
    "nif_proveedor" TEXT,
    "numero_factura" TEXT,
    "descripcion" TEXT,
    "base_imponible" DECIMAL(12,2) NOT NULL,
    "tipo_iva" DECIMAL(5,2) NOT NULL DEFAULT 21,
    "cuota_iva" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "deducible" BOOLEAN NOT NULL DEFAULT true,
    "iva_deducible_pct" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "irpf_deducible_pct" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "justificante_s3_key" TEXT,
    "justificante_nombre" TEXT,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gastos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gastos_despacho_id_fecha_idx" ON "gastos"("despacho_id", "fecha" ASC);

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_despacho_id_fkey" FOREIGN KEY ("despacho_id") REFERENCES "despachos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
