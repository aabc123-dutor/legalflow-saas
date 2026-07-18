import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ExpedientesService } from './expedientes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CreateExpedienteDto, UpdateExpedienteDto,
  CreateHitoDto, UpdateHitoDto,
  CreateNotaDto, UpdateNotaDto,
} from './dto/expediente.dto';

type AuthUser = { sub: string; despachoId: string };

@ApiTags('Expedientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('ABOGADO')
@Controller('expedientes')
export class ExpedientesController {
  constructor(private readonly service: ExpedientesService) { }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user.despachoId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.findOne(id, user.despachoId);
  }

  @Post()
  create(@Body() body: CreateExpedienteDto, @CurrentUser() user: AuthUser) {
    return this.service.create(user.despachoId, user.sub, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateExpedienteDto, @CurrentUser() user: AuthUser) {
    return this.service.update(id, user.despachoId, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.remove(id, user.despachoId);
  }

  // Hitos
  @Post(':id/hitos')
  createHito(@Param('id') id: string, @Body() body: CreateHitoDto, @CurrentUser() user: AuthUser) {
    return this.service.createHito(id, user.despachoId, body);
  }

  @Patch('hitos/:hitoId')
  updateHito(@Param('hitoId') hitoId: string, @Body() body: UpdateHitoDto, @CurrentUser() user: AuthUser) {
    return this.service.updateHito(hitoId, user.despachoId, body);
  }

  @Delete('hitos/:hitoId')
  removeHito(@Param('hitoId') hitoId: string, @CurrentUser() user: AuthUser) {
    return this.service.removeHito(hitoId, user.despachoId);
  }

  // Notas
  @Post(':id/notas')
  createNota(@Param('id') id: string, @Body() body: CreateNotaDto, @CurrentUser() user: AuthUser) {
    return this.service.createNota(id, user.despachoId, body);
  }

  @Patch('notas/:notaId')
  updateNota(@Param('notaId') notaId: string, @Body() body: UpdateNotaDto, @CurrentUser() user: AuthUser) {
    return this.service.updateNota(notaId, user.despachoId, body);
  }

  @Delete('notas/:notaId')
  removeNota(@Param('notaId') notaId: string, @CurrentUser() user: AuthUser) {
    return this.service.removeNota(notaId, user.despachoId);
  }

  @Get('hitos/proximos')
  proximosHitos(@CurrentUser() user: AuthUser) {
    return this.service.proximosHitos(user.despachoId);
  }

}