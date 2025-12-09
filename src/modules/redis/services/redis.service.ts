import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export default class RedisService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async set(key: string, value: any, time: number): Promise<void> {
    await this.redis.set(key, value);
    await this.redis.expire(key, time);
  }

  async ping(): Promise<boolean> {
    const response = await this.redis.ping();
    return response === 'PONG';
  }
}
