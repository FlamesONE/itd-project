export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter: number;
}

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export interface IRateLimiter {
  checkLimit(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult>;
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  global: { limit: 100, windowMs: 60000 },
  login: { limit: 5, windowMs: 300000 },
  register: { limit: 3, windowMs: 3600000 },
  createPost: { limit: 30, windowMs: 3600000 },
  likePost: { limit: 100, windowMs: 3600000 },
  follow: { limit: 50, windowMs: 3600000 },
  comment: { limit: 60, windowMs: 3600000 },
};

export const SUSPICIOUS_RATE_LIMITS: Record<string, RateLimitConfig> = {
  global: { limit: 20, windowMs: 60000 },
  createPost: { limit: 5, windowMs: 3600000 },
  likePost: { limit: 20, windowMs: 3600000 },
  follow: { limit: 10, windowMs: 3600000 },
  comment: { limit: 10, windowMs: 3600000 },
};
