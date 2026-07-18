import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FacturasService } from './facturas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateFacturaDto, UpdateFacturaDto, CreateSuplidoDto, CreateConceptoDto } from './dto/facturas.dto';
import { Auditar } from '../auditoria/decorators/auditoria.decorator';

type AuthUser = { sub: string; despachoId: string };

@ApiTags('Facturas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('ABOGADO')
@Controller('facturas')
export class FacturasController {
  constructor(private readonly service: FacturasService) { }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user.despachoId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.findOne(id, user.despachoId);
  }

  @Post()
  create(@Body() body: CreateFacturaDto, @CurrentUser() user: AuthUser) {
    return this.service.create(user.despachoId, user.sub, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateFacturaDto, @CurrentUser() user: AuthUser) {
    return this.service.update(id, user.despachoId, user.sub, body);
  }

  @Get(':id/pdf')
  @Auditar({ accion: 'DOWNLOAD' })
  async getPdfUrl(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const url = await this.service.getUrlDescarga(id, user.despachoId);
    return { url };
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.remove(id, user.despachoId);
  }

  @Post(':id/suplidos')
  createSuplido(@Param('id') id: string, @Body() body: CreateSuplidoDto, @CurrentUser() user: AuthUser) {
    return this.service.createSuplido(id, user.despachoId, body);
  }

  @Delete('suplidos/:suplidoId')
  removeSuplido(@Param('suplidoId') suplidoId: string, @CurrentUser() user: AuthUser) {
    return this.service.removeSuplido(suplidoId, user.despachoId);
  }

  @Post(':id/conceptos')
  createConcepto(@Param('id') id: string, @Body() body: CreateConceptoDto, @CurrentUser() user: AuthUser) {
    return this.service.createConcepto(id, user.despachoId, body);
  }

  @Delete('conceptos/:conceptoId')
  removeConcepto(@Param('conceptoId') conceptoId: string, @CurrentUser() user: AuthUser) {
    return this.service.removeConcepto(conceptoId, user.despachoId);
  }
}