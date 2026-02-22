import { v4 as uuidv4, validate } from "uuid";
import { Result } from "../../shared/Result";
import { ValueObject } from "../../shared";

interface MediaIdProps {
  value: string;
}

export class MediaId extends ValueObject<MediaIdProps> {
  get value(): string {
    return this.props.value;
  }

  private constructor(props: MediaIdProps) {
    super(props);
  }

  public static create(id?: string): Result<MediaId> {
    if (id && !validate(id)) {
      return Result.fail(new Error("Invalid media ID format"));
    }

    return Result.ok(new MediaId({ value: id || uuidv4() }));
  }
}
