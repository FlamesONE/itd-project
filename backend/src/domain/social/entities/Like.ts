import { Entity } from "../../shared/Entity";
import { Result } from "../../shared/Result";
import { LikeId } from "../value-objects/LikeId";
import { UserId } from "../../identity/value-objects/UserId";
import { PostId } from "../../content/value-objects/PostId";

export interface LikeProps {
  userId: UserId;
  postId: PostId;
  createdAt: Date;
}

export class Like extends Entity<LikeProps, LikeId> {
  private constructor(id: LikeId, props: LikeProps) {
    super(id, props);
  }

  get userId(): UserId {
    return this.props.userId;
  }

  get postId(): PostId {
    return this.props.postId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  public static create(props: {
    userId: UserId;
    postId: PostId;
    id?: LikeId;
  }): Result<Like> {
    const idResult = props.id ?? LikeId.create().getValue();

    const like = new Like(idResult, {
      userId: props.userId,
      postId: props.postId,
      createdAt: new Date(),
    });

    return Result.ok(like);
  }

  public static reconstitute(props: {
    id: LikeId;
    userId: UserId;
    postId: PostId;
    createdAt: Date;
  }): Like {
    return new Like(props.id, {
      userId: props.userId,
      postId: props.postId,
      createdAt: props.createdAt,
    });
  }
}
