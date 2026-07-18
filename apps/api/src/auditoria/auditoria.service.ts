import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma, TipoAuditLog } from '@prisma/client';
import { ListarAuditoriaDto } from './dto/auditoria.dto';

export interface RegistroAuditoria {
  despachoId?: string | null;
  usuarioId?: string | null;
  accion: TipoAuditLog;
  entidad: string;
  entidadId?: string | null;
  detalle?: any;
  ip?: string | null;
  userAgent?: string | null;
}

// Nunca deben acabar en el registro de auditoría
const CLAVES_SENSIBLES = [
  'password', 'passwordactual', 'passwordnueva', 'newpassword', 'passwordhash',
  'token', 'accesstoken', 'refreshtoken', 'secret',
];

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(private prisma: PrismaService) {}

  /** Oculta contraseñas/tokens y recorta payloads grandes */
  sanear(valor: any, profundidad = 0): any {
    if (valor === null || valor === undefined) return valor;
    if (profundidad > 3) return '[…]';
    if (Array.isArray(valor)) return valor.slice(0, 20).map((v) => this.sanear(v, profundidad + 1));
    if (typeof valor === 'object') {
      const salida: Record<string, any> = {};
      for (const [k, v] of Object.entries(valor)) {
        salida[k] = CLAVES_SENSIBLES.includes(k.toLowerCase()) ? '[oculto]' : this.sanear(v, profundidad + 1);
      }
      return salida;
    }
    if (typeof valor === 'string' && valor.length > 500) return valor.slice(0, 500) + '…';
    return valor;
  }

  /** Registra un evento. Nunca lanza: la auditoría jamás debe tumbar la operación. */
  async registrar(r: RegistroAuditoria): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          despachoId: r.despachoId ?? null,
          usuarioId: r.usuarioId ?? null,
          accion: r.accion,
          entidad: r.entidad,
          entidadId: r.entidadId ?? null,
          detalle: r.detalle === undefined ? undefined : (this.sanear(r.detalle) as Prisma.InputJsonValue),
          ip: r.ip ?? null,
          userAgent: r.userAgent ?? null,
        },
      });
    } catch (e) {
      this.logger.warn(`No se pudo registrar la auditoría (${r.accion} ${r.entidad}): ${e}`);
    }
  }

  async listar(despachoId: string, f: ListarAuditoriaDto) {
    const page = f.page ?? 1;
    const limit = Math.min(f.limit ?? 50, 200);

    const where: Prisma.AuditLogWhereInput = {
      despachoId,
      ...(f.accion && { accion: f.accion }),
      ...(f.entidad && { entidad: f.entidad }),
      ...(f.entidadId && { entidadId: f.entidadId }),
      ...(f.usuarioId && { usuarioId: f.usuarioId }),
      ...((f.desde || f.hasta) && {
        createdAt: {
          ...(f.desde && { gte: new Date(f.desde) }),
          ...(f.hasta && { lte: new Date(f.hasta) }),
        },
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          usuario: { select: { id: true, nombre: true, apellidos: true, email: true, role: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, limit, paginas: Math.ceil(total / limit) };
  }
}