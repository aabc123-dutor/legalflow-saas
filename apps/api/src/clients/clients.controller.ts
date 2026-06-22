import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClientesService } from './clients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CreateClienteDto, UpdateClienteDto } from './dto/cliente.dto';


@ApiTags('Clientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clients')
@Roles('ABOGADO')
export class ClientesController {
  constructor(private readonly service: ClientesService) { }

  @Get()
  findAll(@CurrentUser() user: { sub: string }) {
    return this.service.findAll(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.service.findOne(id, user.sub);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.service.remove(id, user.sub);
  }

  @Post()
  create(@Body() body: CreateClienteDto, @CurrentUser() user: { sub: string }) {
    return this.service.create(user.sub, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateClienteDto, @CurrentUser() user: { sub: string }) {
    return this.service.update(id, user.sub, body);
  }
}
