import type { Redis } from "ioredis";
import type { IRateLimiter, RateLimitResult } from "../../../domain/antibot";
import { getRedis } from "../../persistence/redis/connection";

export class RateLimiter implements IRateLimiter {
  private redis: Redis;

  constructor() {
    this.redis = getRedis();
  }

  async checkLimit(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - windowMs;
    const redisKey = `ratelimit:${key}`;

    try {

      const multi = this.redis.multi();

      multi.zremrangebyscore(redisKey, 0, windowStart);

      multi.zadd(redisKey, now, `${now}-${Math.random()}`);

      multi.zcard(redisKey);

      multi.expire(redisKey, Math.ceil(windowMs / 1000));

      const results = await multi.exec();

      if (!results) {
        return {
          allowed: true,
          remaining: limit,
          resetAt: now + windowMs,
          retryAfter: 0,
        };
      }

      const requestCount = results[2][1] as number;

      return {
        allowed: requestCount <= limit,
        remaining: Math.max(0, limit - requestCount),
        resetAt: now + windowMs,
        retryAfter: requestCount > limit ? windowMs : 0,
      };
    } catch (error) {

      console.error("RateLimiter error:", error);
      return {
        allowed: true,
        remaining: limit,
        resetAt: now + windowMs,
        retryAfter: 0,
      };
    }
  }
}
