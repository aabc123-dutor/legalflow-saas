import { Module } from '@nestjs/common';
import { RecurrentesService } from './recurrentes.service';

@Module({
  providers: [RecurrentesService],
  exports: [RecurrentesService],
})
export class RecurrentesModule {}