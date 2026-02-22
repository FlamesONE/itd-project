import { BaseDomainEvent } from "../../shared/DomainEvent";

export class CommentAdded extends BaseDomainEvent {
  readonly eventName = "CommentAdded";
  readonly aggregateId: string;

  constructor(
    public readonly commentId: string,
    public readonly postId: string,
    public readonly authorId: string,
    public readonly content: string
  ) {
    super();
    this.aggregateId = commentId;
  }
}
