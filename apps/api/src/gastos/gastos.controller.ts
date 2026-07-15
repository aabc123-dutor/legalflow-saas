import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards,
  UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { GastosService } from './gastos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateGastoDto, UpdateGastoDto } from './dto/gastos.dto';

type AuthUser = { sub: string; despachoId: string };

@ApiTags('Gastos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('ABOGADO')
@Controller('gastos')
export class GastosController {
  constructor(private readonly service: GastosService) { }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user.despachoId);
  }

  @Get('recurrentes')
  findPlantillas(@CurrentUser() user: AuthUser) {
    return this.service.findPlantillas(user.despachoId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.findOne(id, user.despachoId);
  }

  @Post()
  create(@Body() body: CreateGastoDto, @CurrentUser() user: AuthUser) {
    return this.service.create(user.despachoId, user.sub, body);
  }

  @Patch('recurrentes/:id')
  reemplazarRecurrente(@Param('id') id: string, @Body() body: CreateGastoDto, @CurrentUser() user: AuthUser) {
    return this.service.reemplazarRecurrente(id, user.despachoId, user.sub, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateGastoDto, @CurrentUser() user: AuthUser) {
    return this.service.update(id, user.despachoId, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.remove(id, user.despachoId);
  }

  // ── Justificante ──────────────────────────────────────────────────────────
  @Post(':id/justificante')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  subirJustificante(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 }), // 20MB
          new FileTypeValidator({ fileType: /(pdf|jpeg|png)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.subirJustificante(id, user.despachoId, file);
  }

  @Get(':id/justificante')
  async getJustificanteUrl(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const url = await this.service.getUrlJustificante(id, user.despachoId);
    return { url };
  }

  @Delete(':id/justificante')
  eliminarJustificante(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.eliminarJustificante(id, user.despachoId);
  }

  @Delete('recurrentes/:id')
  eliminarRecurrente(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.eliminarRecurrente(id, user.despachoId);
  }

}