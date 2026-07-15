import { Module } from '@nestjs/common';
import { FiscalController } from './fiscal.controller';
import { FiscalService } from './fiscal.service';
import { RecurrentesModule } from '../gastos/recurrentes.module';

@Module({
  imports: [RecurrentesModule],
  controllers: [FiscalController],
  providers: [FiscalService],
  exports: [FiscalService],
})
export class FiscalModule { } 