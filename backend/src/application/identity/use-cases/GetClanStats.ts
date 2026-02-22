import { Result } from "../../../domain/shared";
import type { IClanRepository, ClanStats } from "../../../domain/identity/repositories/IClanRepository";

export interface GetClanStatsInput {
  limit?: number;
}

export class GetClanStats {
  constructor(private readonly clanRepository: IClanRepository) {}

  async execute(input?: GetClanStatsInput): Promise<Result<ClanStats[]>> {
    const limit = input?.limit;

    const stats = limit
      ? await this.clanRepository.getTopClans(limit)
      : await this.clanRepository.getClanStats();

    return Result.ok(stats);
  }
}
