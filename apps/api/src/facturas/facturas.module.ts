import { Module } from '@nestjs/common';
import { FacturasController } from './facturas.controller';
import { FacturasService } from './facturas.service';
import { FacturasPdfService } from './factura-pdf.service';
import { FiscalModule } from '../fiscal/fiscal.module';

@Module({
  imports: [FiscalModule],
  controllers: [FacturasController],
  providers: [FacturasService, FacturasPdfService],
  exports: [FacturasService],
})
export class FacturasModule {}