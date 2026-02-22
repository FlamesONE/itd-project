import { Result, DomainError } from "../../../domain/shared/Result";
import type { ISpamDetector, SpamAnalysisResult } from "../../../domain/antibot";

export interface CheckSpamInput {
  content: string;
  recentPosts?: string[];
}

export class CheckSpam {
  constructor(private readonly spamDetector: ISpamDetector) {}

  async execute(input: CheckSpamInput): Promise<Result<SpamAnalysisResult>> {
    const { content, recentPosts } = input;

    const result = this.spamDetector.analyze(content);

    if (recentPosts && recentPosts.length > 0) {
      const similarity = await this.spamDetector.checkSimilarity(
        content,
        recentPosts
      );

      if (similarity > 0.8) {
        return Result.fail(
          new DomainError(
            "Content is too similar to recent posts",
            "DUPLICATE_CONTENT"
          )
        );
      }
    }

    if (result.isSpam) {
      return Result.fail(
        new DomainError("Content flagged as spam", "SPAM_DETECTED")
      );
    }

    return Result.ok(result);
  }
}
