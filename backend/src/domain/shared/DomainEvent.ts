import { v4 as uuidv4 } from "uuid";

export interface DomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly eventName: string;
  readonly aggregateId: string;
}

export abstract class BaseDomainEvent implements DomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  abstract readonly eventName: string;
  abstract readonly aggregateId: string;

  constructor() {
    this.eventId = uuidv4();
    this.occurredOn = new Date();
  }
}
