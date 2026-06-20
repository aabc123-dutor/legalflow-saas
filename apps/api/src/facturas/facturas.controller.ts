import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FacturasService } from './facturas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Facturas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('facturas')
export class FacturasController {
  constructor(private readonly service: FacturasService) {}

  @Get()
  findAll(@CurrentUser() user: { sub: string }) {
    return this.service.findAll(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.service.findOne(id, user.sub);
  }

  @Post()
  create(@Body() body: any, @CurrentUser() user: { sub: string }) {
    return this.service.create(user.sub, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @CurrentUser() user: { sub: string }) {
    return this.service.update(id, user.sub, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.service.remove(id, user.sub);
  }
}
