import { Module } from '@nestjs/common';
import { ClientesController } from './clients.controller';
import { ClientesService } from './clients.service';

@Module({
  controllers: [ClientesController],
  providers: [ClientesService],
  exports: [ClientesService],
})
export class ClientesModule {}
