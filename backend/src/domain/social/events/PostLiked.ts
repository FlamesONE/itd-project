import { BaseDomainEvent } from "../../shared/DomainEvent";

export class PostLiked extends BaseDomainEvent {
  readonly eventName = "PostLiked";
  readonly aggregateId: string;

  constructor(
    public readonly userId: string,
    public readonly postId: string,
    public readonly likeId: string
  ) {
    super();
    this.aggregateId = likeId;
  }
}
