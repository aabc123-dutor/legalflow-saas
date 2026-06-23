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

  findAll(usuarioId: string) {
    return this.prisma.expediente.findMany({
      where: { usuarioId },
      include: { cliente: { select: { nombre: true, apellidos: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, usuarioId: string) {
    const item = await this.prisma.expediente.findFirst({
      where: { id, usuarioId },
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

  create(usuarioId: string, data: CreateExpedienteDto) {
    return this.prisma.expediente.create({ data: { ...data, usuarioId } });
  }

  async update(id: string, usuarioId: string, data: UpdateExpedienteDto) {
    await this.findOne(id, usuarioId);
    return this.prisma.expediente.update({ where: { id }, data });
  }

  async remove(id: string, usuarioId: string) {
    await this.findOne(id, usuarioId);
    return this.prisma.expediente.delete({ where: { id } });
  }

  // Hitos
  async createHito(expedienteId: string, usuarioId: string, data: CreateHitoDto) {
    await this.findOne(expedienteId, usuarioId);
    return this.prisma.hito.create({ data: { ...data, fecha: new Date(data.fecha), expedienteId } });
  }

  async updateHito(id: string, usuarioId: string, data: UpdateHitoDto) {
    const hito = await this.prisma.hito.findFirst({
      where: { id },
      include: { expediente: { select: { usuarioId: true } } },
    });
    if (!hito || hito.expediente.usuarioId !== usuarioId) throw new NotFoundException();
    return this.prisma.hito.update({ where: { id }, data: { ...data, ...(data.fecha && { fecha: new Date(data.fecha) }) } });
  }

  async removeHito(id: string, usuarioId: string) {
    const hito = await this.prisma.hito.findFirst({
      where: { id },
      include: { expediente: { select: { usuarioId: true } } },
    });
    if (!hito || hito.expediente.usuarioId !== usuarioId) throw new NotFoundException();
    return this.prisma.hito.delete({ where: { id } });
  }

  // Notas
  async createNota(expedienteId: string, usuarioId: string, data: CreateNotaDto) {
    await this.findOne(expedienteId, usuarioId);
    return this.prisma.nota.create({ data: { ...data, expedienteId } });
  }

  async updateNota(id: string, usuarioId: string, data: UpdateNotaDto) {
    const nota = await this.prisma.nota.findFirst({
      where: { id },
      include: { expediente: { select: { usuarioId: true } } },
    });
    if (!nota || nota.expediente.usuarioId !== usuarioId) throw new NotFoundException();
    return this.prisma.nota.update({ where: { id }, data });
  }

  async removeNota(id: string, usuarioId: string) {
    const nota = await this.prisma.nota.findFirst({
      where: { id },
      include: { expediente: { select: { usuarioId: true } } },
    });
    if (!nota || nota.expediente.usuarioId !== usuarioId) throw new NotFoundException();
    return this.prisma.nota.delete({ where: { id } });
  }

  proximosHitos(usuarioId: string) {
    const hoy = new Date();
    const en15dias = new Date();
    en15dias.setDate(hoy.getDate() + 15);

    return this.prisma.hito.findMany({
      where: {
        expediente: { usuarioId },
        fecha: { gte: hoy, lte: en15dias },
      },
      orderBy: { fecha: 'asc' },
      take: 5,
      include: {
        expediente: { select: { id: true, titulo: true } },
      },
    });

  }
}