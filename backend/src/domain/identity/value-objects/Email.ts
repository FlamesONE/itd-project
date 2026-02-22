import { ValueObject } from "../../shared/ValueObject";
import { Result, DomainError } from "../../shared/Result";

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(props: EmailProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(email: string): Result<Email> {
    if (!email || email.trim().length === 0) {
      return Result.fail(new DomainError("Email не может быть пустым", "EMAIL_EMPTY"));
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!this.EMAIL_REGEX.test(normalizedEmail)) {
      return Result.fail(new DomainError("Некорректный формат email", "EMAIL_INVALID_FORMAT"));
    }

    if (normalizedEmail.length > 255) {
      return Result.fail(new DomainError("Email слишком длинный", "EMAIL_TOO_LONG"));
    }

    return Result.ok(new Email({ value: normalizedEmail }));
  }

  toString(): string {
    return this.props.value;
  }
}
