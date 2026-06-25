import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';

class ChatDto {
  message: string;
  conversacionId?: string;
}

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('ABOGADO')
@Controller('ai')
export class AiController {
  constructor(private readonly service: AiService) {}

  @Post('navegacion')
  navegacion(@Body() body: ChatDto, @CurrentUser() user: {despachoId:string , sub: string }) {
    return this.service.navegacionChat( user.despachoId, user.sub, body.conversacionId ?? null, body.message);
  }

  @Post('jurisprudencia')
  jurisprudencia(@Body() body: ChatDto, @CurrentUser() user: { despachoId:string , sub: string }) {
    return this.service.jurisprudenciaChat(user.despachoId, user.sub, body.conversacionId ?? null, body.message);
  }

  @Get('conversaciones')
  conversaciones(
    @CurrentUser() user: { despachoId:string , sub: string},
    @Query('tipo') tipo?: 'NAVEGACION' | 'JURISPRUDENCIA',
  ) {
    return this.service.getConversaciones(user.despachoId, user.sub, tipo);
  }

  @Get('conversaciones/:id')
  conversacion(@Param('id') id: string, @CurrentUser() user: { despachoId:string , sub: string }) {
    return this.service.getConversacion(id, user.despachoId, user.sub);
  }
}
