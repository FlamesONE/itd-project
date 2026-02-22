import { ValueObject } from "../../shared/ValueObject";
import { Result } from "../../shared/Result";
import { v4 as uuidv4, validate as uuidValidate } from "uuid";

interface CommentLikeIdProps {
  value: string;
}

export class CommentLikeId extends ValueObject<CommentLikeIdProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: CommentLikeIdProps) {
    super(props);
  }

  public static create(id?: string): Result<CommentLikeId> {
    if (id && !uuidValidate(id)) {
      return Result.fail(new Error("Invalid comment like ID format"));
    }

    return Result.ok(new CommentLikeId({ value: id ?? uuidv4() }));
  }
}
