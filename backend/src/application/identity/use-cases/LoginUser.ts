import { Result, DomainError } from "../../../domain/shared";
import { Email } from "../../../domain/identity";
import type { IUserRepository } from "../../../domain/identity";
import type { LoginUserInput, LoginUserOutput } from "../dto";

export interface IPasswordVerifier {
  verify(password: string, hash: string): Promise<boolean>;
}

export interface ITokenService {
  generateAccessToken(payload: { userId: string; email: string }): Promise<string>;
  generateRefreshToken(payload: { userId: string }): Promise<string>;
}

export class LoginUser {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordVerifier: IPasswordVerifier,
    private readonly tokenService: ITokenService
  ) {}

  async execute(input: LoginUserInput): Promise<Result<LoginUserOutput>> {

    const emailResult = Email.create(input.email);
    if (emailResult.isFailure()) {
      return Result.fail(new DomainError("Неверный email или пароль", "INVALID_CREDENTIALS"));
    }

    const email = emailResult.getValue();

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return Result.fail(new DomainError("Неверный email или пароль", "INVALID_CREDENTIALS"));
    }

    const isPasswordValid = await this.passwordVerifier.verify(
      input.password,
      user.password.value
    );

    if (!isPasswordValid) {
      return Result.fail(new DomainError("Неверный email или пароль", "INVALID_CREDENTIALS"));
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.generateAccessToken({
        userId: user.id.value,
        email: user.email.value,
      }),
      this.tokenService.generateRefreshToken({
        userId: user.id.value,
      }),
    ]);

    return Result.ok({
      accessToken,
      refreshToken,
      user: {
        id: user.id.value,
        email: user.email.value,
        username: user.username.value,
        displayName: user.displayName,
        bio: user.bio,
        emoji: user.emoji,
        avatarUrl: user.avatarUrl,
        verified: user.verified,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        postsCount: user.postsCount,
        createdAt: user.createdAt,
      },
    });
  }
}
