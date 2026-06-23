import { IsString, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';

export enum EstadoExpediente {
  ABIERTO = 'ABIERTO',
  EN_CURSO = 'EN_CURSO',
  PENDIENTE_CLIENTE = 'PENDIENTE_CLIENTE',
  ARCHIVADO = 'ARCHIVADO',
  CERRADO = 'CERRADO',
}

export class CreateExpedienteDto {
  @IsString()
  titulo: string;

  @IsUUID()
  clienteId: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsEnum(EstadoExpediente)
  estado?: EstadoExpediente;

  @IsOptional()
  @IsDateString()
  fechaApertura?: string;

  @IsOptional()
  @IsDateString()
  fechaCierre?: string;
}

export class UpdateExpedienteDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsEnum(EstadoExpediente)
  estado?: EstadoExpediente;

  @IsOptional()
  @IsDateString()
  fechaCierre?: string;
}

export class CreateHitoDto {
  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsDateString()
  fecha: string;
}

export class UpdateHitoDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;
}

export class CreateNotaDto {
  @IsString()
  contenido: string;
}

export class UpdateNotaDto {
  @IsOptional()
  @IsString()
  contenido?: string;
}