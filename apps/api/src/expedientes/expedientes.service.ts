import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateExpedienteDto, UpdateExpedienteDto,
  CreateHitoDto, UpdateHitoDto,
  CreateNotaDto, UpdateNotaDto,
} from './dto/expediente.dto';

@Injectable()
export class ExpedientesService {
  constructor(private prisma: PrismaService) { }

  findAll(despachoId: string) {
    return this.prisma.expediente.findMany({
      where: { despachoId },
      include: { cliente: { select: { nombre: true, apellidos: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, despachoId: string) {
    const item = await this.prisma.expediente.findFirst({
      where: { id, despachoId },
      include: {
        cliente: { select: { id: true, nombre: true, apellidos: true, email: true } },
        hitos: { orderBy: { fecha: 'asc' } },
        notas: { orderBy: { createdAt: 'desc' } },
        documentos: { orderBy: { createdAt: 'desc' } },
        facturas: { orderBy: { fechaEmision: 'desc' } },
      },
    });
    if (!item) throw new NotFoundException('Expediente no encontrado');
    return item;
  }

  create(despachoId: string, creadoPorId: string, data: CreateExpedienteDto) {
    return this.prisma.expediente.create({ data: { ...data, despachoId, creadoPorId } });
  }

  async update(id: string, despachoId: string, data: UpdateExpedienteDto) {
    await this.findOne(id, despachoId);
    return this.prisma.expediente.update({ where: { id }, data });
  }

  async remove(id: string, despachoId: string) {
    await this.findOne(id, despachoId);
    return this.prisma.expediente.delete({ where: { id } });
  }

  // Hitos
  async createHito(expedienteId: string, despachoId: string, data: CreateHitoDto) {
    await this.findOne(expedienteId, despachoId);
    return this.prisma.hito.create({ data: { ...data, fecha: new Date(data.fecha), expedienteId } });
  }

  async updateHito(id: string, despachoId: string, data: UpdateHitoDto) {
    const hito = await this.prisma.hito.findFirst({
      where: { id },
      include: { expediente: { select: { despachoId: true } } },
    });
    if (!hito || hito.expediente.despachoId !== despachoId) throw new NotFoundException();
    return this.prisma.hito.update({ where: { id }, data: { ...data, ...(data.fecha && { fecha: new Date(data.fecha) }) } });
  }

  async removeHito(id: string, despachoId: string) {
    const hito = await this.prisma.hito.findFirst({
      where: { id },
      include: { expediente: { select: { despachoId: true } } },
    });
    if (!hito || hito.expediente.despachoId !== despachoId) throw new NotFoundException();
    return this.prisma.hito.delete({ where: { id } });
  }

  // Notas
  async createNota(expedienteId: string, despachoId: string, data: CreateNotaDto) {
    await this.findOne(expedienteId, despachoId);
    return this.prisma.nota.create({ data: { ...data, expedienteId } });
  }

  async updateNota(id: string, despachoId: string, data: UpdateNotaDto) {
    const nota = await this.prisma.nota.findFirst({
      where: { id },
      include: { expediente: { select: { despachoId: true } } },
    });
    if (!nota || nota.expediente.despachoId !== despachoId) throw new NotFoundException();
    return this.prisma.nota.update({ where: { id }, data });
  }

  async removeNota(id: string, despachoId: string) {
    const nota = await this.prisma.nota.findFirst({
      where: { id },
      include: { expediente: { select: { despachoId: true } } },
    });
    if (!nota || nota.expediente.despachoId !== despachoId) throw new NotFoundException();
    return this.prisma.nota.delete({ where: { id } });
  }

  proximosHitos(despachoId: string) {
    const hoy = new Date();
    const en15dias = new Date();
    en15dias.setDate(hoy.getDate() + 15);

    return this.prisma.hito.findMany({
      where: {
        expediente: { despachoId },
        fecha: { gte: hoy, lte: en15dias },
      },
      orderBy: { fecha: 'asc' },
      take: 5,
      include: {
        expediente: { select: { id: true, titulo: true } },
      },
    });
  }

  async findByClienteUsuario(usuarioId: string, despachoId: string) {
    const cliente = await this.prisma.cliente.findFirst({
      where: { usuarioId, despachoId },
    });
    if (!cliente) return [];

    return this.prisma.expediente.findMany({
      where: { despachoId, clienteId: cliente.id },
      orderBy: { fechaApertura: 'desc' },
    });
  }

  async findOneCliente(id: string, usuarioId: string, despachoId: string) {
    const cliente = await this.prisma.cliente.findFirst({
      where: { usuarioId, despachoId },
    });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    const expediente = await this.prisma.expediente.findFirst({
      where: { id, despachoId, clienteId: cliente.id },
      include: {
        hitos: { orderBy: { fecha: 'asc' } },
        documentos: {
          where: { visibleParaCliente: true },
          include: { creadoPor: { select: { role: true } } },
          orderBy: { createdAt: 'desc' },
        },
        facturas: {
          where: { estado: { not: 'BORRADOR' } },
          orderBy: { fechaEmision: 'desc' },
        },
      },
    });
    if (!expediente) throw new NotFoundException('Expediente no encontrado');
    return expediente;
  }

  async getResumenPortal(usuarioId: string, despachoId: string) {
    const cliente = await this.prisma.cliente.findFirst({
      where: { usuarioId, despachoId },
    });
    if (!cliente) return { hitos: [], facturas: [] };

    const expedientesIds = await this.prisma.expediente.findMany({
      where: { despachoId, clienteId: cliente.id },
      select: { id: true },
    });
    const ids = expedientesIds.map((e) => e.id);

    const [hitos, facturas] = await Promise.all([
      this.prisma.hito.findMany({
        where: {
          expedienteId: { in: ids },
          fecha: { gte: new Date() },
        },
        include: { expediente: { select: { titulo: true } } },
        orderBy: { fecha: 'asc' },
        take: 5,
      }),
      this.prisma.factura.findMany({
        where: {
          expedienteId: { in: ids },
          estado: { notIn: ['PAGADA', 'ANULADA', 'BORRADOR'] },
          fechaVencimiento: {
            lte: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          },
        },
        include: { expediente: { select: { titulo: true } } },
        orderBy: { fechaVencimiento: 'asc' },
      }),
    ]);

    return { hitos, facturas };
  }
}