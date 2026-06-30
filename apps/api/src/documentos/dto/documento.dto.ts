import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';

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
}