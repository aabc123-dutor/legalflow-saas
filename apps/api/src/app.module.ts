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
import { RolesGuard } from './auth/guards/roles.guard';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { EmailModule } from './common/email/email.module';
import { S3Module } from './common/s3/s3.module';
import { GastosModule } from './gastos/gastos.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { AuditoriaInterceptor } from './auditoria/auditoria.interceptor';

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
    EmailModule,
    S3Module,
    GastosModule,
    AuditoriaModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditoriaInterceptor,
    },
  ],
})
export class AppModule { }
