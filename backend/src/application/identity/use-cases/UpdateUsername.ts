import { Result, DomainError } from "../../../domain/shared";
import { UserId, Username } from "../../../domain/identity";
import type { IUserRepository } from "../../../domain/identity";
import type { IPasswordVerifier } from "./LoginUser";

export interface UpdateUsernameInput {
  userId: string;
  newUsername: string;
  password: string;
}

export class UpdateUsername {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordVerifier: IPasswordVerifier
  ) {}

  async execute(input: UpdateUsernameInput): Promise<Result<{ username: string }>> {
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

    const newUsernameResult = Username.create(input.newUsername);
    if (newUsernameResult.isFailure()) {
      return Result.fail(newUsernameResult.getError());
    }

    const newUsername = newUsernameResult.getValue();

    const existingUser = await this.userRepository.findByUsername(newUsername);
    if (existingUser && existingUser.id.value !== user.id.value) {
      return Result.fail(new DomainError("Это имя пользователя уже занято", "USERNAME_TAKEN"));
    }

    user.updateUsername(newUsername);
    await this.userRepository.save(user);

    return Result.ok({ username: newUsername.value });
  }
}
