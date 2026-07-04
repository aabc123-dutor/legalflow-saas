import { IsString, IsOptional, IsEnum, IsUUID, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export enum TipoDocumento {
  CONTRATO = 'CONTRATO',
  ESCRITO_JUDICIAL = 'ESCRITO_JUDICIAL',
  DICTAMEN = 'DICTAMEN',
  PODER_NOTARIAL = 'PODER_NOTARIAL',
  FACTURA_PDF = 'FACTURA_PDF',
  OTRO = 'OTRO',
}

export class UploadDocumentoDto {
  @IsUUID()
  expedienteId: string;

  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsEnum(TipoDocumento)
  tipo?: TipoDocumento;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  visibleParaCliente?: boolean;
}

export class UpdateDocumentoDto {
  @IsOptional()
  @IsBoolean()
  visibleParaCliente?: boolean;

  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}