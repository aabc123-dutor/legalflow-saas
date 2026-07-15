import { Controller, Get, Patch, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FiscalService } from './fiscal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { UpdateConfigFiscalDto } from './dto/fiscal.dto';

type AuthUser = { sub: string; despachoId: string };

@ApiTags('Fiscal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('ABOGADO')
@Controller('fiscal')
export class FiscalController {
  constructor(private readonly service: FiscalService) { }

  @Get('config')
  getConfig(@CurrentUser() user: AuthUser) {
    return this.service.getConfig(user.despachoId);
  }

  @Patch('config')
  updateConfig(@CurrentUser() user: AuthUser, @Body() body: UpdateConfigFiscalDto) {
    return this.service.updateConfig(user.despachoId, body);
  }

  @Get('resumen/:anio')
  getResumen(@Param('anio', ParseIntPipe) anio: number, @CurrentUser() user: AuthUser) {
    return this.service.getResumenTrimestral(user.despachoId, anio);
  }

  @Get('calcular/:base')
  calcular(@Param('base') base: string, @CurrentUser() user: AuthUser) {
    return this.service.calcularCuotas(user.despachoId, parseFloat(base));
  }

  @Get('modelo303/:anio/:trimestre')
  modelo303(
    @Param('anio', ParseIntPipe) anio: number,
    @Param('trimestre', ParseIntPipe) trimestre: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.getModelo303(user.despachoId, anio, trimestre);
  }

  @Get('modelo130/:anio/:trimestre')
  modelo130(
    @Param('anio', ParseIntPipe) anio: number,
    @Param('trimestre', ParseIntPipe) trimestre: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.getModelo130(user.despachoId, anio, trimestre);
  }

  @Get('gastos/:anio')
  gastos(@Param('anio', ParseIntPipe) anio: number, @CurrentUser() user: AuthUser) {
    return this.service.getResumenGastosTrimestral(user.despachoId, anio);
  }
}