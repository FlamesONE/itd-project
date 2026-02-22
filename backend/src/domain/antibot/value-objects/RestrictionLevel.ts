export enum RestrictionLevel {
  NONE = "none",
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export function getRestrictionLevelFromScore(score: number): RestrictionLevel {
  if (score >= 80) return RestrictionLevel.NONE;
  if (score >= 60) return RestrictionLevel.LOW;
  if (score >= 40) return RestrictionLevel.MEDIUM;
  if (score >= 20) return RestrictionLevel.HIGH;
  return RestrictionLevel.CRITICAL;
}
