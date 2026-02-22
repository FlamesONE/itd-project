import { ValueObject } from "../../shared/ValueObject";
import { Result, DomainError } from "../../shared/Result";
import { v4 as uuidv4, validate as uuidValidate } from "uuid";

interface LikeIdProps {
  value: string;
}

export class LikeId extends ValueObject<LikeIdProps> {
  private constructor(props: LikeIdProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(id?: string): Result<LikeId> {
    if (id !== undefined) {
      if (!uuidValidate(id)) {
        return Result.fail(new DomainError("Invalid like ID format", "INVALID_LIKE_ID"));
      }
      return Result.ok(new LikeId({ value: id }));
    }
    return Result.ok(new LikeId({ value: uuidv4() }));
  }

  toString(): string {
    return this.props.value;
  }
}
