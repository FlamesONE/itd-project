import { Entity } from "../../shared/Entity";
import { Result, DomainError } from "../../shared/Result";
import { FollowId } from "../value-objects/FollowId";
import { UserId } from "../../identity/value-objects/UserId";

export interface FollowProps {
  followerId: UserId;
  followingId: UserId;
  createdAt: Date;
}

export class Follow extends Entity<FollowProps, FollowId> {
  private constructor(id: FollowId, props: FollowProps) {
    super(id, props);
  }

  get followerId(): UserId {
    return this.props.followerId;
  }

  get followingId(): UserId {
    return this.props.followingId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  public static create(props: {
    followerId: UserId;
    followingId: UserId;
    id?: FollowId;
  }): Result<Follow> {
    if (props.followerId.equals(props.followingId)) {
      return Result.fail(new DomainError("Cannot follow yourself", "CANNOT_FOLLOW_SELF"));
    }

    const idResult = props.id ?? FollowId.create().getValue();

    const follow = new Follow(idResult, {
      followerId: props.followerId,
      followingId: props.followingId,
      createdAt: new Date(),
    });

    return Result.ok(follow);
  }

  public static reconstitute(props: {
    id: FollowId;
    followerId: UserId;
    followingId: UserId;
    createdAt: Date;
  }): Follow {
    return new Follow(props.id, {
      followerId: props.followerId,
      followingId: props.followingId,
      createdAt: props.createdAt,
    });
  }
}
