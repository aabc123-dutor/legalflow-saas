import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class FacturasService {
  constructor(private prisma: PrismaService) {}

  findAll(usuarioId: string) {
    return this.prisma.factura.findMany({
      where: { usuarioId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, usuarioId: string) {
    const item = await this.prisma.factura.findFirst({
      where: { id, usuarioId },
    });
    if (!item) throw new NotFoundException('Factura no encontrado/a');
    return item;
  }

  create(usuarioId: string, data: any) {
    return this.prisma.factura.create({ data: { ...data, usuarioId } });
  }

  async update(id: string, usuarioId: string, data: any) {
    await this.findOne(id, usuarioId);
    return this.prisma.factura.update({ where: { id }, data });
  }

  async remove(id: string, usuarioId: string) {
    await this.findOne(id, usuarioId);
    return this.prisma.factura.delete({ where: { id } });
  }
}
