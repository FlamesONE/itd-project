import { AggregateRoot } from "../../shared";
import { Result, DomainError } from "../../shared/Result";
import { UserId } from "../../identity";
import { RestrictionLevel, getRestrictionLevelFromScore } from "../value-objects";

export interface TrustScoreFactors {
  accountAgeDays: number;
  emailVerified: boolean;
  profileCompleteness: number;
  behaviorScore: number;
  contentQualityScore: number;
  followersCount: number;
  followingCount: number;
  reportCount: number;
  captchaSuccessRate: number;
}

interface TrustScoreProps {
  factors: TrustScoreFactors;
  score: number;
  lastUpdated: Date;
}

export class TrustScore extends AggregateRoot<TrustScoreProps, UserId> {
  get userId(): UserId {
    return this._id;
  }

  get factors(): TrustScoreFactors {
    return this.props.factors;
  }

  get score(): number {
    return this.props.score;
  }

  get lastUpdated(): Date {
    return this.props.lastUpdated;
  }

  get restrictionLevel(): RestrictionLevel {
    return getRestrictionLevelFromScore(this.props.score);
  }

  private constructor(userId: UserId, props: TrustScoreProps) {
    super(userId, props);
  }

  public static create(props: {
    userId: UserId;
    factors?: Partial<TrustScoreFactors>;
  }): Result<TrustScore> {
    const factors: TrustScoreFactors = {
      accountAgeDays: props.factors?.accountAgeDays ?? 0,
      emailVerified: props.factors?.emailVerified ?? false,
      profileCompleteness: props.factors?.profileCompleteness ?? 0,
      behaviorScore: props.factors?.behaviorScore ?? 0.5,
      contentQualityScore: props.factors?.contentQualityScore ?? 0.5,
      followersCount: props.factors?.followersCount ?? 0,
      followingCount: props.factors?.followingCount ?? 0,
      reportCount: props.factors?.reportCount ?? 0,
      captchaSuccessRate: props.factors?.captchaSuccessRate ?? 1,
    };

    const score = TrustScore.calculateScore(factors);

    return Result.ok(
      new TrustScore(props.userId, {
        factors,
        score,
        lastUpdated: new Date(),
      })
    );
  }

  public static reconstruct(props: {
    userId: UserId;
    factors: TrustScoreFactors;
    score: number;
    lastUpdated: Date;
  }): Result<TrustScore> {
    return Result.ok(new TrustScore(props.userId, {
      factors: props.factors,
      score: props.score,
      lastUpdated: props.lastUpdated,
    }));
  }

  public updateFactors(newFactors: Partial<TrustScoreFactors>): void {
    this.props.factors = { ...this.props.factors, ...newFactors };
    this.props.score = TrustScore.calculateScore(this.props.factors);
    this.props.lastUpdated = new Date();
  }

  private static calculateScore(factors: TrustScoreFactors): number {
    const weights = {
      accountAge: 0.15,
      emailVerified: 0.1,
      profileComplete: 0.05,
      behaviorScore: 0.2,
      contentQuality: 0.15,
      socialGraph: 0.1,
      reportHistory: 0.15,
      captchaHistory: 0.1,
    };

    let score = 0;

    const ageScore = Math.min(1, factors.accountAgeDays / 90);
    score += ageScore * weights.accountAge * 100;

    score += (factors.emailVerified ? 1 : 0) * weights.emailVerified * 100;

    score += factors.profileCompleteness * weights.profileComplete * 100;

    score += factors.behaviorScore * weights.behaviorScore * 100;

    score += factors.contentQualityScore * weights.contentQuality * 100;

    const followRatio = TrustScore.calculateFollowRatio(
      factors.followersCount,
      factors.followingCount
    );
    score += followRatio * weights.socialGraph * 100;

    const reportPenalty = Math.min(1, factors.reportCount * 0.1);
    score -= reportPenalty * weights.reportHistory * 100;

    score += factors.captchaSuccessRate * weights.captchaHistory * 100;

    return Math.max(0, Math.min(100, score));
  }

  private static calculateFollowRatio(
    followers: number,
    following: number
  ): number {
    if (followers === 0 && following === 0) return 0.5;
    if (following === 0) return 1;

    const ratio = followers / following;

    return Math.min(1, ratio / 2);
  }
}
