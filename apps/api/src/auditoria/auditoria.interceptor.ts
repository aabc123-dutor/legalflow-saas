import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { TipoAuditLog } from '@prisma/client';
import { AuditoriaService } from './auditoria.service';
import { AUDITAR_KEY, SIN_AUDITAR_KEY, OpcionesAuditar } from './decorators/auditoria.decorator';

const ACCION_POR_METODO: Record<string, TipoAuditLog | undefined> = {
  POST: 'CREATE',
  PATCH: 'UPDATE',
  PUT: 'UPDATE',
  DELETE: 'DELETE',
};

@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
  constructor(private auditoria: AuditoriaService, private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (this.reflector.getAllAndOverride<boolean>(SIN_AUDITAR_KEY, [context.getHandler(), context.getClass()])) {
      return next.handle();
    }

    const opciones = this.reflector.getAllAndOverride<OpcionesAuditar>(AUDITAR_KEY, [
      context.getHandler(), context.getClass(),
    ]);
    const req = context.switchToHttp().getRequest();
    const accion = opciones?.accion ?? ACCION_POR_METODO[req.method];

    // Un GET sin @Auditar no se registra (si no, ahogaríamos la tabla)
    if (!accion) return next.handle();

    const entidad = opciones?.entidad ?? context.getClass().name.replace(/Controller$/, '').toLowerCase();

    return next.handle().pipe(
      tap((respuesta) => {
        // Solo se registra si la operación fue bien; y nunca afecta a la respuesta
        void this.auditoria.registrar({
          despachoId: req.user?.despachoId ?? respuesta?.user?.despachoId ?? null,
          usuarioId: req.user?.sub ?? respuesta?.user?.id ?? null,
          accion,
          entidad,
          entidadId: req.params?.id ?? respuesta?.id ?? null,
          detalle: this.detalle(req),
          ip: this.ip(req),
          userAgent: req.headers?.['user-agent'] ?? null,
        });
      }),
    );
  }

  private detalle(req: any) {
    const body = req.body && Object.keys(req.body).length ? req.body : undefined;
    const fichero = req.file ? { fichero: req.file.originalname, tamano: req.file.size } : undefined;
    if (!body && !fichero) return undefined;
    return { ...(body ?? {}), ...(fichero ?? {}) };
  }

  /** Detrás del proxy de Railway, req.ip es el del proxy: la real va en x-forwarded-for */
  private ip(req: any): string | null {
    const fwd = req.headers?.['x-forwarded-for'];
    if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
    return req.ip ?? req.socket?.remoteAddress ?? null;
  }
}