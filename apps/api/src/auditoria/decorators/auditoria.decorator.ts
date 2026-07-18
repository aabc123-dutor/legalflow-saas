import { SetMetadata } from '@nestjs/common';
import { TipoAuditLog } from '@prisma/client';

export const AUDITAR_KEY = 'auditar';
export const SIN_AUDITAR_KEY = 'sin_auditar';

export interface OpcionesAuditar {
  accion?: TipoAuditLog;
  entidad?: string;
}

/** Fuerza el registro de un endpoint (p. ej. una descarga GET) o cambia la acción/entidad deducidas. */
export const Auditar = (opciones: OpcionesAuditar = {}) => SetMetadata(AUDITAR_KEY, opciones);

/** Excluye un controlador o endpoint de la auditoría automática. */
export const SinAuditar = () => SetMetadata(SIN_AUDITAR_KEY, true);