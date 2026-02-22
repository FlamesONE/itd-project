import { AggregateRoot } from "../../shared/AggregateRoot";
import { Result, DomainError } from "../../shared/Result";
import { CommentId } from "../value-objects/CommentId";
import { PostId } from "../value-objects/PostId";
import { UserId } from "../../identity/value-objects/UserId";

export interface CommentProps {
  postId: PostId;
  authorId: UserId;
  parentCommentId: CommentId | null;
  content: string;
  audioUrl: string | null;
  audioDuration: number | null;
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

export class Comment extends AggregateRoot<CommentProps, CommentId> {
  private static readonly MAX_CONTENT_LENGTH = 500;

  private constructor(id: CommentId, props: CommentProps) {
    super(id, props);
  }

  get postId(): PostId {
    return this.props.postId;
  }

  get authorId(): UserId {
    return this.props.authorId;
  }

  get parentCommentId(): CommentId | null {
    return this.props.parentCommentId;
  }

  get likesCount(): number {
    return this.props.likesCount;
  }

  get content(): string {
    return this.props.content;
  }

  get audioUrl(): string | null {
    return this.props.audioUrl;
  }

  get audioDuration(): number | null {
    return this.props.audioDuration;
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

  public static create(props: {
    postId: PostId;
    authorId: UserId;
    content: string;
    audioUrl?: string;
    audioDuration?: number;
    parentCommentId?: CommentId;
    id?: CommentId;
  }): Result<Comment> {
    const hasContent = props.content && props.content.trim().length > 0;
    const hasAudio = props.audioUrl && props.audioUrl.trim().length > 0;

    if (!hasContent && !hasAudio) {
      return Result.fail(new DomainError("Comment must have either content or audio", "COMMENT_EMPTY"));
    }

    const trimmedContent = props.content?.trim() || "";

    if (trimmedContent.length > Comment.MAX_CONTENT_LENGTH) {
      return Result.fail(
        new DomainError(
          `Comment must be at most ${Comment.MAX_CONTENT_LENGTH} characters`,
          "COMMENT_TOO_LONG"
        )
      );
    }

    const idResult = props.id ?? CommentId.create().getValue();
    const now = new Date();

    const comment = new Comment(idResult, {
      postId: props.postId,
      authorId: props.authorId,
      parentCommentId: props.parentCommentId ?? null,
      content: trimmedContent,
      audioUrl: props.audioUrl ?? null,
      audioDuration: props.audioDuration ?? null,
      likesCount: 0,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    });

    return Result.ok(comment);
  }

  public static reconstitute(props: {
    id: CommentId;
    postId: PostId;
    authorId: UserId;
    parentCommentId: CommentId | null;
    content: string;
    audioUrl: string | null;
    audioDuration: number | null;
    likesCount: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
  }): Comment {
    return new Comment(props.id, {
      postId: props.postId,
      authorId: props.authorId,
      parentCommentId: props.parentCommentId,
      content: props.content,
      audioUrl: props.audioUrl,
      audioDuration: props.audioDuration,
      likesCount: props.likesCount,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      isDeleted: props.isDeleted,
    });
  }

  public delete(): Result<void> {
    if (this.props.isDeleted) {
      return Result.fail(new DomainError("Comment already deleted", "COMMENT_ALREADY_DELETED"));
    }

    this.props.isDeleted = true;
    this.props.updatedAt = new Date();

    return Result.ok(undefined);
  }
}
