import type { BehaviorMetrics } from "../value-objects";

export interface HumanScoreBreakdown {
  mouseMovement: number;
  typingPattern: number;
  clickPattern: number;
  sessionDuration: number;
}

export interface HumanScore {
  score: number;
  breakdown: HumanScoreBreakdown;
  isLikelyBot: boolean;
}

export interface IBehaviorAnalyzer {
  analyze(metrics: BehaviorMetrics): HumanScore;
}
