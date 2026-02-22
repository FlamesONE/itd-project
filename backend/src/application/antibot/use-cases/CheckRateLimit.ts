import { Result, DomainError } from "../../../domain/shared/Result";
import type {
  IRateLimiter,
  RateLimitResult,
  RateLimitConfig,
} from "../../../domain/antibot";
import {
  RATE_LIMITS,
  SUSPICIOUS_RATE_LIMITS,
  RestrictionLevel,
} from "../../../domain/antibot";

export interface CheckRateLimitInput {
  userId?: string;
  ip: string;
  operation: string;
  restrictionLevel?: RestrictionLevel;
}

export class CheckRateLimit {
  constructor(private readonly rateLimiter: IRateLimiter) {}

  async execute(input: CheckRateLimitInput): Promise<Result<RateLimitResult>> {
    const { userId, ip, operation, restrictionLevel } = input;

    const isSuspicious =
      restrictionLevel === RestrictionLevel.HIGH ||
      restrictionLevel === RestrictionLevel.CRITICAL;

    const limits = isSuspicious ? SUSPICIOUS_RATE_LIMITS : RATE_LIMITS;
    const config: RateLimitConfig =
      limits[operation] || limits.global;

    const key = userId ? `user:${userId}:${operation}` : `ip:${ip}:${operation}`;

    const result = await this.rateLimiter.checkLimit(
      key,
      config.limit,
      config.windowMs
    );

    if (!result.allowed) {
      return Result.fail(
        new DomainError(
          `Rate limit exceeded. Try again in ${Math.ceil(result.retryAfter / 1000)} seconds`,
          "RATE_LIMIT_EXCEEDED"
        )
      );
    }

    return Result.ok(result);
  }
}
