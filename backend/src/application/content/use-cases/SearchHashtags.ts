import { Result } from "../../../domain/shared";
import type { IHashtagRepository } from "../../../domain/content/repositories/IHashtagRepository";

export interface SearchHashtagsInput {
  query: string;
  limit?: number;
}

export interface HashtagSearchResult {
  id: string;
  name: string;
  postsCount: number;
}

export class SearchHashtags {
  constructor(private readonly hashtagRepository: IHashtagRepository) {}

  async execute(input: SearchHashtagsInput): Promise<Result<HashtagSearchResult[]>> {
    const limit = input.limit ?? 10;

    const searchQuery = input.query.replace(/^#/, "").toLowerCase();

    if (!searchQuery) {
      return Result.ok([]);
    }

    const hashtags = await this.hashtagRepository.search(searchQuery, limit);

    return Result.ok(
      hashtags.map((h) => ({
        id: h.id.value,
        name: h.name,
        postsCount: h.postsCount,
      }))
    );
  }
}
