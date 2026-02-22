import { BaseDomainEvent } from "../../shared/DomainEvent";

export class PostDeleted extends BaseDomainEvent {
  readonly eventName = "PostDeleted";
  readonly aggregateId: string;

  constructor(
    public readonly postId: string,
    public readonly authorId: string
  ) {
    super();
    this.aggregateId = postId;
  }
}
