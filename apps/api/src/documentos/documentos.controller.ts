import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards,
  UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { DocumentosService } from './documentos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UploadDocumentoDto } from './dto/documento.dto';

type AuthUser = { sub: string; despachoId: string };

@ApiTags('Documentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documentos')
export class DocumentosController {
  constructor(private readonly service: DocumentosService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user.despachoId);
  }

  @Get('expediente/:expedienteId')
  findByExpediente(@Param('expedienteId') expedienteId: string, @CurrentUser() user: AuthUser) {
    return this.service.findByExpediente(expedienteId, user.despachoId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.findOne(id, user.despachoId);
  }

  @Get(':id/descargar')
  async getDownloadUrl(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const url = await this.service.getUrlDescarga(id, user.despachoId);
    return { url };
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 }), // 20MB
          new FileTypeValidator({
            fileType: /(pdf|msword|vnd\.openxmlformats-officedocument|vnd\.ms-excel|jpeg|png)/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() body: UploadDocumentoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.create(user.despachoId, user.sub, file, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @CurrentUser() user: AuthUser) {
    return this.service.update(id, user.despachoId, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.remove(id, user.despachoId);
  }
}