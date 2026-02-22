import { ValueObject } from "../../shared/ValueObject";
import { Result } from "../../shared/Result";
import { v4 as uuidv4, validate as uuidValidate } from "uuid";

interface RepostIdProps {
  value: string;
}

export class RepostId extends ValueObject<RepostIdProps> {
  private constructor(props: RepostIdProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  public static create(id?: string): Result<RepostId> {
    if (id && !uuidValidate(id)) {
      return Result.fail(new Error("Invalid repost ID format"));
    }

    return Result.ok(new RepostId({ value: id ?? uuidv4() }));
  }
}
