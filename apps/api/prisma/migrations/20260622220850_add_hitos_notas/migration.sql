-- CreateTable
CREATE TABLE "hitos" (
    "id" TEXT NOT NULL,
    "expediente_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hitos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas" (
    "id" TEXT NOT NULL,
    "expediente_id" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hitos_expediente_id_fecha_idx" ON "hitos"("expediente_id", "fecha");

-- CreateIndex
CREATE INDEX "notas_expediente_id_idx" ON "notas"("expediente_id");

-- AddForeignKey
ALTER TABLE "hitos" ADD CONSTRAINT "hitos_expediente_id_fkey" FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas" ADD CONSTRAINT "notas_expediente_id_fkey" FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
