import { IsString, IsOptional, IsEnum, IsDateString, IsUUID, IsNumber, Min, ValidateNested, IsArray, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export enum EstadoFactura {
  BORRADOR = 'BORRADOR',
  EMITIDA = 'EMITIDA',
  PAGADA = 'PAGADA',
  VENCIDA = 'VENCIDA',
  ANULADA = 'ANULADA',
}

export class ConceptoDto {
  @IsString()
  descripcion: string;

  @IsNumber()
  @Min(0)
  importe: number;
}

export class CreateFacturaDto {
  @IsUUID()
  expedienteId: string;

  @IsOptional()
  @IsString()
  numero?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ConceptoDto)
  conceptos: ConceptoDto[];

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
  @IsString()
  numero?: string;

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

export class CreateConceptoDto {
  @IsString()
  descripcion: string;

  @IsNumber()
  @Min(0)
  importe: number;
}