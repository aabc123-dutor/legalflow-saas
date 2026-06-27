import { IsOptional, IsNumber, IsBoolean, IsString, Min, Max } from 'class-validator';

export class UpdateConfigFiscalDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tipoIva?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tipoIrpf?: number;

  @IsOptional()
  @IsBoolean()
  nuevoProfesional?: boolean;

  @IsOptional()
  @IsString()
  nif?: string;

  @IsOptional()
  @IsString()
  epigrafeCnae?: string;

  @IsOptional()
  @IsString()
  titulares?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  iban?: string;

  @IsOptional()
  @IsString()
  banco?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  diasPago?: number;
}