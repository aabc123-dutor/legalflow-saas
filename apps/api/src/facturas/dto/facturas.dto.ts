import { IsString, IsOptional, IsEnum, IsDateString, IsUUID, IsNumber, Min } from 'class-validator';

export enum EstadoFactura {
  BORRADOR = 'BORRADOR',
  EMITIDA = 'EMITIDA',
  PAGADA = 'PAGADA',
  VENCIDA = 'VENCIDA',
  ANULADA = 'ANULADA',
}

export class CreateFacturaDto {
  @IsUUID()
  expedienteId: string;

  @IsOptional()
  @IsString()
  numero?: string;

  @IsNumber()
  @Min(0)
  baseImponible: number;

  @IsDateString()
  fechaEmision: string;

  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;

  @IsOptional()
  @IsEnum(EstadoFactura)
  estado?: EstadoFactura;

  @IsOptional()
  @IsString()
  notas?: string;
}

export class UpdateFacturaDto {
  @IsOptional()
  @IsEnum(EstadoFactura)
  estado?: EstadoFactura;

  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;

  @IsOptional()
  @IsString()
  notas?: string;
}

export class CreateSuplidoDto {
  @IsString()
  concepto: string;

  @IsNumber()
  @Min(0)
  importe: number;
}