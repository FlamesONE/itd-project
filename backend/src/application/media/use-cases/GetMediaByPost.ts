import { Result, DomainError } from "../../../domain/shared/Result";
import { PostId } from "../../../domain/content";
import type { IMediaRepository } from "../../../domain/media";

export interface GetMediaByPostInput {
  postId: string;
}

export interface MediaOutput {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  mimeType: string;
  type: string;
}

export class GetMediaByPost {
  constructor(private readonly mediaRepository: IMediaRepository) {}

  async execute(input: GetMediaByPostInput): Promise<Result<MediaOutput[]>> {
    const postIdResult = PostId.create(input.postId);
    if (postIdResult.isFailure()) {
      return Result.fail(
        new DomainError(postIdResult.getError().message, "INVALID_POST_ID")
      );
    }

    const media = await this.mediaRepository.findByPostId(postIdResult.getValue());

    return Result.ok(
      media.map((m) => ({
        id: m.id.value,
        url: m.url,
        thumbnailUrl: m.thumbnailUrl,
        width: m.width,
        height: m.height,
        mimeType: m.mimeType,
        type: m.type,
      }))
    );
  }
}
