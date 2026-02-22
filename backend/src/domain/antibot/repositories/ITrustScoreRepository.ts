import type { UserId } from "../../identity";
import type { TrustScore } from "../entities/TrustScore";

export interface ITrustScoreRepository {
  findByUserId(userId: UserId): Promise<TrustScore | null>;
  save(trustScore: TrustScore): Promise<void>;
  delete(userId: UserId): Promise<void>;
}
