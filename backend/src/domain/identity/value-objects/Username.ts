import { ValueObject } from "../../shared/ValueObject";
import { Result, DomainError } from "../../shared/Result";

interface UsernameProps {
  value: string;
}

export class Username extends ValueObject<UsernameProps> {
  private static readonly MIN_LENGTH = 3;
  private static readonly MAX_LENGTH = 30;
  private static readonly USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

  private constructor(props: UsernameProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(username: string): Result<Username> {
    if (!username || username.trim().length === 0) {
      return Result.fail(new DomainError("Имя пользователя не может быть пустым", "USERNAME_EMPTY"));
    }

    const trimmedUsername = username.trim();

    if (trimmedUsername.length < this.MIN_LENGTH) {
      return Result.fail(
        new DomainError(
          `Имя пользователя должно содержать минимум ${this.MIN_LENGTH} символа`,
          "USERNAME_TOO_SHORT"
        )
      );
    }

    if (trimmedUsername.length > this.MAX_LENGTH) {
      return Result.fail(
        new DomainError(
          `Имя пользователя должно содержать максимум ${this.MAX_LENGTH} символов`,
          "USERNAME_TOO_LONG"
        )
      );
    }

    if (!this.USERNAME_REGEX.test(trimmedUsername)) {
      return Result.fail(
        new DomainError(
          "Имя пользователя может содержать только буквы, цифры и подчеркивания",
          "USERNAME_INVALID_FORMAT"
        )
      );
    }

    return Result.ok(new Username({ value: trimmedUsername }));
  }

  toString(): string {
    return this.props.value;
  }
}
