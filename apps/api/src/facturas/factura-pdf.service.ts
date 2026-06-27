import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FacturasPdfService {
    private logoPath: string;

    constructor() {
        this.logoPath = path.join(process.cwd(), '..', 'web', 'public', 'icono-negro.png');
    }

    generar(factura: any, despacho: any): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const cfg = despacho.configuracionFiscal ?? {};
            const nombreDespacho = despacho.nombre;
            const titulares = cfg.titulares ?? despacho.nombre;
            const cif = cfg.nif ?? '';
            const direccionDespacho = cfg.direccion ?? '';
            const iban = cfg.iban ?? '';
            const banco = cfg.banco ?? '';
            const diasPago = cfg.diasPago ?? 7;
            const cliente = factura.expediente.cliente;
            const nombreCliente = `${cliente.nombre} ${cliente.apellidos ?? ''}`.trim();

            // Icono + nombre del despacho
            try {
                if (fs.existsSync(this.logoPath)) {
                    doc.image(this.logoPath, 207, 30, { width: 180 });
                    doc.y = 115;
                } else {
                    doc.y = 50;
                }
            } catch {
                doc.y = 50;
            }

            doc.fontSize(11).fillColor('#1e3a5f').font('Helvetica-Bold')
                .text('MERINO & VASKOVSKA', { align: 'center' });
            doc.fontSize(11).fillColor('#374151')
                .text('ABOGADOS', { align: 'center', characterSpacing: 1 });

            doc.moveDown(0.8);
            doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#000').lineWidth(1.5).stroke();
            doc.moveDown(1);

            // Datos del despacho
            doc.fontSize(11).fillColor('#374151').font('Helvetica-Bold')
                .text(titulares, { align: 'center' });
            doc.font('Helvetica')
                .text(`CIF nº ${cif}`, { align: 'center' })
                .text(direccionDespacho, { align: 'center' });

            doc.moveDown(1.5);
            doc.fontSize(18).fillColor('#1e3a5f').font('Helvetica-Bold').text('FACTURA', { align: 'center', underline: true });
            doc.moveDown(1.5);

            // Fecha / número / expediente (izquierda) y datos del cliente (derecha)
            const yDatos = doc.y;
            doc.fontSize(11).fillColor('#000').font('Helvetica');
            doc.text(`Fecha: ${new Date(factura.fechaEmision).toLocaleDateString('es-ES')}`, 50, yDatos, { width: 230 });
            doc.text(`Nº Factura: ${factura.numero}`, 50, yDatos + 14, { width: 230 });
            doc.text(`Expediente: ${factura.expediente.titulo}`, 50, yDatos + 28, { width: 230 });

            let yCliente = yDatos;
            doc.font('Helvetica-Bold').text(nombreCliente.toUpperCase(), 300, yCliente, { width: 245, align: 'right' });
            yCliente += doc.heightOfString(nombreCliente.toUpperCase(), { width: 245 }) + 2;
            doc.font('Helvetica');

            if (cliente.nif) {
                const texto = `${cliente.empresa ? 'CIF' : 'NIF'} nº: ${cliente.nif}`;
                doc.text(texto, 300, yCliente, { width: 245, align: 'right' });
                yCliente += doc.heightOfString(texto, { width: 245 }) + 2;
            }
            if (cliente.direccion) {
                doc.text(cliente.direccion, 300, yCliente, { width: 245, align: 'right' });
                yCliente += doc.heightOfString(cliente.direccion, { width: 245 }) + 2;
            }

            doc.y = Math.max(yDatos + 56, yCliente) + 20;

            // Texto introductorio
            doc.fontSize(11).fillColor('#000')
                .text(
                    'Factura de Honorarios profesionales devengados por los Letrados que suscriben con cargo al Cliente, con motivo de las actuaciones profesionales relativas al expediente arriba indicado.',
                    50, doc.y, { width: 495, align: 'justify' },
                );
            doc.moveDown(1.5);

            doc.moveDown(1);

            // Lista de conceptos
            doc.font('Helvetica-Bold').fontSize(11);
            for (const c of factura.conceptos ?? []) {
                const yLinea = doc.y;
                doc.text(c.descripcion, 50, yLinea, { width: 400 });
                doc.text(`${Number(c.importe).toFixed(2)} €`, 450, yLinea, { width: 95, align: 'right' });
                doc.moveDown(0.3);
            }
            doc.font('Helvetica');

            doc.moveDown(0.5);
            doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#000').lineWidth(1.5).stroke();
            doc.moveDown(1);

            // Tabla de totales
            const colLabel = 280, colValue = 460, colWidth = 85;
            let y = doc.y;

            doc.font('Helvetica-Bold').fontSize(11);
            doc.text('Importe Honorarios', colLabel, y, { width: 170 });
            doc.text(`${Number(factura.baseImponible).toFixed(2)} €`, colValue, y, { width: colWidth, align: 'right' });
            y += 16;

            doc.font('Helvetica');
            doc.text(`IVA ${Number(factura.tipoIva)}%`, colLabel, y, { width: 125 });
            doc.text(`${Number(factura.cuotaIva).toFixed(2)} €`, colValue, y, { width: colWidth, align: 'right' });
            y += 16;

            if (Number(factura.cuotaIrpf) > 0) {
                doc.text(`Retención IRPF ${Number(factura.tipoIrpf)}%`, colLabel, y, { width: 125 });
                doc.text(`-${Number(factura.cuotaIrpf).toFixed(2)} €`, colValue, y, { width: colWidth, align: 'right' });
                y += 16;
            }

            const totalSuplidos = (factura.suplidos ?? []).reduce((s: number, sup: any) => s + Number(sup.importe), 0);
            if (totalSuplidos > 0) {
                doc.text('Suplidos', colLabel, y, { width: 125 });
                doc.text(`${totalSuplidos.toFixed(2)} €`, colValue, y, { width: colWidth, align: 'right' });
                y += 16;
            }

            doc.moveTo(colLabel, y).lineTo(545, y).strokeColor('#000').stroke();
            y += 6;

            doc.font('Helvetica-Bold').fontSize(11);
            doc.text('TOTAL FACTURA', colLabel, y, { width: 125 });
            doc.text(`${Number(factura.total).toFixed(2)} €`, colValue, y, { width: colWidth, align: 'right' });
            y += 30;

            // Firma
            doc.rect(380, y, 165, 50).strokeColor('#000').stroke();
            doc.font('Helvetica').fontSize(11).text('Fdo.', 380, y + 10, { width: 165, align: 'center' });
            doc.font('Helvetica-Bold').text(nombreDespacho, 380, y + 24, { width: 165, align: 'center' });

            if (factura.notas) {
                doc.font('Helvetica').fontSize(11).fillColor('#666')
                    .text(`Notas: ${factura.notas}`, 50, y + 70, { width: 495 });
            }

            doc.moveTo(50, 690).lineTo(545, 690).strokeColor('#000').lineWidth(1.5).stroke();

            // Pie de página: condiciones de pago
            doc.fontSize(11).fillColor('#000');
            doc.font('Helvetica-Bold').text('CONDICIONES Y FORMAS DE PAGO:', 50, 700, { width: 495 });
            doc.font('Helvetica').text(
                `El pago se hará efectivo en un plazo no superior a ${diasPago} días, en la Cuenta Corriente del Banco ${banco} nº ${iban}.`,
                50, 714, { width: 495 },
            );
            doc.text(`Concepto: ${nombreCliente} — Factura ${factura.numero}.`, 50, 742, { width: 495 });

            doc.end();
        });
    }
}