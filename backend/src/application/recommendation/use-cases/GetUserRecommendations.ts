import { Result, DomainError } from "../../../domain/shared/Result";
import type {
  IRecommendationService,
  RecommendedUser,
} from "../../../domain/recommendation";
import { UserId } from "../../../domain/identity/value-objects/UserId";

export interface GetUserRecommendationsInput {
  userId: string;
  limit?: number;
}

export class GetUserRecommendations {
  constructor(private readonly recommendationService: IRecommendationService) {}

  async execute(
    input: GetUserRecommendationsInput
  ): Promise<Result<RecommendedUser[]>> {
    const userIdResult = UserId.create(input.userId);
    if (userIdResult.isFailure()) {
      return Result.fail(
        new DomainError("Invalid user ID", "INVALID_USER_ID")
      );
    }

    const recommendations = await this.recommendationService.getUserRecommendations(
      userIdResult.getValue(),
      input.limit ?? 10
    );

    return Result.ok(recommendations);
  }
}
