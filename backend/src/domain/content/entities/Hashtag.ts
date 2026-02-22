import { AggregateRoot } from "../../shared/AggregateRoot";
import { Result } from "../../shared/Result";

export class HashtagId {
  private constructor(public readonly value: string) {}

  static create(value?: string): Result<HashtagId> {
    if (value) {
      return Result.ok(new HashtagId(value));
    }
    return Result.ok(new HashtagId(crypto.randomUUID()));
  }

  equals(other: HashtagId): boolean {
    return this.value === other.value;
  }
}

export interface HashtagProps {
  name: string;
  postsCount: number;
  dailyCount: number;
  weeklyCount: number;
  lastUsedAt: Date;
  createdAt: Date;
}

export class Hashtag extends AggregateRoot<HashtagProps, HashtagId> {
  private constructor(id: HashtagId, props: HashtagProps) {
    super(id, props);
  }

  get name(): string {
    return this.props.name;
  }

  get postsCount(): number {
    return this.props.postsCount;
  }

  get dailyCount(): number {
    return this.props.dailyCount;
  }

  get weeklyCount(): number {
    return this.props.weeklyCount;
  }

  get lastUsedAt(): Date {
    return this.props.lastUsedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  public static create(props: { name: string }): Result<Hashtag> {
    const id = HashtagId.create().getValue();
    const now = new Date();

    return Result.ok(
      new Hashtag(id, {
        name: props.name.toLowerCase(),
        postsCount: 0,
        dailyCount: 0,
        weeklyCount: 0,
        lastUsedAt: now,
        createdAt: now,
      })
    );
  }

  public static reconstitute(props: {
    id: HashtagId;
    name: string;
    postsCount: number;
    dailyCount: number;
    weeklyCount: number;
    lastUsedAt: Date;
    createdAt: Date;
  }): Hashtag {
    return new Hashtag(props.id, {
      name: props.name,
      postsCount: props.postsCount,
      dailyCount: props.dailyCount,
      weeklyCount: props.weeklyCount,
      lastUsedAt: props.lastUsedAt,
      createdAt: props.createdAt,
    });
  }
}
