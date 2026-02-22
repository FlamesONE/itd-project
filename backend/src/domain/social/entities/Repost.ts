import { Entity } from "../../shared/Entity";
import { Result } from "../../shared/Result";
import { RepostId } from "../value-objects/RepostId";
import { UserId } from "../../identity/value-objects/UserId";
import { PostId } from "../../content/value-objects/PostId";

export interface RepostProps {
  userId: UserId;
  postId: PostId;
  quoteContent: string | null;
  createdAt: Date;
}

export class Repost extends Entity<RepostProps, RepostId> {
  private constructor(id: RepostId, props: RepostProps) {
    super(id, props);
  }

  get userId(): UserId {
    return this.props.userId;
  }

  get postId(): PostId {
    return this.props.postId;
  }

  get quoteContent(): string | null {
    return this.props.quoteContent;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  public static create(props: {
    userId: UserId;
    postId: PostId;
    quoteContent?: string;
    id?: RepostId;
  }): Result<Repost> {
    const idResult = props.id ?? RepostId.create().getValue();

    if (props.quoteContent && props.quoteContent.length > 280) {
      return Result.fail(new Error("Quote content cannot exceed 280 characters"));
    }

    const repost = new Repost(idResult, {
      userId: props.userId,
      postId: props.postId,
      quoteContent: props.quoteContent ?? null,
      createdAt: new Date(),
    });

    return Result.ok(repost);
  }

  public static reconstitute(props: {
    id: RepostId;
    userId: UserId;
    postId: PostId;
    quoteContent: string | null;
    createdAt: Date;
  }): Repost {
    return new Repost(props.id, {
      userId: props.userId,
      postId: props.postId,
      quoteContent: props.quoteContent,
      createdAt: props.createdAt,
    });
  }
}
