import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { FrecuenciaGasto } from '@prisma/client';

const PASO_MESES: Record<FrecuenciaGasto, number> = {
  MENSUAL: 1, TRIMESTRAL: 3, CUATRIMESTRAL: 4, SEMESTRAL: 6, ANUAL: 12,
};

@Injectable()
export class RecurrentesService {
  constructor(private prisma: PrismaService) { }

  private hoy(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /** Suma n meses ajustando el día al último del mes si hiciera falta */
  private addMeses(fecha: Date, n: number): Date {
    const d = new Date(fecha);
    const dia = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + n);
    const ultimoDia = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(dia, ultimoDia));
    return d;
  }

  /**
   * Genera las ocurrencias pendientes de una plantilla hasta min(hoy, fechaFin).
   * Idempotente: avanza desde ultimoPeriodoGenerado. Devuelve nº creadas.
   */
  async generarOcurrencias(plantillaId: string): Promise<number> {
    const p = await this.prisma.gasto.findUnique({ where: { id: plantillaId } });
    if (!p || !p.esPlantilla || !p.frecuencia) return 0;

    const paso = PASO_MESES[p.frecuencia];
    const hoy = this.hoy();
    const limite = p.fechaFin && p.fechaFin.getTime() < hoy.getTime() ? p.fechaFin : hoy;
    const inicio = new Date(p.fecha);

    // Índice del primer periodo pendiente, anclado SIEMPRE a la fecha de inicio.
    // Calcularlo desde el inicio (y no encadenando desde el periodo anterior)
    // evita la deriva en meses de 28/30 días: 31/01 → 28/02 → 31/03 (no 28/03).
    let n = 0;
    if (p.ultimoPeriodoGenerado) {
      const meses =
        (p.ultimoPeriodoGenerado.getFullYear() - inicio.getFullYear()) * 12 +
        (p.ultimoPeriodoGenerado.getMonth() - inicio.getMonth());
      n = Math.floor(meses / paso) + 1;
    }

    // Primera ocurrencia = fecha de inicio; después avanzamos un periodo
    let periodo = this.addMeses(inicio, n * paso);
    let ultimo = p.ultimoPeriodoGenerado ?? null;
    let creadas = 0;


    while (periodo.getTime() <= limite.getTime()) {
      await this.prisma.gasto.create({
        data: {
          despachoId: p.despachoId,
          creadoPorId: p.creadoPorId,
          fecha: periodo,
          categoria: p.categoria,
          proveedor: p.proveedor,
          nifProveedor: p.nifProveedor,
          numeroFactura: p.numeroFactura,
          descripcion: p.descripcion,
          baseImponible: p.baseImponible,
          tipoIva: p.tipoIva,
          cuotaIva: p.cuotaIva,
          total: p.total,
          deducible: p.deducible,
          ivaDeduciblePct: p.ivaDeduciblePct,
          irpfDeduciblePct: p.irpfDeduciblePct,
          recurrente: false,
          esPlantilla: false,
          frecuencia: p.frecuencia,
          plantillaId: p.id,
        },
      });
      creadas++;
      ultimo = periodo;
      n++;
      periodo = this.addMeses(inicio, n * paso);   // ← siempre desde el inicio
    }

    if (creadas > 0) {
      await this.prisma.gasto.update({ where: { id: p.id }, data: { ultimoPeriodoGenerado: ultimo } });
    }
    return creadas;
  }

  /** Sincroniza todas las plantillas activas de un despacho. Devuelve nº creadas. */
  async sincronizarDespacho(despachoId: string): Promise<number> {
    const plantillas = await this.prisma.gasto.findMany({
      where: { despachoId, esPlantilla: true },
      select: { id: true },
    });
    let total = 0;
    for (const p of plantillas) total += await this.generarOcurrencias(p.id);
    return total;
  }

  /** Tras cambiar la fecha de fin: borra ocurrencias fuera de rango y genera las que falten. */
  async reajustarFechaFin(plantillaId: string): Promise<void> {
    const p = await this.prisma.gasto.findUnique({ where: { id: plantillaId } });
    if (!p || !p.esPlantilla) return;

    if (p.fechaFin) {
      await this.prisma.gasto.deleteMany({ where: { plantillaId, fecha: { gt: p.fechaFin } } });
    }
    const ultima = await this.prisma.gasto.findFirst({
      where: { plantillaId }, orderBy: { fecha: 'desc' }, select: { fecha: true },
    });
    await this.prisma.gasto.update({
      where: { id: plantillaId }, data: { ultimoPeriodoGenerado: ultima?.fecha ?? null },
    });
    await this.generarOcurrencias(plantillaId);
  }
}