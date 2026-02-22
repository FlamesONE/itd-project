import { BaseDomainEvent } from "../../shared/DomainEvent";

export class UserRegistered extends BaseDomainEvent {
  readonly eventName = "UserRegistered";
  readonly aggregateId: string;

  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly username: string
  ) {
    super();
    this.aggregateId = userId;
  }
}
