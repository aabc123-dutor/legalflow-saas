import { Module } from '@nestjs/common';
import { GastosController } from './gastos.controller';
import { GastosService } from './gastos.service';
import { FiscalModule } from '../fiscal/fiscal.module';
import { RecurrentesModule } from './recurrentes.module';

@Module({
  imports: [FiscalModule, RecurrentesModule],
  controllers: [GastosController],
  providers: [GastosService],
  exports: [GastosService],
})
export class GastosModule {}