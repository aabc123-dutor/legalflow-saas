import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { REDIS_CLIENT } from '../common/redis/redis.module';
import type Redis from 'ioredis';
import { UpdateConfigFiscalDto } from './dto/fiscal.dto';

export interface TrimestralAggregate {
  trimestre: number;
  anio: number;
  baseImponible: number;
  cuotaIva: number;
  cuotaIrpf: number;
  totalFacturado: number;
  numFacturas: number;
}

const CACHE_TTL = 60 * 60 * 24; // 24 horas

@Injectable()
export class FiscalService {
  constructor(private prisma: PrismaService, @Inject(REDIS_CLIENT) private redis: Redis,) { }
  private cacheKey(despachoId: string, anio: number) {
    return `fiscal:resumen:${despachoId}:${anio}`;
  }

  /** Resumen fiscal por trimestre para Modelo 303 y 130 */
  async getResumenTrimestral(despachoId: string, anio: number): Promise<TrimestralAggregate[]> {
    const key = this.cacheKey(despachoId, anio);
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached);

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
      WHERE despacho_id = ${despachoId}
        AND estado NOT IN ('BORRADOR', 'ANULADA')
        AND EXTRACT(YEAR FROM fecha_emision) = ${anio}
      GROUP BY trimestre, anio
    `;

    await this.redis.set(key, JSON.stringify(rows), 'EX', CACHE_TTL);
    return rows;
  }

  async invalidarCache(despachoId: string, anio: number) {
    await this.redis.del(this.cacheKey(despachoId, anio));
  }

  /** Configuración fiscal del usuario */
  async getConfig(despachoId: string) {
    return this.prisma.configuracionFiscal.findUnique({ where: { despachoId } });
  }



  /** Actualizar configuración fiscal */
  async updateConfig(despachoId: string, data: UpdateConfigFiscalDto) {
    return this.prisma.configuracionFiscal.upsert({
      where: { despachoId },
      update: data,
      create: { despachoId, ...data },
    });
  }

  /**
   * Calcular cuotas IVA/IRPF para una base imponible dada
   * según la configuración fiscal del usuario
   */
  async calcularCuotas(despachoId: string, baseImponible: number) {
    const config = await this.getConfig(despachoId);
    const tipoIva = Number(config?.tipoIva ?? 21);
    const tipoIrpf = config?.nuevoProfesional ? 7 : Number(config?.tipoIrpf ?? 15);

    const cuotaIva = parseFloat(((baseImponible * tipoIva) / 100).toFixed(2));
    const cuotaIrpf = parseFloat(((baseImponible * tipoIrpf) / 100).toFixed(2));
    const total = parseFloat((baseImponible + cuotaIva - cuotaIrpf).toFixed(2));

    return { baseImponible, tipoIva, cuotaIva, tipoIrpf, cuotaIrpf, total };
  }

  /** Datos para Modelo 303 (IVA trimestral) */
  async getModelo303(despachoId: string, anio: number, trimestre: number) {
    const datos = await this.getResumenTrimestral(despachoId, anio);
    const t = datos.find((d) => d.trimestre === trimestre);
    if (!t) return { trimestre, anio, baseImponible: 0, cuotaDevengada: 0, cuotaDeducible: 0, resultadoLiquidar: 0 };

    return {
      trimestre,
      anio,
      baseImponible: t.baseImponible,
      cuotaDevengada: t.cuotaIva,
      cuotaDeducible: 0,
      resultadoLiquidar: t.cuotaIva,
    };
  }

  /** Datos para Modelo 130 (IRPF trimestral pago fraccionado) */
  async getModelo130(despachoId: string, anio: number, trimestre: number) {
    const datos = await this.getResumenTrimestral(despachoId, anio);
    const acumulado = datos.filter((d) => d.trimestre <= trimestre);
    const baseAcumulada = acumulado.reduce((s, d) => s + d.baseImponible, 0);
    const retencionesAcumuladas = acumulado.reduce((s, d) => s + d.cuotaIrpf, 0);

    const pagoFraccionado = Math.max(0, parseFloat((baseAcumulada * 0.2 - retencionesAcumuladas).toFixed(2)));

    return { trimestre, anio, baseAcumulada, retencionesAcumuladas, pagoFraccionado };
  }
}
