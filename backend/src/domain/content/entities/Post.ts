import { AggregateRoot } from "../../shared/AggregateRoot";
import { Result, DomainError } from "../../shared/Result";
import { PostId } from "../value-objects/PostId";
import { PostContent } from "../value-objects/PostContent";
import { UserId } from "../../identity/value-objects/UserId";
import { PostCreated } from "../events/PostCreated";
import { PostDeleted } from "../events/PostDeleted";

export interface PostProps {
  authorId: UserId;
  wallOwnerId?: UserId;
  content: PostContent;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  viewsCount: number;
  engagementScore: number;
  isPinned: boolean;
  pinnedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

export class Post extends AggregateRoot<PostProps, PostId> {
  private constructor(id: PostId, props: PostProps) {
    super(id, props);
  }

  get authorId(): UserId {
    return this.props.authorId;
  }

  get wallOwnerId(): UserId | undefined {
    return this.props.wallOwnerId;
  }

  get content(): PostContent {
    return this.props.content;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get isDeleted(): boolean {
    return this.props.isDeleted;
  }

  get likesCount(): number {
    return this.props.likesCount;
  }

  get commentsCount(): number {
    return this.props.commentsCount;
  }

  get repostsCount(): number {
    return this.props.repostsCount;
  }

  get viewsCount(): number {
    return this.props.viewsCount;
  }

  get engagementScore(): number {
    return this.props.engagementScore;
  }

  get isPinned(): boolean {
    return this.props.isPinned;
  }

  get pinnedAt(): Date | undefined {
    return this.props.pinnedAt;
  }

  public static create(props: {
    authorId: UserId;
    wallOwnerId?: UserId;
    content: PostContent;
    id?: PostId;
  }): Result<Post> {
    const idResult = props.id ?? PostId.create().getValue();

    const now = new Date();
    const post = new Post(idResult, {
      authorId: props.authorId,
      wallOwnerId: props.wallOwnerId,
      content: props.content,
      likesCount: 0,
      commentsCount: 0,
      repostsCount: 0,
      viewsCount: 0,
      engagementScore: 0,
      isPinned: false,
      pinnedAt: undefined,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    });

    post.addDomainEvent(
      new PostCreated(
        idResult.value,
        props.authorId.value,
        props.content.value
      )
    );

    return Result.ok(post);
  }

  public static reconstitute(props: {
    id: PostId;
    authorId: UserId;
    wallOwnerId?: UserId;
    content: PostContent;
    likesCount?: number;
    commentsCount?: number;
    repostsCount?: number;
    viewsCount?: number;
    engagementScore?: number;
    isPinned?: boolean;
    pinnedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
  }): Post {
    return new Post(props.id, {
      authorId: props.authorId,
      wallOwnerId: props.wallOwnerId,
      content: props.content,
      likesCount: props.likesCount ?? 0,
      commentsCount: props.commentsCount ?? 0,
      repostsCount: props.repostsCount ?? 0,
      viewsCount: props.viewsCount ?? 0,
      engagementScore: props.engagementScore ?? 0,
      isPinned: props.isPinned ?? false,
      pinnedAt: props.pinnedAt,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      isDeleted: props.isDeleted,
    });
  }

  public updateContent(newContent: PostContent): Result<void> {
    if (this.props.isDeleted) {
      return Result.fail(new DomainError("Cannot update deleted post", "POST_DELETED"));
    }

    this.props.content = newContent;
    this.props.updatedAt = new Date();

    return Result.ok(undefined);
  }

  public delete(): Result<void> {
    if (this.props.isDeleted) {
      return Result.fail(new DomainError("Post already deleted", "POST_ALREADY_DELETED"));
    }

    this.props.isDeleted = true;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new PostDeleted(this.id.value, this.props.authorId.value)
    );

    return Result.ok(undefined);
  }

  public pin(): Result<void> {
    if (this.props.isDeleted) {
      return Result.fail(new DomainError("Cannot pin deleted post", "POST_DELETED"));
    }

    if (this.props.isPinned) {
      return Result.fail(new DomainError("Post already pinned", "POST_ALREADY_PINNED"));
    }

    this.props.isPinned = true;
    this.props.pinnedAt = new Date();
    this.props.updatedAt = new Date();

    return Result.ok(undefined);
  }

  public unpin(): Result<void> {
    if (!this.props.isPinned) {
      return Result.fail(new DomainError("Post is not pinned", "POST_NOT_PINNED"));
    }

    this.props.isPinned = false;
    this.props.pinnedAt = undefined;
    this.props.updatedAt = new Date();

    return Result.ok(undefined);
  }
}
