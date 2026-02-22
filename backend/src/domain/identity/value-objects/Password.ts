import { ValueObject } from "../../shared/ValueObject";
import { Result, DomainError } from "../../shared/Result";

interface PasswordProps {
  value: string;
  isHashed: boolean;
}

export class Password extends ValueObject<PasswordProps> {
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_LENGTH = 128;

  private constructor(props: PasswordProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  get isHashed(): boolean {
    return this.props.isHashed;
  }

  static create(password: string): Result<Password> {
    if (!password || password.length === 0) {
      return Result.fail(new DomainError("Пароль не может быть пустым", "PASSWORD_EMPTY"));
    }

    if (password.length < this.MIN_LENGTH) {
      return Result.fail(
        new DomainError(
          `Пароль должен содержать минимум ${this.MIN_LENGTH} символов`,
          "PASSWORD_TOO_SHORT"
        )
      );
    }

    if (password.length > this.MAX_LENGTH) {
      return Result.fail(
        new DomainError(
          `Пароль должен содержать максимум ${this.MAX_LENGTH} символов`,
          "PASSWORD_TOO_LONG"
        )
      );
    }

    if (!/[A-Z]/.test(password)) {
      return Result.fail(
        new DomainError(
          "Пароль должен содержать минимум одну заглавную букву",
          "PASSWORD_NO_UPPERCASE"
        )
      );
    }

    if (!/[a-z]/.test(password)) {
      return Result.fail(
        new DomainError(
          "Пароль должен содержать минимум одну строчную букву",
          "PASSWORD_NO_LOWERCASE"
        )
      );
    }

    if (!/[0-9]/.test(password)) {
      return Result.fail(
        new DomainError("Пароль должен содержать минимум одну цифру", "PASSWORD_NO_NUMBER")
      );
    }

    return Result.ok(new Password({ value: password, isHashed: false }));
  }

  static createHashed(hashedPassword: string): Result<Password> {
    if (!hashedPassword || hashedPassword.length === 0) {
      return Result.fail(new DomainError("Хэшированный пароль не может быть пустым", "PASSWORD_EMPTY"));
    }

    return Result.ok(new Password({ value: hashedPassword, isHashed: true }));
  }
}
