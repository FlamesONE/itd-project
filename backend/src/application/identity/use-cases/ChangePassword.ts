import { Result, DomainError } from "../../../domain/shared";
import { UserId, Password } from "../../../domain/identity";
import type { IUserRepository } from "../../../domain/identity";
import type { IPasswordVerifier } from "./LoginUser";
import type { IPasswordHasher } from "./RegisterUser";

export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export class ChangePassword {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordVerifier: IPasswordVerifier,
    private readonly passwordHasher: IPasswordHasher
  ) {}

  async execute(input: ChangePasswordInput): Promise<Result<boolean>> {
    const userIdResult = UserId.create(input.userId);
    if (userIdResult.isFailure()) {
      return Result.fail(userIdResult.getError());
    }

    const user = await this.userRepository.findById(userIdResult.getValue());
    if (!user) {
      return Result.fail(new DomainError("Пользователь не найден", "USER_NOT_FOUND"));
    }

    const isCurrentPasswordValid = await this.passwordVerifier.verify(
      input.currentPassword,
      user.password.value
    );

    if (!isCurrentPasswordValid) {
      return Result.fail(new DomainError("Неверный текущий пароль", "INVALID_CURRENT_PASSWORD"));
    }

    const newPasswordResult = Password.create(input.newPassword);
    if (newPasswordResult.isFailure()) {
      return Result.fail(newPasswordResult.getError());
    }

    const hashedPassword = await this.passwordHasher.hash(input.newPassword);
    const hashedPasswordResult = Password.createHashed(hashedPassword);
    if (hashedPasswordResult.isFailure()) {
      return Result.fail(hashedPasswordResult.getError());
    }

    user.updatePassword(hashedPasswordResult.getValue());

    await this.userRepository.save(user);

    return Result.ok(true);
  }
}
