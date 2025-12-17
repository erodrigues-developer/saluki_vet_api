import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from './modules/utils/exceptions/http.exception.filter';
import { SuccessLoggingInterceptor } from './modules/utils/interceptors/success.logging.interceptor';
import { LoggerModule } from './modules/logger/logger.module';
import { RedisModule } from './modules/redis/redis.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SqsModule } from './modules/sqs/sqs.module';
import { S3Module } from './modules/s3/s3.module';
import { ClientsModule } from './modules/clients/clients.module';
import { SpeciesModule } from './modules/species/species.module';
import configuration from './configs/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'postgres',
          host:
            configService.get<string>('DATABASE_HOST') ||
            'postgres_template_api',
          port: parseInt(
            configService.get<string>('DATABASE_PORT') || '5432',
          ),
          username: configService.get<string>('DATABASE_USERNAME') || 'postgres',
          password: configService.get<string>('DATABASE_PASSWORD') || 'postgres',
          database: configService.get<string>('DATABASE_NAME') || 'template',
          synchronize: false,
          autoLoadEntities: true,
          logging: process.env.DB_LOG == 'true' ? true : false,
        };
      },
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    RedisModule,
    LoggerModule,
    SqsModule,
    S3Module,
    ClientsModule,
    SpeciesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SuccessLoggingInterceptor,
    },
  ],
  exports: [TypeOrmModule],
})
export class AppModule {}
