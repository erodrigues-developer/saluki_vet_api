import { Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export default class RedisService {
  constructor(@Inject('SIGMAVET_REDIS') private readonly redis: Redis) {}

  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async set(key: string, value: any, time: number): Promise<void> {
    await this.redis.set(key, value, 'EX', time);
  }

  async delete(key: string) { await this.redis.del(key); }
  async touchIfEqual(key: string, value: string, ttl: number) {
    return Number(await this.redis.eval("if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('EXPIRE', KEYS[1], ARGV[2]) else return 0 end", 1, key, value, ttl)) === 1;
  }
  async deleteIfEqual(key: string, value: string) {
    return Number(await this.redis.eval("if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end", 1, key, value)) === 1;
  }
  async incrementWithExpiry(key: string, ttl: number) {
    return Number(await this.redis.eval("local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end; return n", 1, key, ttl));
  }

  async ping(): Promise<boolean> {
    const response = await this.redis.ping();
    return response === 'PONG';
  }
}
