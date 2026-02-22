import { BaseDomainEvent } from "../../shared/DomainEvent";

export class PostCreated extends BaseDomainEvent {
  readonly eventName = "PostCreated";
  readonly aggregateId: string;

  constructor(
    public readonly postId: string,
    public readonly authorId: string,
    public readonly content: string
  ) {
    super();
    this.aggregateId = postId;
  }
}
