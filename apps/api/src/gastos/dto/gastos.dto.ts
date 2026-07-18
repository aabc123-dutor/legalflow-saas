import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsBoolean, Min, Max } from 'class-validator';

export enum CategoriaGasto {
    ALQUILER = 'ALQUILER',
    SUMINISTROS = 'SUMINISTROS',
    MATERIAL_OFICINA = 'MATERIAL_OFICINA',
    SERVICIOS_PROFESIONALES = 'SERVICIOS_PROFESIONALES',
    CUOTA_AUTONOMOS = 'CUOTA_AUTONOMOS',
    COLEGIO_PROFESIONAL = 'COLEGIO_PROFESIONAL',
    SEGUROS = 'SEGUROS',
    SOFTWARE_SUSCRIPCIONES = 'SOFTWARE_SUSCRIPCIONES',
    FORMACION = 'FORMACION',
    PUBLICIDAD = 'PUBLICIDAD',
    MANUTENCION = 'MANUTENCION',
    VEHICULO_DESPLAZAMIENTO = 'VEHICULO_DESPLAZAMIENTO',
    GASTOS_FINANCIEROS = 'GASTOS_FINANCIEROS',
    TRIBUTOS = 'TRIBUTOS',
    AMORTIZACION = 'AMORTIZACION',
    OTROS = 'OTROS',
}

export enum FrecuenciaGasto {
    MENSUAL = 'MENSUAL',
    TRIMESTRAL = 'TRIMESTRAL',
    CUATRIMESTRAL = 'CUATRIMESTRAL',
    SEMESTRAL = 'SEMESTRAL',
    ANUAL = 'ANUAL',
}

export class CreateGastoDto {
    @IsDateString()
    fecha: string;

    @IsEnum(CategoriaGasto)
    categoria: CategoriaGasto;

    @IsString()
    proveedor: string;

    @IsOptional() @IsString()
    nifProveedor?: string;

    @IsOptional() @IsString()
    numeroFactura?: string;

    @IsOptional() @IsString()
    descripcion?: string;

    @IsNumber() @Min(0)
    baseImponible: number;

    @IsOptional() @IsNumber() @Min(0) @Max(100)
    tipoIva?: number;

    @IsOptional() @IsBoolean()
    deducible?: boolean;

    @IsOptional() @IsNumber() @Min(0) @Max(100)
    ivaDeduciblePct?: number;

    @IsOptional() @IsNumber() @Min(0) @Max(100)
    irpfDeduciblePct?: number;

    // Recurrencia
    @IsOptional() @IsBoolean()
    recurrente?: boolean;

    @IsOptional() @IsEnum(FrecuenciaGasto)
    frecuencia?: FrecuenciaGasto;

    @IsOptional() @IsDateString()
    fechaFin?: string;

    @IsOptional() @IsString()
    notas?: string;
}

export class UpdateGastoDto {
    @IsOptional() @IsDateString() fecha?: string;
    @IsOptional() @IsEnum(CategoriaGasto) categoria?: CategoriaGasto;
    @IsOptional() @IsString() proveedor?: string;
    @IsOptional() @IsString() nifProveedor?: string;
    @IsOptional() @IsString() numeroFactura?: string;
    @IsOptional() @IsString() descripcion?: string;
    @IsOptional() @IsNumber() @Min(0) baseImponible?: number;
    @IsOptional() @IsNumber() @Min(0) @Max(100) tipoIva?: number;
    @IsOptional() @IsBoolean() deducible?: boolean;
    @IsOptional() @IsNumber() @Min(0) @Max(100) ivaDeduciblePct?: number;
    @IsOptional() @IsNumber() @Min(0) @Max(100) irpfDeduciblePct?: number;

    // Recurrencia
    @IsOptional() @IsBoolean() recurrente?: boolean;
    @IsOptional() @IsEnum(FrecuenciaGasto) frecuencia?: FrecuenciaGasto;
    @IsOptional() @IsDateString() fechaFin?: string;

    @IsOptional() @IsString() notas?: string;
}