import { Result, DomainError } from "../../../domain/shared";
import { User, Email, Username, Password } from "../../../domain/identity";
import type { IUserRepository } from "../../../domain/identity";
import type { RegisterUserInput, RegisterUserOutput } from "../dto";

export interface IPasswordHasher {
  hash(password: string): Promise<string>;
}

export class RegisterUser {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher
  ) {}

  async execute(input: RegisterUserInput): Promise<Result<RegisterUserOutput>> {

    const emailResult = Email.create(input.email);
    if (emailResult.isFailure()) {
      return Result.fail(emailResult.getError());
    }

    const usernameResult = Username.create(input.username);
    if (usernameResult.isFailure()) {
      return Result.fail(usernameResult.getError());
    }

    const passwordResult = Password.create(input.password);
    if (passwordResult.isFailure()) {
      return Result.fail(passwordResult.getError());
    }

    const email = emailResult.getValue();
    const username = usernameResult.getValue();

    const existingByEmail = await this.userRepository.findByEmail(email);
    if (existingByEmail) {
      return Result.fail(new DomainError("Email уже используется", "EMAIL_EXISTS"));
    }

    const existingByUsername = await this.userRepository.findByUsername(username);
    if (existingByUsername) {
      return Result.fail(new DomainError("Имя пользователя уже занято", "USERNAME_EXISTS"));
    }

    const hashedPassword = await this.passwordHasher.hash(input.password);
    const hashedPasswordResult = Password.createHashed(hashedPassword);
    if (hashedPasswordResult.isFailure()) {
      return Result.fail(hashedPasswordResult.getError());
    }

    const userResult = User.create({
      email,
      username,
      password: hashedPasswordResult.getValue(),
      displayName: input.displayName || input.username,
      emoji: input.emoji,
    });

    if (userResult.isFailure()) {
      return Result.fail(userResult.getError());
    }

    const user = userResult.getValue();

    await this.userRepository.save(user);

    return Result.ok({
      userId: user.id.value,
      email: user.email.value,
      username: user.username.value,
      displayName: user.displayName,
    });
  }
}
