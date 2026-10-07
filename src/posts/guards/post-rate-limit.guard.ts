import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class PostRateLimitGuard implements CanActivate {
  private readonly limit = 5;
  private readonly windowInSeconds = 60;

  constructor(
    private readonly redisService: RedisService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // برای جلوگیری از خطای احتمالی در صورت نبود user
    const userId = request.user?.id;

    const key = `rate-limit:posts:${userId}`;

    const count = await this.redisService.increment(key);

    if (count === 1) {
      await this.redisService.expire(
        key,
        this.windowInSeconds,
      );
    }

    if (count > this.limit) {
      throw new HttpException(
        'Post creation rate limit exceeded. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
