export abstract class Entity<Props, Id> {
  protected readonly _id: Id;
  protected props: Props;

  constructor(id: Id, props: Props) {
    this._id = id;
    this.props = props;
  }

  get id(): Id {
    return this._id;
  }

  equals(entity?: Entity<Props, Id>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    if (!(entity instanceof Entity)) {
      return false;
    }

    const thisId = this._id as unknown as { value?: string };
    const otherId = entity._id as unknown as { value?: string };

    if (thisId.value !== undefined && otherId.value !== undefined) {
      return thisId.value === otherId.value;
    }

    return this._id === entity._id;
  }
}
