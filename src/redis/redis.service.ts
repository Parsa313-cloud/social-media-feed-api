import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly redis = new Redis(
    process.env.REDIS_URL ?? 'redis://localhost:6379',
  );

  async onModuleInit() {
    await this.redis.ping();
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  }

  async set(
    key: string,
    value: unknown,
    ttlInSeconds?: number,
  ) {
    const serializedValue = JSON.stringify(value);

    if (ttlInSeconds) {
      await this.redis.set(
        key,
        serializedValue,
        'EX',
        ttlInSeconds,
      );

      return;
    }

    await this.redis.set(key, serializedValue);
  }

  async del(key: string) {
    await this.redis.del(key);
  }
  async deleteByPattern(pattern: string) {
    let cursor = '0';

    do {
        const [nextCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
        );

        cursor = nextCursor;

        if (keys.length > 0) {
        await this.redis.del(...keys);
        }
    } while (cursor !== '0');
    }
}