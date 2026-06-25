import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateFacturaDto, UpdateFacturaDto, CreateSuplidoDto } from './dto/facturas.dto';

@Injectable()
export class FacturasService {
  constructor(private prisma: PrismaService) {}

  findAll(despachoId: string) {
    return this.prisma.factura.findMany({
      where: { despachoId },
      include: {
        expediente: {
          select: {
            titulo: true,
            cliente: { select: { nombre: true, apellidos: true, empresa: true } },
          },
        },
      },
      orderBy: { fechaEmision: 'desc' },
    });
  }

  async findOne(id: string, despachoId: string) {
    const item = await this.prisma.factura.findFirst({
      where: { id, despachoId },
      include: {
        expediente: {
          select: {
            titulo: true,
            cliente: { select: { nombre: true, apellidos: true, empresa: true } },
          },
        },
        suplidos: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!item) throw new NotFoundException('Factura no encontrada');
    return item;
  }

  async create(despachoId: string, creadoPorId: string, data: CreateFacturaDto) {
    const expediente = await this.prisma.expediente.findFirst({
      where: { id: data.expedienteId, despachoId },
      include: { cliente: { select: { empresa: true } } },
    });
    if (!expediente) throw new NotFoundException('Expediente no encontrado');

    const base = Number(data.baseImponible);
    const tipoIva = 21;
    const tipoIrpf = expediente.cliente.empresa ? 15 : 0;
    const cuotaIva = +(base * tipoIva / 100).toFixed(2);
    const cuotaIrpf = +(base * tipoIrpf / 100).toFixed(2);
    const total = +(base + cuotaIva - cuotaIrpf).toFixed(2);
    const numero = data.numero ?? await this.generarNumero(despachoId);

    return this.prisma.factura.create({
      data: {
        despachoId,
        creadoPorId,
        expedienteId: data.expedienteId,
        numero: numero,
        baseImponible: base,
        tipoIva,
        cuotaIva,
        tipoIrpf,
        cuotaIrpf,
        total,
        fechaEmision: new Date(data.fechaEmision),
        fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : null,
        estado: data.estado ?? 'BORRADOR',
        notas: data.notas,
      },
    });
  }

  async update(id: string, despachoId: string, data: UpdateFacturaDto) {
    await this.findOne(id, despachoId);
    return this.prisma.factura.update({
      where: { id },
      data: {
        ...data,
        ...(data.fechaVencimiento && { fechaVencimiento: new Date(data.fechaVencimiento) }),
      },
    });
  }

  async remove(id: string, despachoId: string) {
    await this.findOne(id, despachoId);
    return this.prisma.factura.delete({ where: { id } });
  }

  // Suplidos
  async createSuplido(facturaId: string, despachoId: string, data: CreateSuplidoDto) {
    const factura = await this.findOne(facturaId, despachoId);

    const suplido = await this.prisma.suplido.create({
      data: { facturaId, expedienteId: factura.expedienteId, ...data },
    });

    // Recalcular total sumando suplidos
    const suplidos = await this.prisma.suplido.findMany({ where: { facturaId } });
    const totalSuplidos = suplidos.reduce((s, sup) => s + Number(sup.importe), 0);
    const base = Number(factura.baseImponible);
    const cuotaIva = Number(factura.cuotaIva);
    const cuotaIrpf = Number(factura.cuotaIrpf);
    const nuevoTotal = +(base + cuotaIva - cuotaIrpf + totalSuplidos).toFixed(2);

    await this.prisma.factura.update({ where: { id: facturaId }, data: { total: nuevoTotal } });

    return suplido;
  }

  async removeSuplido(suplidoId: string, despachoId: string) {
    const suplido = await this.prisma.suplido.findFirst({
      where: { id: suplidoId },
      include: { factura: { select: { despachoId: true, id: true, baseImponible: true, cuotaIva: true, cuotaIrpf: true } } },
    });
    if (!suplido || suplido.factura!.despachoId !== despachoId) throw new NotFoundException();

    await this.prisma.suplido.delete({ where: { id: suplidoId } });

    // Recalcular total sin este suplido
    const suplidos = await this.prisma.suplido.findMany({ where: { facturaId: suplido.facturaId! } });
    const totalSuplidos = suplidos.reduce((s, sup) => s + Number(sup.importe), 0);
    const base = Number(suplido.factura!.baseImponible);
    const cuotaIva = Number(suplido.factura!.cuotaIva);
    const cuotaIrpf = Number(suplido.factura!.cuotaIrpf);
    const nuevoTotal = +(base + cuotaIva - cuotaIrpf + totalSuplidos).toFixed(2);

    await this.prisma.factura.update({ where: { id: suplido.facturaId! }, data: { total: nuevoTotal } });
  }

  private async generarNumero(despachoId: string): Promise<string> {
    const año = new Date().getFullYear();
    const ultima = await this.prisma.factura.findFirst({
      where: { despachoId, numero: { startsWith: `${año}-` } },
      orderBy: { numero: 'desc' },
    });

    let siguiente = 1;
    if (ultima) {
      const partes = ultima.numero.split('-');
      const num = parseInt(partes[partes.length - 1], 10);
      if (!isNaN(num)) siguiente = num + 1;
    }

    return `${año}-${String(siguiente).padStart(3, '0')}`;
  }
}