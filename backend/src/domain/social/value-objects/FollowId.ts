import { ValueObject } from "../../shared/ValueObject";
import { Result, DomainError } from "../../shared/Result";
import { v4 as uuidv4, validate as uuidValidate } from "uuid";

interface FollowIdProps {
  value: string;
}

export class FollowId extends ValueObject<FollowIdProps> {
  private constructor(props: FollowIdProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(id?: string): Result<FollowId> {
    if (id !== undefined) {
      if (!uuidValidate(id)) {
        return Result.fail(new DomainError("Invalid follow ID format", "INVALID_FOLLOW_ID"));
      }
      return Result.ok(new FollowId({ value: id }));
    }
    return Result.ok(new FollowId({ value: uuidv4() }));
  }

  toString(): string {
    return this.props.value;
  }
}
