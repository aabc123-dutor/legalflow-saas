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

@ApiTags('Expedientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('ABOGADO')
@Controller('expedientes')
export class ExpedientesController {
  constructor(private readonly service: ExpedientesService) {}

  @Get()
  findAll(@CurrentUser() user: { sub: string }) {
    return this.service.findAll(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.service.findOne(id, user.sub);
  }

  @Post()
  create(@Body() body: CreateExpedienteDto, @CurrentUser() user: { sub: string }) {
    return this.service.create(user.sub, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateExpedienteDto, @CurrentUser() user: { sub: string }) {
    return this.service.update(id, user.sub, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.service.remove(id, user.sub);
  }

  // Hitos
  @Post(':id/hitos')
  createHito(@Param('id') id: string, @Body() body: CreateHitoDto, @CurrentUser() user: { sub: string }) {
    return this.service.createHito(id, user.sub, body);
  }

  @Patch('hitos/:hitoId')
  updateHito(@Param('hitoId') hitoId: string, @Body() body: UpdateHitoDto, @CurrentUser() user: { sub: string }) {
    return this.service.updateHito(hitoId, user.sub, body);
  }

  @Delete('hitos/:hitoId')
  removeHito(@Param('hitoId') hitoId: string, @CurrentUser() user: { sub: string }) {
    return this.service.removeHito(hitoId, user.sub);
  }

  // Notas
  @Post(':id/notas')
  createNota(@Param('id') id: string, @Body() body: CreateNotaDto, @CurrentUser() user: { sub: string }) {
    return this.service.createNota(id, user.sub, body);
  }

  @Patch('notas/:notaId')
  updateNota(@Param('notaId') notaId: string, @Body() body: UpdateNotaDto, @CurrentUser() user: { sub: string }) {
    return this.service.updateNota(notaId, user.sub, body);
  }

  @Delete('notas/:notaId')
  removeNota(@Param('notaId') notaId: string, @CurrentUser() user: { sub: string }) {
    return this.service.removeNota(notaId, user.sub);
  }

  @Get('hitos/proximos')
  proximosHitos(@CurrentUser() user: { sub: string }) {
    return this.service.proximosHitos(user.sub);
}
}