import { Result } from "../../../domain/shared";
import type { IHashtagRepository, TrendingHashtag } from "../../../domain/content/repositories/IHashtagRepository";

export interface GetTrendingHashtagsInput {
  period?: "day" | "week" | "all";
  limit?: number;
}

export class GetTrendingHashtags {
  constructor(private readonly hashtagRepository: IHashtagRepository) {}

  async execute(input: GetTrendingHashtagsInput): Promise<Result<TrendingHashtag[]>> {
    const period = input.period ?? "week";
    const limit = input.limit ?? 10;

    const hashtags = await this.hashtagRepository.getTrending(period, limit);

    return Result.ok(hashtags);
  }
}
