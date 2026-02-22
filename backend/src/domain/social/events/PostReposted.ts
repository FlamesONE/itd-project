import { BaseDomainEvent } from "../../shared/DomainEvent";

export class PostReposted extends BaseDomainEvent {
  readonly eventName = "PostReposted";
  readonly aggregateId: string;

  constructor(
    public readonly userId: string,
    public readonly postId: string,
    public readonly repostId: string,
    public readonly quoteContent: string | null
  ) {
    super();
    this.aggregateId = repostId;
  }
}
