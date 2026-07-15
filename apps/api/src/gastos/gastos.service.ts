import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { S3Service } from '../common/s3/s3.service';
import { CreateGastoDto, UpdateGastoDto } from './dto/gastos.dto';
import { FiscalService } from '../fiscal/fiscal.service';
import { RecurrentesService } from './recurrentes.service';

@Injectable()
export class GastosService {
    constructor(
        private prisma: PrismaService,
        private s3: S3Service,
        private fiscal: FiscalService,
        private recurrentes: RecurrentesService,
    ) { }

    private calcular(base: number, tipoIva: number) {
        const cuotaIva = +((base * tipoIva) / 100).toFixed(2);
        const total = +(base + cuotaIva).toFixed(2);
        return { cuotaIva, total };
    }

    private async invalidarRango(despachoId: string, desde: Date, hasta: Date) {
        for (let y = desde.getFullYear(); y <= hasta.getFullYear(); y++) {
            await this.fiscal.invalidarCacheGastos(despachoId, y);
        }
    }

    async findAll(despachoId: string) {
        await this.recurrentes.sincronizarDespacho(despachoId);
        return this.prisma.gasto.findMany({
            where: { despachoId, esPlantilla: false },
            orderBy: { fecha: 'desc' },
        });
    }

    findPlantillas(despachoId: string) {
        return this.prisma.gasto.findMany({
            where: { despachoId, esPlantilla: true },
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { ocurrencias: true } } },
        });
    }

    async findOne(id: string, despachoId: string) {
        const gasto = await this.prisma.gasto.findFirst({ where: { id, despachoId } });
        if (!gasto) throw new NotFoundException('Gasto no encontrado');
        return gasto;
    }

    async create(despachoId: string, creadoPorId: string, data: CreateGastoDto) {
        const tipoIva = data.tipoIva ?? 21;
        const { cuotaIva, total } = this.calcular(data.baseImponible, tipoIva);

        const fechaFinCreate = data.recurrente && data.fechaFin ? new Date(data.fechaFin) : null;
        this.validarFechas(new Date(data.fecha), fechaFinCreate);

        const gasto = await this.prisma.gasto.create({
            data: {
                despachoId, creadoPorId,
                fecha: new Date(data.fecha),
                categoria: data.categoria,
                proveedor: data.proveedor,
                nifProveedor: data.nifProveedor,
                numeroFactura: data.numeroFactura,
                descripcion: data.descripcion,
                baseImponible: data.baseImponible,
                tipoIva, cuotaIva, total,
                deducible: data.deducible ?? true,
                ivaDeduciblePct: data.ivaDeduciblePct ?? 100,
                irpfDeduciblePct: data.irpfDeduciblePct ?? 100,
                recurrente: data.recurrente ?? false,
                frecuencia: data.recurrente ? (data.frecuencia ?? null) : null,
                esPlantilla: data.recurrente ?? false,
                fechaFin: data.recurrente && data.fechaFin ? new Date(data.fechaFin) : null,
                notas: data.notas,
            },
        });

        if (gasto.esPlantilla) await this.recurrentes.generarOcurrencias(gasto.id);

        await this.invalidarRango(despachoId, new Date(gasto.fecha), gasto.fechaFin ?? new Date());
        return gasto;
    }

    async update(id: string, despachoId: string, data: UpdateGastoDto) {
        const gasto = await this.findOne(id, despachoId);

        const base = data.baseImponible ?? Number(gasto.baseImponible);
        const tipoIva = data.tipoIva ?? Number(gasto.tipoIva);
        const { cuotaIva, total } = this.calcular(base, tipoIva);

        const recurrente = data.recurrente ?? gasto.recurrente;
        const frecuencia = recurrente ? (data.frecuencia ?? gasto.frecuencia) : null;
        const fechaFin = data.fechaFin !== undefined
            ? (data.fechaFin ? new Date(data.fechaFin) : null)
            : gasto.fechaFin;

        this.validarFechas(data.fecha ? new Date(data.fecha) : new Date(gasto.fecha), fechaFin);

        const actualizado = await this.prisma.gasto.update({
            where: { id },
            data: {
                ...data,
                ...(data.fecha && { fecha: new Date(data.fecha) }),
                baseImponible: base, tipoIva, cuotaIva, total,
                recurrente, frecuencia, fechaFin,
            },
        });

        if (gasto.esPlantilla) await this.recurrentes.reajustarFechaFin(id);

        await this.invalidarRango(despachoId, new Date(gasto.fecha), actualizado.fechaFin ?? new Date());
        if (data.fecha) await this.invalidarRango(despachoId, new Date(data.fecha), actualizado.fechaFin ?? new Date());
        return actualizado;
    }

    async remove(id: string, despachoId: string) {
        const gasto = await this.findOne(id, despachoId);
        if (gasto.esPlantilla) {
            throw new BadRequestException('Para dar de baja un gasto recurrente, indícale una fecha de fin en lugar de eliminarlo.');
        }
        if (gasto.justificanteS3Key) await this.s3.delete(gasto.justificanteS3Key);
        await this.fiscal.invalidarCacheGastos(despachoId, new Date(gasto.fecha).getFullYear());
        return this.prisma.gasto.delete({ where: { id } });
    }
    // ── Justificante (factura del gasto) ──────────────────────────────────────
    async subirJustificante(id: string, despachoId: string, file: Express.Multer.File) {
        const gasto = await this.findOne(id, despachoId);
        if (gasto.justificanteS3Key) await this.s3.delete(gasto.justificanteS3Key); // reemplazar

        const s3Key = `${despachoId}/gastos/${id}/${Date.now()}-${file.originalname}`;
        await this.s3.upload(s3Key, file.buffer, file.mimetype);

        return this.prisma.gasto.update({
            where: { id },
            data: { justificanteS3Key: s3Key, justificanteNombre: file.originalname },
        });
    }

    async getUrlJustificante(id: string, despachoId: string): Promise<string> {
        const gasto = await this.findOne(id, despachoId);
        if (!gasto.justificanteS3Key) throw new BadRequestException('Este gasto no tiene justificante');
        return this.s3.getSignedDownloadUrl(gasto.justificanteS3Key, 300, gasto.justificanteNombre ?? undefined);
    }

    async eliminarJustificante(id: string, despachoId: string) {
        const gasto = await this.findOne(id, despachoId);
        if (gasto.justificanteS3Key) await this.s3.delete(gasto.justificanteS3Key);
        return this.prisma.gasto.update({
            where: { id },
            data: { justificanteS3Key: null, justificanteNombre: null },
        });
    }

    /**
 * Reemplaza un gasto recurrente: cierra el anterior en la fecha del cambio
 * (conservando su historial) y crea uno nuevo con los valores indicados.
 * Si la fecha del cambio es anterior o igual al inicio del actual, lo sustituye
 * por completo (borra sus ocurrencias y las regenera).
 */
    async reemplazarRecurrente(id: string, despachoId: string, creadoPorId: string, data: CreateGastoDto) {
        const antigua = await this.findOne(id, despachoId);
        if (!antigua.esPlantilla) throw new BadRequestException('Este gasto no es recurrente.');
        if (!data.frecuencia) throw new BadRequestException('Indica la frecuencia del gasto recurrente.');

        const fechaCambio = new Date(data.fecha);
        const inicioAntigua = new Date(antigua.fecha);

        if (fechaCambio.getTime() <= inicioAntigua.getTime()) {
            // Sustitución completa: borra el recurrente anterior y todo lo que generó
            const conJustificante = await this.prisma.gasto.findMany({
                where: { OR: [{ id: antigua.id }, { plantillaId: antigua.id }], justificanteS3Key: { not: null } },
                select: { justificanteS3Key: true },
            });
            for (const g of conJustificante) await this.s3.delete(g.justificanteS3Key!);

            await this.prisma.gasto.deleteMany({ where: { plantillaId: antigua.id } });
            await this.prisma.gasto.delete({ where: { id: antigua.id } });
        } else {
            // Cierra el anterior el día antes del cambio y conserva su historial
            const finAntigua = new Date(fechaCambio);
            finAntigua.setDate(finAntigua.getDate() - 1);
            await this.prisma.gasto.update({ where: { id: antigua.id }, data: { fechaFin: finAntigua } });
            await this.recurrentes.reajustarFechaFin(antigua.id);
        }

        // Crea el nuevo recurrente (create ya genera las ocurrencias)
        const nueva = await this.create(despachoId, creadoPorId, { ...data, recurrente: true });

        await this.invalidarRango(despachoId, inicioAntigua, nueva.fechaFin ?? new Date());
        return nueva;
    }

    private validarFechas(fecha: Date, fechaFin?: Date | null) {
        if (fechaFin && fechaFin.getTime() < fecha.getTime()) {
            throw new BadRequestException('La fecha de fin no puede ser anterior a la fecha de inicio.');
        }
    }

    /** Elimina por completo un gasto recurrente: la plantilla, todas sus ocurrencias y sus justificantes. */
    async eliminarRecurrente(id: string, despachoId: string) {
        const plantilla = await this.findOne(id, despachoId);
        if (!plantilla.esPlantilla) throw new BadRequestException('Este gasto no es recurrente.');

        // Limpia los justificantes de S3 (plantilla + ocurrencias)
        const conJustificante = await this.prisma.gasto.findMany({
            where: { OR: [{ id: plantilla.id }, { plantillaId: plantilla.id }], justificanteS3Key: { not: null } },
            select: { justificanteS3Key: true },
        });
        for (const g of conJustificante) await this.s3.delete(g.justificanteS3Key!);

        await this.prisma.gasto.deleteMany({ where: { plantillaId: plantilla.id } });
        await this.prisma.gasto.delete({ where: { id: plantilla.id } });

        await this.invalidarRango(despachoId, new Date(plantilla.fecha), plantilla.fechaFin ?? new Date());
        return { ok: true };
    }
}