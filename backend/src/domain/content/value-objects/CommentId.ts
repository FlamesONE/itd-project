import { v4 as uuidv4, validate as uuidValidate } from "uuid";
import { ValueObject } from "../../shared/ValueObject";
import { Result, DomainError } from "../../shared/Result";

interface CommentIdProps {
  value: string;
}

export class CommentId extends ValueObject<CommentIdProps> {
  private constructor(props: CommentIdProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(id?: string): Result<CommentId> {
    if (id !== undefined) {
      if (!uuidValidate(id)) {
        return Result.fail(new DomainError("Invalid comment ID format", "INVALID_COMMENT_ID"));
      }
      return Result.ok(new CommentId({ value: id }));
    }
    return Result.ok(new CommentId({ value: uuidv4() }));
  }

  toString(): string {
    return this.props.value;
  }
}
