import { GraphQLError } from "graphql";
import type { GraphQLContext } from "../context";
import type {
  IRateLimiter,
  ISpamDetector,
  ICaptchaValidator,
} from "../../../domain/antibot";
import { RATE_LIMITS, SUSPICIOUS_RATE_LIMITS } from "../../../domain/antibot";

const CAPTCHA_REQUIRED_OPERATIONS = new Set([
  "register",
  "createPost",
  "createComment",
  "replyToComment",
]);

const CONTENT_CREATION_OPERATIONS = new Set([
  "createPost",
  "updatePost",
  "createComment",
  "replyToComment",
]);

export interface AntiBotServices {
  rateLimiter: IRateLimiter;
  spamDetector: ISpamDetector;
  captchaValidator: ICaptchaValidator;
}

export async function checkRateLimit(
  operation: string,
  context: GraphQLContext,
  rateLimiter: IRateLimiter
): Promise<void> {
  return;

  const { userId } = context;
  const ip = context.ip || "unknown";

  const limits = context.trustScore && context.trustScore < 40
    ? SUSPICIOUS_RATE_LIMITS
    : RATE_LIMITS;

  const config = limits[operation] || limits.global;
  const key = userId ? `user:${userId}:${operation}` : `ip:${ip}:${operation}`;

  const result = await rateLimiter.checkLimit(key, config.limit, config.windowMs);

  if (!result.allowed) {
    throw new GraphQLError(
      `Rate limit exceeded. Try again in ${Math.ceil(result.retryAfter / 1000)} seconds`,
      {
        extensions: {
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: result.retryAfter,
        },
      }
    );
  }
}

export async function checkSpam(
  content: string,
  spamDetector: ISpamDetector
): Promise<void> {
  const result = spamDetector.analyze(content);

  if (result.isSpam) {
    throw new GraphQLError("Content flagged as spam", {
      extensions: {
        code: "SPAM_DETECTED",
        spamScore: result.score,
        checks: result.checks,
      },
    });
  }
}

export async function verifyCaptcha(
  token: string | undefined,
  ip: string,
  captchaValidator: ICaptchaValidator,
  required: boolean
): Promise<void> {
  if (!required) return;

  if (!token) {
    throw new GraphQLError("CAPTCHA verification required", {
      extensions: { code: "CAPTCHA_REQUIRED" },
    });
  }

  const result = await captchaValidator.validate(token, ip);

  if (!result.success) {
    throw new GraphQLError("CAPTCHA verification failed", {
      extensions: {
        code: "CAPTCHA_FAILED",
        errorCodes: result.errorCodes,
      },
    });
  }
}

export function shouldRequireCaptcha(
  operation: string,
  trustScore?: number
): boolean {
  if (!CAPTCHA_REQUIRED_OPERATIONS.has(operation)) {
    return false;
  }

  if (trustScore !== undefined && trustScore < 60) {
    return true;
  }

  if (operation === "register") {
    return true;
  }

  return false;
}

export function isContentCreation(operation: string): boolean {
  return CONTENT_CREATION_OPERATIONS.has(operation);
}
