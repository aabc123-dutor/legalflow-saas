import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  findAll(usuarioId: string) {
    return this.prisma.clients.findMany({
      where: { usuarioId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, usuarioId: string) {
    const item = await this.prisma.clients.findFirst({
      where: { id, usuarioId },
    });
    if (!item) throw new NotFoundException('Cliente no encontrado/a');
    return item;
  }

  create(usuarioId: string, data: any) {
    return this.prisma.clients.create({ data: { ...data, usuarioId } });
  }

  async update(id: string, usuarioId: string, data: any) {
    await this.findOne(id, usuarioId);
    return this.prisma.clients.update({ where: { id }, data });
  }

  async remove(id: string, usuarioId: string) {
    await this.findOne(id, usuarioId);
    return this.prisma.clients.delete({ where: { id } });
  }
}
