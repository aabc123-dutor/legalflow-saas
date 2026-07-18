import { IsOptional, IsEnum, IsString, IsInt, Min, IsDateString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoAuditLog } from '@prisma/client';

export class ListarAuditoriaDto {
  @IsOptional() @IsEnum(TipoAuditLog) accion?: TipoAuditLog;
  @IsOptional() @IsString() entidad?: string;
  @IsOptional() @IsString() entidadId?: string;
  @IsOptional() @IsUUID() usuarioId?: string;
  @IsOptional() @IsDateString() desde?: string;
  @IsOptional() @IsDateString() hasta?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
}