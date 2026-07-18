import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuditoriaService } from './auditoria.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { SinAuditar } from './decorators/auditoria.decorator';
import { ListarAuditoriaDto } from './dto/auditoria.dto';

type AuthUser = { sub: string; despachoId: string };

@ApiTags('Auditoría')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('ABOGADO')
@SinAuditar()
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly service: AuditoriaService) {}

  @Get()
  listar(@Query() query: ListarAuditoriaDto, @CurrentUser() user: AuthUser) {
    return this.service.listar(user.despachoId, query);
  }
}