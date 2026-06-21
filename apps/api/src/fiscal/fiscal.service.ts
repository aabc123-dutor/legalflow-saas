import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface TrimestralAggregate {
  trimestre: number;
  anio: number;
  baseImponible: number;
  cuotaIva: number;
  cuotaIrpf: number;
  totalFacturado: number;
  numFacturas: number;
}

@Injectable()
export class FiscalService {
  constructor(private prisma: PrismaService) {}

  /** Resumen fiscal por trimestre para Modelo 303 y 130 */
  async getResumenTrimestral(usuarioId: string, anio: number): Promise<TrimestralAggregate[]> {
    // Raw query to group by quarter
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        EXTRACT(QUARTER FROM fecha_emision)::int AS trimestre,
        EXTRACT(YEAR   FROM fecha_emision)::int AS anio,
        SUM(base_imponible)::float AS "baseImponible",
        SUM(cuota_iva)::float      AS "cuotaIva",
        SUM(cuota_irpf)::float     AS "cuotaIrpf",
        SUM(total)::float          AS "totalFacturado",
        COUNT(*)::int              AS "numFacturas"
      FROM facturas
      WHERE usuario_id = ${usuarioId}
        AND estado NOT IN ('BORRADOR', 'ANULADA')
        AND EXTRACT(YEAR FROM fecha_emision) = ${anio}
      GROUP BY trimestre, anio
      ORDER BY trimestre
    `;

    return rows;
  }

  /** Configuración fiscal del usuario */
  async getConfig(usuarioId: string) {
    return this.prisma.configuracionFiscal.findUnique({ where: { usuarioId } });
  }

  /** Actualizar configuración fiscal */
  async updateConfig(usuarioId: string, data: { tipoIva?: number; tipoIrpf?: number; nuevoProfesional?: boolean; nif?: string }) {
    return this.prisma.configuracionFiscal.upsert({
      where: { usuarioId },
      update: data,
      create: { usuarioId, ...data },
    });
  }

  /**
   * Calcular cuotas IVA/IRPF para una base imponible dada
   * según la configuración fiscal del usuario
   */
  async calcularCuotas(usuarioId: string, baseImponible: number) {
    const config = await this.getConfig(usuarioId);
    const tipoIva = Number(config?.tipoIva ?? 21);
    const tipoIrpf = config?.nuevoProfesional ? 7 : Number(config?.tipoIrpf ?? 15);

    const cuotaIva = parseFloat(((baseImponible * tipoIva) / 100).toFixed(2));
    const cuotaIrpf = parseFloat(((baseImponible * tipoIrpf) / 100).toFixed(2));
    const total = parseFloat((baseImponible + cuotaIva - cuotaIrpf).toFixed(2));

    return { baseImponible, tipoIva, cuotaIva, tipoIrpf, cuotaIrpf, total };
  }

  /** Datos para Modelo 303 (IVA trimestral) */
  async getModelo303(usuarioId: string, anio: number, trimestre: number) {
    const datos = await this.getResumenTrimestral(usuarioId, anio);
    const t = datos.find((d) => d.trimestre === trimestre);
    if (!t) return { cuotaDevengada: 0, cuotaDeducible: 0, resultadoLiquidar: 0 };

    return {
      trimestre,
      anio,
      baseImponible: t.baseImponible,
      cuotaDevengada: t.cuotaIva,
      cuotaDeducible: 0, // gastos deducibles — ampliar en próxima iteración
      resultadoLiquidar: t.cuotaIva,
    };
  }

  /** Datos para Modelo 130 (IRPF trimestral pago fraccionado) */
  async getModelo130(usuarioId: string, anio: number, trimestre: number) {
    const datos = await this.getResumenTrimestral(usuarioId, anio);
    // Acumular desde Q1 hasta el trimestre indicado
    const acumulado = datos.filter((d) => d.trimestre <= trimestre);
    const baseAcumulada = acumulado.reduce((s, d) => s + d.baseImponible, 0);
    const retencionesAcumuladas = acumulado.reduce((s, d) => s + d.cuotaIrpf, 0);

    // Pago fraccionado = 20% base - retenciones practicadas
    const pagoFraccionado = Math.max(0, parseFloat((baseAcumulada * 0.2 - retencionesAcumuladas).toFixed(2)));

    return {
      trimestre,
      anio,
      baseAcumulada,
      retencionesAcumuladas,
      pagoFraccionado,
    };
  }
}
