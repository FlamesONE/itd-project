import { Result, DomainError } from "../../../domain/shared/Result";
import type { IMediaRepository } from "../../../domain/media";
import { MediaId } from "../../../domain/media";
import { PostId } from "../../../domain/content";

export interface AttachMediaToPostInput {
	mediaIds: string[];
	postId: string;
	userId: string;
}

export class AttachMediaToPost {
	constructor(private readonly mediaRepository: IMediaRepository) { }

	async execute(input: AttachMediaToPostInput): Promise<Result<void>> {
		const postIdResult = PostId.create(input.postId);
		if (postIdResult.isFailure()) {
			return Result.fail(
				new DomainError(postIdResult.getError().message, "INVALID_POST_ID")
			);
		}

		const postId = postIdResult.getValue();

		for (const mediaIdStr of input.mediaIds) {
			const mediaIdResult = MediaId.create(mediaIdStr);
			if (mediaIdResult.isFailure()) {
				continue;
			}

			const mediaId = mediaIdResult.getValue();
			const media = await this.mediaRepository.findById(mediaId);

			if (!media) {
				continue;
			}

			if (media.userId.value !== input.userId) {
				continue;
			}

			if (media.postId && media.postId.value !== input.postId) {
				continue;
			}

			await this.mediaRepository.updatePostId(mediaId, postId);
		}

		return Result.ok(undefined);
	}
}
