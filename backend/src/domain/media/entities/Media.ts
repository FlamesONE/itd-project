import { Entity } from "../../shared";
import { Result, DomainError } from "../../shared/Result";
import { MediaId, MediaType } from "../value-objects";
import { UserId } from "../../identity";
import { PostId } from "../../content";

interface MediaProps {
  userId: UserId;
  postId: PostId | null;
  type: MediaType;
  url: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  fileSize: number;
  mimeType: string;
  createdAt: Date;
}

export class Media extends Entity<MediaProps, MediaId> {
  get userId(): UserId {
    return this.props.userId;
  }

  get postId(): PostId | null {
    return this.props.postId;
  }

  get type(): MediaType {
    return this.props.type;
  }

  get url(): string {
    return this.props.url;
  }

  get thumbnailUrl(): string | null {
    return this.props.thumbnailUrl;
  }

  get width(): number | null {
    return this.props.width;
  }

  get height(): number | null {
    return this.props.height;
  }

  get fileSize(): number {
    return this.props.fileSize;
  }

  get mimeType(): string {
    return this.props.mimeType;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  private constructor(id: MediaId, props: MediaProps) {
    super(id, props);
  }

  public static create(props: {
    id?: MediaId;
    userId: UserId;
    postId?: PostId | null;
    type: MediaType;
    url: string;
    thumbnailUrl?: string | null;
    width?: number | null;
    height?: number | null;
    fileSize: number;
    mimeType: string;
  }): Result<Media> {
    const idResult = props.id ? Result.ok(props.id) : MediaId.create();
    if (idResult.isFailure()) {
      return Result.fail(idResult.getError());
    }

    if (!props.url) {
      return Result.fail(new DomainError("URL is required", "INVALID_URL"));
    }

    if (props.fileSize <= 0) {
      return Result.fail(
        new DomainError("File size must be positive", "INVALID_FILE_SIZE")
      );
    }

    return Result.ok(
      new Media(idResult.getValue(), {
        userId: props.userId,
        postId: props.postId ?? null,
        type: props.type,
        url: props.url,
        thumbnailUrl: props.thumbnailUrl ?? null,
        width: props.width ?? null,
        height: props.height ?? null,
        fileSize: props.fileSize,
        mimeType: props.mimeType,
        createdAt: new Date(),
      })
    );
  }

  public static reconstruct(
    id: MediaId,
    props: MediaProps
  ): Result<Media> {
    return Result.ok(new Media(id, props));
  }

  public attachToPost(postId: PostId): void {
    this.props.postId = postId;
  }
}
