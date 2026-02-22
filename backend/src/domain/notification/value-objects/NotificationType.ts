import { ValueObject } from "../../shared/ValueObject";
import { Result } from "../../shared/Result";

export type NotificationTypeValue = "like" | "comment" | "repost" | "follow" | "mention" | "reply";

interface NotificationTypeProps {
  value: NotificationTypeValue;
}

const VALID_TYPES: NotificationTypeValue[] = [
  "like",
  "comment",
  "repost",
  "follow",
  "mention",
  "reply",
];

export class NotificationType extends ValueObject<NotificationTypeProps> {
  private constructor(props: NotificationTypeProps) {
    super(props);
  }

  get value(): NotificationTypeValue {
    return this.props.value;
  }

  public static create(type: string): Result<NotificationType> {
    if (!VALID_TYPES.includes(type as NotificationTypeValue)) {
      return Result.fail(new Error(`Invalid notification type: ${type}. Must be one of: ${VALID_TYPES.join(", ")}`));
    }

    return Result.ok(new NotificationType({ value: type as NotificationTypeValue }));
  }

  public static like(): NotificationType {
    return new NotificationType({ value: "like" });
  }

  public static comment(): NotificationType {
    return new NotificationType({ value: "comment" });
  }

  public static repost(): NotificationType {
    return new NotificationType({ value: "repost" });
  }

  public static follow(): NotificationType {
    return new NotificationType({ value: "follow" });
  }

  public static mention(): NotificationType {
    return new NotificationType({ value: "mention" });
  }

  public static reply(): NotificationType {
    return new NotificationType({ value: "reply" });
  }
}
