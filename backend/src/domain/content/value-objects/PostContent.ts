import { ValueObject } from "../../shared/ValueObject";
import { Result, DomainError } from "../../shared/Result";

interface PostContentProps {
  value: string;
}

export class PostContent extends ValueObject<PostContentProps> {
  private static readonly MAX_LENGTH = 280;

  private constructor(props: PostContentProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  get length(): number {
    return this.props.value.length;
  }

  static create(content: string): Result<PostContent> {
    const trimmedContent = (content || "").trim();

    if (trimmedContent.length > this.MAX_LENGTH) {
      return Result.fail(
        new DomainError(
          `Post content must be at most ${this.MAX_LENGTH} characters`,
          "CONTENT_TOO_LONG"
        )
      );
    }

    return Result.ok(new PostContent({ value: trimmedContent }));
  }

  toString(): string {
    return this.props.value;
  }
}
