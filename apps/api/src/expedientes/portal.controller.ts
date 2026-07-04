import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ExpedientesService } from './expedientes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

type AuthUser = { sub: string; despachoId: string };

@ApiTags('Portal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('portal')
export class PortalController {
  constructor(private readonly service: ExpedientesService) {}

  @Get('mis-expedientes')
  findMisExpedientes(@CurrentUser() user: AuthUser) {
    return this.service.findByClienteUsuario(user.sub, user.despachoId);
  }
}