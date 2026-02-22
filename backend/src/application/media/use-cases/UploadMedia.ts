import { Result, DomainError } from "../../../domain/shared/Result";
import { UserId } from "../../../domain/identity";
import { Media, MediaType } from "../../../domain/media";
import type { IMediaRepository, IMediaService } from "../../../domain/media";

export interface UploadMediaInput {
  userId: string;
  file: Buffer;
  filename: string;
  type?: MediaType;
}

export interface UploadMediaOutput {
  id: string;
  url: string;
  thumbnailUrl: string;
  width: number | null;
  height: number | null;
  mimeType: string;
}

export class UploadMedia {
  constructor(
    private readonly mediaRepository: IMediaRepository,
    private readonly mediaService: IMediaService
  ) {}

  async execute(input: UploadMediaInput): Promise<Result<UploadMediaOutput>> {
    const userIdResult = UserId.create(input.userId);
    if (userIdResult.isFailure()) {
      return Result.fail(
        new DomainError(userIdResult.getError().message, "INVALID_USER_ID")
      );
    }

    const userId = userIdResult.getValue();

    try {

      const uploadResult = await this.mediaService.uploadImage(
        input.file,
        input.userId,
        input.filename
      );

      const mediaResult = Media.create({
        userId,
        type: input.type ?? MediaType.IMAGE,
        url: uploadResult.url,
        thumbnailUrl: uploadResult.thumbnailUrl,
        width: uploadResult.width || null,
        height: uploadResult.height || null,
        fileSize: input.file.length,
        mimeType: uploadResult.mimeType,
      });

      if (mediaResult.isFailure()) {
        return Result.fail(mediaResult.getError());
      }

      const media = mediaResult.getValue();

      await this.mediaRepository.save(media);

      return Result.ok({
        id: media.id.value,
        url: media.url,
        thumbnailUrl: media.thumbnailUrl || media.url,
        width: media.width,
        height: media.height,
        mimeType: media.mimeType,
      });
    } catch (error) {
      return Result.fail(
        new DomainError(
          error instanceof Error ? error.message : "Upload failed",
          "UPLOAD_FAILED"
        )
      );
    }
  }
}
