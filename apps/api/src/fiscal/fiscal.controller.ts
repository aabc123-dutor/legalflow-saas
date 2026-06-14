import { Controller, Get, Patch, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FiscalService } from './fiscal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Fiscal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('fiscal')
export class FiscalController {
  constructor(private readonly service: FiscalService) {}

  @Get('config')
  getConfig(@CurrentUser() user: { sub: string }) {
    return this.service.getConfig(user.sub);
  }

  @Patch('config')
  updateConfig(@CurrentUser() user: { sub: string }, @Body() body: any) {
    return this.service.updateConfig(user.sub, body);
  }

  @Get('resumen/:anio')
  getResumen(@Param('anio', ParseIntPipe) anio: number, @CurrentUser() user: { sub: string }) {
    return this.service.getResumenTrimestral(user.sub, anio);
  }

  @Get('calcular/:base')
  calcular(@Param('base') base: string, @CurrentUser() user: { sub: string }) {
    return this.service.calcularCuotas(user.sub, parseFloat(base));
  }

  @Get('modelo303/:anio/:trimestre')
  modelo303(
    @Param('anio', ParseIntPipe) anio: number,
    @Param('trimestre', ParseIntPipe) trimestre: number,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.getModelo303(user.sub, anio, trimestre);
  }

  @Get('modelo130/:anio/:trimestre')
  modelo130(
    @Param('anio', ParseIntPipe) anio: number,
    @Param('trimestre', ParseIntPipe) trimestre: number,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.getModelo130(user.sub, anio, trimestre);
  }
}
