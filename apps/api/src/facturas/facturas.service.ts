import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { S3Service } from '../common/s3/s3.service';
import { FacturasPdfService } from './factura-pdf.service';
import { CreateFacturaDto, UpdateFacturaDto, CreateSuplidoDto, CreateConceptoDto } from './dto/facturas.dto';
import { FiscalService } from '../fiscal/fiscal.service';


@Injectable()
export class FacturasService {
  constructor(
    private prisma: PrismaService,
    private s3: S3Service,
    private pdfService: FacturasPdfService,
    private fiscal: FiscalService,
  ) { }

  findAll(despachoId: string) {
    return this.prisma.factura.findMany({
      where: { despachoId },
      include: {
        expediente: { select: { titulo: true, cliente: { select: { nombre: true, apellidos: true, empresa: true } } } },
      },
      orderBy: { fechaVencimiento: 'asc' },
    });
  }

  async findOne(id: string, despachoId: string) {
    const item = await this.prisma.factura.findFirst({
      where: { id, despachoId },
      include: {
        expediente: { select: { titulo: true, cliente: { select: { nombre: true, apellidos: true, empresa: true, nif: true, direccion: true } } } },
        suplidos: { orderBy: { createdAt: 'asc' } },
        conceptos: { orderBy: { orden: 'asc' } },
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

    const base = data.conceptos.reduce((s, c) => s + Number(c.importe), 0);
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
        numero,
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
        conceptos: {
          create: data.conceptos.map((c, i) => ({ descripcion: c.descripcion, importe: c.importe, orden: i })),
        },
      },
      include: { conceptos: true },
    });
  }

  async update(id: string, despachoId: string, creadoPorId: string, data: UpdateFacturaDto) {
    const factura = await this.findOne(id, despachoId);

    const actualizada = await this.prisma.factura.update({
      where: { id },
      data: {
        ...data,
        ...(data.fechaVencimiento && { fechaVencimiento: new Date(data.fechaVencimiento) }),
      },
    });
    // Invalidar caché
    await this.fiscal.invalidarCache(despachoId, factura.fechaEmision.getFullYear());

    // Generar PDF solo la primera vez que pasa a EMITIDA
    if (data.estado === 'EMITIDA' && factura.estado !== 'EMITIDA' && !factura.documentoId) {
      await this.generarYVincularPdf(id, despachoId, creadoPorId);
    }

    return actualizada;
  }

  private async generarYVincularPdf(facturaId: string, despachoId: string, creadoPorId: string) {
    const factura = await this.findOne(facturaId, despachoId);

    const despacho = await this.prisma.despacho.findUnique({
      where: { id: despachoId },
      include: { configuracionFiscal: true },
    });

    const pdfBuffer = await this.pdfService.generar(factura, despacho);
    const s3Key = `${despachoId}/facturas/${facturaId}.pdf`;

    await this.s3.upload(s3Key, pdfBuffer, 'application/pdf');

    const documento = await this.prisma.documento.create({
      data: {
        despachoId,
        creadoPorId,
        expedienteId: factura.expedienteId,
        titulo: `Factura ${factura.numero}`,
        descripcion: `PDF generado automáticamente para la factura ${factura.numero}`,
        tipo: 'FACTURA_PDF',
        s3Key,
        sizeBytes: pdfBuffer.length,
      },
    });

    await this.prisma.factura.update({
      where: { id: facturaId },
      data: { documentoId: documento.id },
    });
  }

