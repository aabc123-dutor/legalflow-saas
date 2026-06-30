import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { S3Service } from '../common/s3/s3.service';
import { UploadDocumentoDto } from './dto/documento.dto';
import * as crypto from 'crypto';

@Injectable()
export class DocumentosService {
  constructor(
    private prisma: PrismaService,
    private s3: S3Service,
  ) { }

  findAll(despachoId: string) {
    return this.prisma.documento.findMany({
      where: { despachoId },
      include: { expediente: { select: { titulo: true, clienteId: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByExpediente(expedienteId: string, despachoId: string) {
    const expediente = await this.prisma.expediente.findFirst({
      where: { id: expedienteId, despachoId },
    });
    if (!expediente) throw new NotFoundException('Expediente no encontrado');

    return this.prisma.documento.findMany({
      where: { expedienteId, despachoId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, despachoId: string) {
    const item = await this.prisma.documento.findFirst({
      where: { id, despachoId },
    });
    if (!item) throw new NotFoundException('Documento no encontrado');
    return item;
  }

  async create(despachoId: string, creadoPorId: string, file: Express.Multer.File, data: UploadDocumentoDto) {
    const expediente = await this.prisma.expediente.findFirst({
      where: { id: data.expedienteId, despachoId },
    });
    if (!expediente) throw new NotFoundException('Expediente no encontrado');

    const hashSha256 = crypto.createHash('sha256').update(file.buffer).digest('hex');
    const s3Key = `${despachoId}/expedientes/${data.expedienteId}/${Date.now()}-${file.originalname}`;

    await this.s3.upload(s3Key, file.buffer, file.mimetype);

    return this.prisma.documento.create({
      data: {
        despachoId,
        creadoPorId,
        expedienteId: data.expedienteId,
        titulo: data.titulo,
        descripcion: data.descripcion ?? '',
        tipo: data.tipo ?? 'OTRO',
        s3Key,
        cifrado: true,
        hashSha256,
        sizeBytes: file.size,
      },
    });
  }

  async getUrlDescarga(id: string, despachoId: string): Promise<string> {
    const documento = await this.findOne(id, despachoId);
    const filename = documento.titulo.replace(/[\/\\]/g, '-');
    return this.s3.getSignedDownloadUrl(documento.s3Key, 300, filename);
  }

  async update(id: string, despachoId: string, data: any) {
    await this.findOne(id, despachoId);
    return this.prisma.documento.update({ where: { id }, data });
  }

  async remove(id: string, despachoId: string) {
    const documento = await this.findOne(id, despachoId);
    await this.s3.delete(documento.s3Key);
    return this.prisma.documento.delete({ where: { id } });
  }
}