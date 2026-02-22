
export {
  Fingerprint,
  type FingerprintComponents,
  IpReputation,
  BehaviorMetrics,
  type MouseMovement,
  type ClickEvent,
  type ScrollEvent,
  RestrictionLevel,
  getRestrictionLevelFromScore,
} from "./value-objects";

export { TrustScore, type TrustScoreFactors } from "./entities/TrustScore";

export type {
  ICaptchaValidator,
  CaptchaResult,
  IRateLimiter,
  RateLimitResult,
  RateLimitConfig,
  ISpamDetector,
  SpamAnalysisResult,
  SpamChecks,
  IBehaviorAnalyzer,
  HumanScore,
  HumanScoreBreakdown,
} from "./services";
export { RATE_LIMITS, SUSPICIOUS_RATE_LIMITS } from "./services";

export type { ITrustScoreRepository } from "./repositories/ITrustScoreRepository";