  async getUrlDescarga(id: string, despachoId: string): Promise<string> {
    const factura = await this.prisma.factura.findFirst({
      where: { id, despachoId },
      include: { documento: true, expediente: { include: { cliente: true } } },
    });
    if (!factura) throw new NotFoundException('Factura no encontrada');
    if (!factura.documento) throw new BadRequestException('La factura aún no tiene PDF generado');

    const cliente = factura.expediente.cliente;
    const nombreCliente = `${cliente.nombre} ${cliente.apellidos ?? ''}`.trim();
    const filename = `${factura.numero} - ${nombreCliente}.pdf`.replace(/[\/\\]/g, '-');

    return this.s3.getSignedDownloadUrl(factura.documento.s3Key, 300, filename);
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
    const totalSuplidos = suplidos.reduce((s: number, sup: { importe: any }) => s + Number(sup.importe), 0);
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
    const totalSuplidos = suplidos.reduce((s: number, sup: { importe: any }) => s + Number(sup.importe), 0);
    const base = Number(suplido.factura!.baseImponible);
    const cuotaIva = Number(suplido.factura!.cuotaIva);
    const cuotaIrpf = Number(suplido.factura!.cuotaIrpf);
    const nuevoTotal = +(base + cuotaIva - cuotaIrpf + totalSuplidos).toFixed(2);

    await this.prisma.factura.update({ where: { id: suplido.facturaId! }, data: { total: nuevoTotal } });
  }

  private async generarNumero(despachoId: string): Promise<string> {
    const anio = new Date().getFullYear();

    const counter = await this.prisma.facturaCounter.upsert({
      where: { despachoId_anio: { despachoId, anio } },
      create: { despachoId, anio, ultimo: 1 },
      update: { ultimo: { increment: 1 } },
    });

    return `FAC-${anio}-${String(counter.ultimo).padStart(3, '0')}`;
  }

  private async recalcularDesdeConceptos(facturaId: string) {
    const factura = await this.prisma.factura.findUnique({
      where: { id: facturaId },
      include: { conceptos: true, expediente: { include: { cliente: { select: { empresa: true } } } } },
    });
    if (!factura) throw new NotFoundException();

    const base = factura.conceptos.reduce((s, c) => s + Number(c.importe), 0);
    const tipoIva = Number(factura.tipoIva);
    const tipoIrpf = factura.expediente.cliente.empresa ? 15 : 0;
    const cuotaIva = +(base * tipoIva / 100).toFixed(2);
    const cuotaIrpf = +(base * tipoIrpf / 100).toFixed(2);

    const suplidos = await this.prisma.suplido.findMany({ where: { facturaId } });
    const totalSuplidos = suplidos.reduce((s, sup) => s + Number(sup.importe), 0);
    const total = +(base + cuotaIva - cuotaIrpf + totalSuplidos).toFixed(2);

    const actualizada = await this.prisma.factura.update({
      where: { id: facturaId },
      data: { baseImponible: base, cuotaIva, cuotaIrpf, tipoIrpf, total },
    });

    await this.fiscal.invalidarCache(factura.despachoId, factura.fechaEmision.getFullYear());

    return actualizada;
  }

  async createConcepto(facturaId: string, despachoId: string, data: CreateConceptoDto) {
    const factura = await this.findOne(facturaId, despachoId);
    if (factura.estado !== 'BORRADOR') throw new BadRequestException('Solo se pueden editar conceptos en facturas en borrador');

    const ultimoOrden = factura.conceptos?.length ?? 0;
    const concepto = await this.prisma.conceptoFactura.create({
      data: { facturaId, descripcion: data.descripcion, importe: data.importe, orden: ultimoOrden },
    });

    await this.recalcularDesdeConceptos(facturaId);
    return concepto;
  }

  async removeConcepto(conceptoId: string, despachoId: string) {
    const concepto = await this.prisma.conceptoFactura.findFirst({
      where: { id: conceptoId },
      include: { factura: { select: { despachoId: true, id: true, estado: true } } },
    });
    if (!concepto || concepto.factura.despachoId !== despachoId) throw new NotFoundException();
    if (concepto.factura.estado !== 'BORRADOR') throw new BadRequestException('Solo se pueden editar conceptos en facturas en borrador');

    await this.prisma.conceptoFactura.delete({ where: { id: conceptoId } });
    await this.recalcularDesdeConceptos(concepto.factura.id);
  }

}