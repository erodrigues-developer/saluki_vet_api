import { Module, OnApplicationShutdown, Inject } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import RedisService from './services/redis.service';
@Module({
  imports: [ConfigModule],
  providers: [RedisService, {
    provide: 'SIGMAVET_REDIS', inject: [ConfigService],
    useFactory: async (config: ConfigService) => {
      const client = new Redis({
      host: config.get<string>('REDIS_HOST') || 'redis_template_api',
      port: Number(config.get<string>('REDIS_PORT') || 6379),
      username: config.get<string>('REDIS_USERNAME') || undefined,
      password: config.get<string>('REDIS_PASSWORD') || undefined,
      tls: config.get<string>('REDIS_SCHEMA') === 'rediss' ? {} : undefined,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
      connectTimeout: 5000,
      retryStrategy: (attempt) => attempt <= 3 ? attempt * 100 : null,
    });
      await client.connect();
      return client;
    },
  }],
  exports: [RedisService],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject('SIGMAVET_REDIS') private readonly client: Redis) {}
  async onApplicationShutdown() { if (this.client.status === 'ready') await this.client.quit(); else this.client.disconnect(); }
}
