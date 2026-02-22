import type {
  IBehaviorAnalyzer,
  HumanScore,
  BehaviorMetrics,
  MouseMovement,
  ClickEvent,
} from "../../../domain/antibot";

export class BehaviorAnalyzer implements IBehaviorAnalyzer {
  analyze(metrics: BehaviorMetrics): HumanScore {
    const breakdown = {
      mouseMovement: this.analyzeMouseMovement(metrics.mouseMovements),
      typingPattern: this.analyzeTypingPattern(metrics.keyIntervals),
      clickPattern: this.analyzeClickPattern(metrics.clicks),
      sessionDuration: this.analyzeSessionDuration(metrics.sessionDuration),
    };

    const score =
      Object.values(breakdown).reduce((a, b) => a + b, 0) / 4;

    return {
      score,
      breakdown,
      isLikelyBot: score < 0.4,
    };
  }

  private analyzeMouseMovement(movements: MouseMovement[]): number {
    if (movements.length < 10) return 0.3;

    let totalCurvature = 0;
    for (let i = 2; i < movements.length; i++) {
      totalCurvature += this.calculateCurvature(
        movements[i - 2],
        movements[i - 1],
        movements[i]
      );
    }

    const avgCurvature = totalCurvature / (movements.length - 2);

    if (avgCurvature < 0.05) return 0.2;
    if (avgCurvature > 0.5) return 0.9;
    return 0.5 + avgCurvature;
  }

  private analyzeTypingPattern(intervals: number[]): number {
    if (intervals.length < 5) return 0.3;

    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance =
      intervals.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
      intervals.length;
    const cv = Math.sqrt(variance) / avg;

    if (cv < 0.1) return 0.2;
    if (cv > 0.5) return 0.9;
    return 0.4 + cv;
  }

  private analyzeClickPattern(clicks: ClickEvent[]): number {
    if (clicks.length < 3) return 0.5;

    const positions = new Set(
      clicks.map(
        (c) => `${Math.round(c.x / 10)}-${Math.round(c.y / 10)}`
      )
    );
    const variety = positions.size / clicks.length;

    const intervals = clicks
      .slice(1)
      .map((c, i) => c.timestamp - clicks[i].timestamp);
    const avgInterval =
      intervals.reduce((a, b) => a + b, 0) / intervals.length;

    if (avgInterval < 100) return 0.1;
    if (variety < 0.3) return 0.3;

    return Math.min(0.9, 0.5 + variety * 0.4);
  }

  private analyzeSessionDuration(duration: number): number {

    const minutes = duration / 60000;

    if (minutes < 0.5) return 0.3;
    if (minutes < 2) return 0.5;
    return 0.8;
  }

  private calculateCurvature(
    p1: MouseMovement,
    p2: MouseMovement,
    p3: MouseMovement
  ): number {

    const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    if (mag1 === 0 || mag2 === 0) return 0;

    const cos = dot / (mag1 * mag2);

    return 1 - Math.abs(cos);
  }
}
