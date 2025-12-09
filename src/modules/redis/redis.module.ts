import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule as IoredisModule } from '@nestjs-modules/ioredis';
import RedisService from './services/redis.service';

@Module({
  providers: [RedisService],
  imports: [
    ConfigModule,
    IoredisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const schema = configService.get<string>('REDIS_SCHEMA') || 'redis';
        const host =
          configService.get<string>('REDIS_HOST') || 'redis_template_api';
        const port = configService.get<string>('REDIS_PORT') || '6379';

        return {
          type: 'single',
          url: `${schema}://${host}:${port}`,
        };
      },
    }),
  ],
  exports: [IoredisModule, RedisService],
})
export class RedisModule {}
