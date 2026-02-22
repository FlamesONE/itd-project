import { BaseDomainEvent } from "../../shared/DomainEvent";

export class UserFollowed extends BaseDomainEvent {
  readonly eventName = "UserFollowed";
  readonly aggregateId: string;

  constructor(
    public readonly followerId: string,
    public readonly followingId: string,
    public readonly followId: string
  ) {
    super();
    this.aggregateId = followId;
  }
}
