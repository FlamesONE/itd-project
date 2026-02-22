import { Result, DomainError } from "../../../domain/shared";
import { UserId, Email } from "../../../domain/identity";
import type { IUserRepository } from "../../../domain/identity";
import type { IPasswordVerifier } from "./LoginUser";

export interface UpdateEmailInput {
  userId: string;
  newEmail: string;
  password: string;
}

export class UpdateEmail {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordVerifier: IPasswordVerifier
  ) {}

  async execute(input: UpdateEmailInput): Promise<Result<{ email: string }>> {
    const userIdResult = UserId.create(input.userId);
    if (userIdResult.isFailure()) {
      return Result.fail(userIdResult.getError());
    }

    const user = await this.userRepository.findById(userIdResult.getValue());
    if (!user) {
      return Result.fail(new DomainError("Пользователь не найден", "USER_NOT_FOUND"));
    }

    const isPasswordValid = await this.passwordVerifier.verify(
      input.password,
      user.password.value
    );

    if (!isPasswordValid) {
      return Result.fail(new DomainError("Неверный пароль", "INVALID_PASSWORD"));
    }

    const newEmailResult = Email.create(input.newEmail);
    if (newEmailResult.isFailure()) {
      return Result.fail(newEmailResult.getError());
    }

    const newEmail = newEmailResult.getValue();

    const existingUser = await this.userRepository.findByEmail(newEmail);
    if (existingUser && existingUser.id.value !== user.id.value) {
      return Result.fail(new DomainError("Этот email уже используется", "EMAIL_TAKEN"));
    }

    user.updateEmail(newEmail);
    await this.userRepository.save(user);

    return Result.ok({ email: newEmail.value });
  }
}
