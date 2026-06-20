import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ExpedientesService {
  constructor(private prisma: PrismaService) {}

  findAll(usuarioId: string) {
    return this.prisma.expedientes.findMany({
      where: { usuarioId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, usuarioId: string) {
    const item = await this.prisma.expedientes.findFirst({
      where: { id, usuarioId },
    });
    if (!item) throw new NotFoundException('Expediente no encontrado/a');
    return item;
  }

  create(usuarioId: string, data: any) {
    return this.prisma.expedientes.create({ data: { ...data, usuarioId } });
  }

  async update(id: string, usuarioId: string, data: any) {
    await this.findOne(id, usuarioId);
    return this.prisma.expedientes.update({ where: { id }, data });
  }

  async remove(id: string, usuarioId: string) {
    await this.findOne(id, usuarioId);
    return this.prisma.expedientes.delete({ where: { id } });
  }
}
