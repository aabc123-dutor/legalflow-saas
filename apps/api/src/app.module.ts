import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClientesModule } from './clients/clients.module';
import { ExpedientesModule } from './expedientes/expedientes.module';
import { DocumentosModule } from './documentos/documentos.module';
import { FacturasModule } from './facturas/facturas.module';
import { FiscalModule } from './fiscal/fiscal.module';
import { AiModule } from './ai/ai.module';
import { RedisModule } from './common/redis/redis.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    // Rate limiting
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Bull queue with Redis
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD || undefined,
        },
      }),
    }),

    // Core
    PrismaModule,
    RedisModule,
    // Feature modules
    AuthModule,
    UsersModule,
    ClientesModule,
    ExpedientesModule,
    DocumentosModule,
    FacturasModule,
    FiscalModule,
    AiModule,
  ],
})
export class AppModule {}
