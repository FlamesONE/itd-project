import { Result, DomainError } from "../../../domain/shared";
import { UserId } from "../../../domain/identity";
import type { IUserRepository } from "../../../domain/identity";

export interface ITokenVerifier {
  verifyRefreshToken(token: string): Promise<{ userId: string } | null>;
}

export interface ITokenGenerator {
  generateAccessToken(payload: { userId: string; email: string }): Promise<string>;
  generateRefreshToken(payload: { userId: string }): Promise<string>;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
}

export class RefreshToken {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenVerifier: ITokenVerifier,
    private readonly tokenGenerator: ITokenGenerator
  ) {}

  async execute(input: RefreshTokenInput): Promise<Result<RefreshTokenOutput>> {
    const payload = await this.tokenVerifier.verifyRefreshToken(input.refreshToken);

    if (!payload) {
      return Result.fail(new DomainError("Invalid refresh token", "INVALID_TOKEN"));
    }

    const userIdResult = UserId.create(payload.userId);
    if (userIdResult.isFailure()) {
      return Result.fail(new DomainError("Invalid user ID in token", "INVALID_TOKEN"));
    }

    const user = await this.userRepository.findById(userIdResult.getValue());
    if (!user) {
      return Result.fail(new DomainError("User not found", "USER_NOT_FOUND"));
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenGenerator.generateAccessToken({
        userId: user.id.value,
        email: user.email.value,
      }),
      this.tokenGenerator.generateRefreshToken({
        userId: user.id.value,
      }),
    ]);

    return Result.ok({
      accessToken,
      refreshToken,
    });
  }
}
