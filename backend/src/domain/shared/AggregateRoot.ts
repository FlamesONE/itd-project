import { Entity } from "./Entity";
import type { DomainEvent } from "./DomainEvent";

export abstract class AggregateRoot<Props, Id> extends Entity<Props, Id> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }
}
