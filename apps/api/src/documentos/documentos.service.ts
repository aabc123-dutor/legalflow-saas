import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class DocumentosService {
  constructor(private prisma: PrismaService) {}

  findAll(despachoId: string) {
    return this.prisma.documento.findMany({
      where: { despachoId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, despachoId: string) {
    const item = await this.prisma.documento.findFirst({
      where: { id, despachoId },
    });
    if (!item) throw new NotFoundException('Documento no encontrado/a');
    return item;
  }

  create(despachoId: string, creadoPorId: string, data: any) {
    return this.prisma.documento.create({ data: { ...data, despachoId, creadoPorId } });
  }

  async update(id: string, despachoId: string, data: any) {
    await this.findOne(id, despachoId);
    return this.prisma.documento.update({ where: { id }, data });
  }

  async remove(id: string, despachoId: string) {
    await this.findOne(id, despachoId);
    return this.prisma.documento.delete({ where: { id } });
  }
}