import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClientesService } from './clients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CreateClienteDto, UpdateClienteDto } from './dto/cliente.dto';

type AuthUser = { sub: string; despachoId: string };

@ApiTags('Clientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clients')
@Roles('ABOGADO')
export class ClientesController {
  constructor(private readonly service: ClientesService) { }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user.despachoId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.findOne(id, user.despachoId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.remove(id, user.despachoId);
  }

  @Post()
  create(@Body() body: CreateClienteDto, @CurrentUser() user: AuthUser) {
    return this.service.create(user.despachoId, user.sub, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateClienteDto, @CurrentUser() user: AuthUser) {
    return this.service.update(id, user.despachoId, body);
  }
}