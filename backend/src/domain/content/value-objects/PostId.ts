import { v4 as uuidv4, validate as uuidValidate } from "uuid";
import { ValueObject } from "../../shared/ValueObject";
import { Result, DomainError } from "../../shared/Result";

interface PostIdProps {
  value: string;
}

export class PostId extends ValueObject<PostIdProps> {
  private constructor(props: PostIdProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(id?: string): Result<PostId> {
    if (id !== undefined) {
      if (!uuidValidate(id)) {
        return Result.fail(new DomainError("Invalid post ID format", "INVALID_POST_ID"));
      }
      return Result.ok(new PostId({ value: id }));
    }
    return Result.ok(new PostId({ value: uuidv4() }));
  }

  toString(): string {
    return this.props.value;
  }
}
