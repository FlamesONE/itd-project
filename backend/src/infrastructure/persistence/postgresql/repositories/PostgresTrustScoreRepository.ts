import { getPool } from "../connection";
import type { ITrustScoreRepository } from "../../../../domain/antibot/repositories/ITrustScoreRepository";
import { TrustScore, type TrustScoreFactors } from "../../../../domain/antibot";
import { UserId } from "../../../../domain/identity";

interface TrustScoreRow {
  user_id: string;
  account_age_days: number;
  email_verified: boolean;
  profile_completeness: number;
  behavior_score: number;
  content_quality_score: number;
  followers_count: number;
  following_count: number;
  report_count: number;
  captcha_success_rate: number;
  score: number;
  last_updated: Date;
}

export class PostgresTrustScoreRepository implements ITrustScoreRepository {
  async findByUserId(userId: UserId): Promise<TrustScore | null> {
    const pool = getPool();
    const result = await pool.query<TrustScoreRow>(
      `SELECT * FROM trust_scores WHERE user_id = $1`,
      [userId.value]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.toDomain(result.rows[0]);
  }

  async save(trustScore: TrustScore): Promise<void> {
    const pool = getPool();
    const factors = trustScore.factors;

    await pool.query(
      `INSERT INTO trust_scores (
        user_id, account_age_days, email_verified, profile_completeness,
        behavior_score, content_quality_score, followers_count, following_count,
        report_count, captcha_success_rate, score, last_updated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (user_id) DO UPDATE SET
        account_age_days = $2,
        email_verified = $3,
        profile_completeness = $4,
        behavior_score = $5,
        content_quality_score = $6,
        followers_count = $7,
        following_count = $8,
        report_count = $9,
        captcha_success_rate = $10,
        score = $11,
        last_updated = $12`,
      [
        trustScore.userId.value,
        factors.accountAgeDays,
        factors.emailVerified,
        factors.profileCompleteness,
        factors.behaviorScore,
        factors.contentQualityScore,
        factors.followersCount,
        factors.followingCount,
        factors.reportCount,
        factors.captchaSuccessRate,
        trustScore.score,
        trustScore.lastUpdated,
      ]
    );
  }

  async delete(userId: UserId): Promise<void> {
    const pool = getPool();
    await pool.query(`DELETE FROM trust_scores WHERE user_id = $1`, [
      userId.value,
    ]);
  }

  private toDomain(row: TrustScoreRow): TrustScore {
    const userIdResult = UserId.create(row.user_id);
    if (userIdResult.isFailure()) {
      throw new Error("Invalid user ID in database");
    }

    const factors: TrustScoreFactors = {
      accountAgeDays: row.account_age_days,
      emailVerified: row.email_verified,
      profileCompleteness: row.profile_completeness,
      behaviorScore: row.behavior_score,
      contentQualityScore: row.content_quality_score,
      followersCount: row.followers_count,
      followingCount: row.following_count,
      reportCount: row.report_count,
      captchaSuccessRate: row.captcha_success_rate,
    };

    const result = TrustScore.reconstruct({
      userId: userIdResult.getValue(),
      factors,
      score: row.score,
      lastUpdated: row.last_updated,
    });

    if (result.isFailure()) {
      throw new Error("Failed to reconstruct TrustScore");
    }

    return result.getValue();
  }
}
