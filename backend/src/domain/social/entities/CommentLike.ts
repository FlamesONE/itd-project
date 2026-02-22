import { Entity } from "../../shared/Entity";
import { Result, DomainError } from "../../shared/Result";
import { CommentLikeId } from "../value-objects/CommentLikeId";
import { UserId } from "../../identity/value-objects/UserId";
import { CommentId } from "../../content/value-objects/CommentId";

interface CommentLikeProps {
  userId: UserId;
  commentId: CommentId;
  createdAt: Date;
}

export class CommentLike extends Entity<CommentLikeProps, CommentLikeId> {
  private constructor(id: CommentLikeId, props: CommentLikeProps) {
    super(id, props);
  }

  get userId(): UserId {
    return this.props.userId;
  }

  get commentId(): CommentId {
    return this.props.commentId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  public static create(props: {
    userId: UserId;
    commentId: CommentId;
    id?: CommentLikeId;
  }): Result<CommentLike> {
    const idResult = props.id ?? CommentLikeId.create().getValue();

    const commentLike = new CommentLike(idResult, {
      userId: props.userId,
      commentId: props.commentId,
      createdAt: new Date(),
    });

    return Result.ok(commentLike);
  }

  public static reconstitute(props: {
    id: CommentLikeId;
    userId: UserId;
    commentId: CommentId;
    createdAt: Date;
  }): CommentLike {
    return new CommentLike(props.id, {
      userId: props.userId,
      commentId: props.commentId,
      createdAt: props.createdAt,
    });
  }
}
