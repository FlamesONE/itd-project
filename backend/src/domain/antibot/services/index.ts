export type { ICaptchaValidator, CaptchaResult } from "./ICaptchaValidator";
export type {
  IRateLimiter,
  RateLimitResult,
  RateLimitConfig,
} from "./IRateLimiter";
export { RATE_LIMITS, SUSPICIOUS_RATE_LIMITS } from "./IRateLimiter";
export type {
  ISpamDetector,
  SpamAnalysisResult,
  SpamChecks,
} from "./ISpamDetector";
export type {
  IBehaviorAnalyzer,
  HumanScore,
  HumanScoreBreakdown,
} from "./IBehaviorAnalyzer";
