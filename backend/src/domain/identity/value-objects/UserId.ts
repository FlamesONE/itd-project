import { v4 as uuidv4, validate as uuidValidate } from "uuid";
import { ValueObject } from "../../shared/ValueObject";
import { Result, DomainError } from "../../shared/Result";

interface UserIdProps {
  value: string;
}

export class UserId extends ValueObject<UserIdProps> {
  private constructor(props: UserIdProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(id?: string): Result<UserId> {
    if (id !== undefined) {
      if (!uuidValidate(id)) {
        return Result.fail(new DomainError("Invalid user ID format", "INVALID_USER_ID"));
      }
      return Result.ok(new UserId({ value: id }));
    }
    return Result.ok(new UserId({ value: uuidv4() }));
  }

  toString(): string {
    return this.props.value;
  }
}
