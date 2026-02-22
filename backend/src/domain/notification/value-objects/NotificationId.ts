import { ValueObject } from "../../shared/ValueObject";
import { Result } from "../../shared/Result";
import { v4 as uuidv4, validate as uuidValidate } from "uuid";

interface NotificationIdProps {
  value: string;
}

export class NotificationId extends ValueObject<NotificationIdProps> {
  private constructor(props: NotificationIdProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  public static create(id?: string): Result<NotificationId> {
    if (id && !uuidValidate(id)) {
      return Result.fail(new Error("Invalid notification ID format"));
    }

    return Result.ok(new NotificationId({ value: id ?? uuidv4() }));
  }
}
