import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import RedisService from './modules/redis/services/redis.service';
import { performance } from 'perf_hooks';

export type HealthStatus = 'up' | 'down';

export interface HealthCheckResult {
  status: HealthStatus;
  latencyMs?: number;
  error?: string;
  details?: Record<string, any>;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptimeSeconds: number;
  checks: {
    database: HealthCheckResult;
    redis: HealthCheckResult;
    memory: HealthCheckResult;
  };
  version?: string;
}

@Injectable()
export class AppService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async getHealth(): Promise<HealthResponse> {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const memory = this.checkMemory();
    const allUp = [database, redis, memory].every(
      (check) => check.status === 'up',
    );

    return {
      status: allUp ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      checks: { database, redis, memory },
      version: this.configService.get<string>('npm_package_version'),
    };
  }

  private async checkDatabase(): Promise<HealthCheckResult> {
    const start = performance.now();
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'up', latencyMs: performance.now() - start };
    } catch (error) {
      return {
        status: 'down',
        error: (error as Error).message,
      };
    }
  }

  private async checkRedis(): Promise<HealthCheckResult> {
    const start = performance.now();
    try {
      const ok = await this.redisService.ping();
      return ok
        ? { status: 'up', latencyMs: performance.now() - start }
        : { status: 'down', error: 'Ping failed' };
    } catch (error) {
      return {
        status: 'down',
        error: (error as Error).message,
      };
    }
  }

  private checkMemory(): HealthCheckResult {
    const mem = process.memoryUsage();
    return {
      status: 'up',
      details: {
        rssMB: +(mem.rss / 1024 / 1024).toFixed(2),
        heapUsedMB: +(mem.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMB: +(mem.heapTotal / 1024 / 1024).toFixed(2),
      },
    };
  }
}
