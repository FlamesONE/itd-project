import { Entity } from "../../shared/Entity";
import { Result } from "../../shared/Result";
import { NotificationId } from "../value-objects/NotificationId";
import { NotificationType } from "../value-objects/NotificationType";
import { UserId } from "../../identity/value-objects/UserId";
import { PostId } from "../../content/value-objects/PostId";
import { CommentId } from "../../content/value-objects/CommentId";

export interface NotificationProps {
  userId: UserId;
  actorId: UserId;
  type: NotificationType;
  postId: PostId | null;
  commentId: CommentId | null;
  isRead: boolean;
  createdAt: Date;
}

export class Notification extends Entity<NotificationProps, NotificationId> {
  private constructor(id: NotificationId, props: NotificationProps) {
    super(id, props);
  }

  get userId(): UserId {
    return this.props.userId;
  }

  get actorId(): UserId {
    return this.props.actorId;
  }

  get type(): NotificationType {
    return this.props.type;
  }

  get postId(): PostId | null {
    return this.props.postId;
  }

  get commentId(): CommentId | null {
    return this.props.commentId;
  }

  get isRead(): boolean {
    return this.props.isRead;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  public markAsRead(): void {
    this.props.isRead = true;
  }

  public static create(props: {
    userId: UserId;
    actorId: UserId;
    type: NotificationType;
    postId?: PostId;
    commentId?: CommentId;
    id?: NotificationId;
  }): Result<Notification> {

    if (props.userId.value === props.actorId.value) {
      return Result.fail(new Error("Cannot create notification for yourself"));
    }

    const idResult = props.id ?? NotificationId.create().getValue();

    const notification = new Notification(idResult, {
      userId: props.userId,
      actorId: props.actorId,
      type: props.type,
      postId: props.postId ?? null,
      commentId: props.commentId ?? null,
      isRead: false,
      createdAt: new Date(),
    });

    return Result.ok(notification);
  }

  public static reconstitute(props: {
    id: NotificationId;
    userId: UserId;
    actorId: UserId;
    type: NotificationType;
    postId: PostId | null;
    commentId: CommentId | null;
    isRead: boolean;
    createdAt: Date;
  }): Notification {
    return new Notification(props.id, {
      userId: props.userId,
      actorId: props.actorId,
      type: props.type,
      postId: props.postId,
      commentId: props.commentId,
      isRead: props.isRead,
      createdAt: props.createdAt,
    });
  }
}
