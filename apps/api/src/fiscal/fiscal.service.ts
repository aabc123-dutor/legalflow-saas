import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { REDIS_CLIENT } from '../common/redis/redis.module';
import type Redis from 'ioredis';
import { UpdateConfigFiscalDto } from './dto/fiscal.dto';
import { RecurrentesService } from '../gastos/recurrentes.service';

export interface TrimestralAggregate {
  trimestre: number;
  anio: number;
  baseImponible: number;
  cuotaIva: number;
  cuotaIrpf: number;
  totalFacturado: number;
  numFacturas: number;
}

export interface GastoAggregate {
  trimestre: number;
  ivaDeducible: number;   // IVA soportado deducible
  gastoDeducible: number; // base deducible en IRPF
  totalGastos: number;
  numGastos: number;
}

const CACHE_TTL = 60 * 60 * 24; // 24 horas

@Injectable()
export class FiscalService {
  constructor(private prisma: PrismaService, @Inject(REDIS_CLIENT) private redis: Redis, private recurrentes: RecurrentesService,) { }
  private cacheKey(despachoId: string, anio: number) {
    return `fiscal:resumen:${despachoId}:${anio}`;
  }

  private cacheKeyGastos(despachoId: string, anio: number) {
    return `fiscal:gastos:${despachoId}:${anio}`;
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

  /** Resumen de gastos deducibles por trimestre (IVA soportado e IRPF) */
  async getResumenGastosTrimestral(despachoId: string, anio: number): Promise<GastoAggregate[]> {
    // Poner al día las ocurrencias recurrentes pendientes
    const creadas = await this.recurrentes.sincronizarDespacho(despachoId);
    const key = this.cacheKeyGastos(despachoId, anio);
    if (creadas > 0) {
      await this.redis.del(key);
      // las ocurrencias nuevas siempre caen en el año en curso
      await this.redis.del(this.cacheKeyGastos(despachoId, new Date().getFullYear()));
    }

    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached);

    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        EXTRACT(QUARTER FROM fecha)::int AS trimestre,
        SUM(CASE WHEN deducible THEN cuota_iva      * iva_deducible_pct  / 100 ELSE 0 END)::float AS "ivaDeducible",
        SUM(CASE WHEN deducible THEN base_imponible * irpf_deducible_pct / 100 ELSE 0 END)::float AS "gastoDeducible",
        SUM(total)::float AS "totalGastos",
        COUNT(*)::int     AS "numGastos"
      FROM gastos
      WHERE despacho_id = ${despachoId}
        AND EXTRACT(YEAR FROM fecha) = ${anio}
      GROUP BY trimestre
    `;

    await this.redis.set(key, JSON.stringify(rows), 'EX', CACHE_TTL);
    return rows;
  }

  async invalidarCacheGastos(despachoId: string, anio: number) {
    await this.redis.del(this.cacheKeyGastos(despachoId, anio));
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
    const gastos = await this.getResumenGastosTrimestral(despachoId, anio);
    const t = datos.find((d) => d.trimestre === trimestre);
    const g = gastos.find((x) => x.trimestre === trimestre);

    const cuotaDevengada = t?.cuotaIva ?? 0;
    const cuotaDeducible = +(g?.ivaDeducible ?? 0).toFixed(2);
    const resultadoLiquidar = +(cuotaDevengada - cuotaDeducible).toFixed(2);

    return {
      trimestre,
      anio,
      baseImponible: t?.baseImponible ?? 0,
      cuotaDevengada,
      cuotaDeducible,
      resultadoLiquidar,
    };
  }

  /** Datos para Modelo 130 (IRPF trimestral pago fraccionado) */
  async getModelo130(despachoId: string, anio: number, trimestre: number) {
    const datos = await this.getResumenTrimestral(despachoId, anio);
    const gastos = await this.getResumenGastosTrimestral(despachoId, anio);
    const acumulado = datos.filter((d) => d.trimestre <= trimestre);
    const gastosAcum = gastos.filter((g) => g.trimestre <= trimestre);

    const baseAcumulada = acumulado.reduce((s, d) => s + d.baseImponible, 0);
    const retencionesAcumuladas = acumulado.reduce((s, d) => s + d.cuotaIrpf, 0);
    const gastosDeducibles = +gastosAcum.reduce((s, g) => s + g.gastoDeducible, 0).toFixed(2);

    const rendimiento = baseAcumulada - gastosDeducibles;
    const pagoFraccionado = Math.max(0, +(rendimiento * 0.2 - retencionesAcumuladas).toFixed(2));

    return { trimestre, anio, baseAcumulada, gastosDeducibles, retencionesAcumuladas, pagoFraccionado };
  }
}
