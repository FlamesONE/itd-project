import { Result, DomainError } from "../../../domain/shared/Result";
import type {
  IRecommendationService,
  RecommendedPost,
} from "../../../domain/recommendation";
import { UserId } from "../../../domain/identity/value-objects/UserId";

export interface GetPostRecommendationsInput {
  userId: string;
  limit?: number;
}

export class GetPostRecommendations {
  constructor(private readonly recommendationService: IRecommendationService) {}

  async execute(
    input: GetPostRecommendationsInput
  ): Promise<Result<RecommendedPost[]>> {
    const userIdResult = UserId.create(input.userId);
    if (userIdResult.isFailure()) {
      return Result.fail(
        new DomainError("Invalid user ID", "INVALID_USER_ID")
      );
    }

    const recommendations = await this.recommendationService.getPostRecommendations(
      userIdResult.getValue(),
      input.limit ?? 20
    );

    return Result.ok(recommendations);
  }
}
