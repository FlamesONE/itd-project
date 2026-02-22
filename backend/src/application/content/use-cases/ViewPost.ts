import { Result, DomainError } from "../../../domain/shared";
import { PostId } from "../../../domain/content";
import type { IPostRepository } from "../../../domain/content";
import { cacheGet, cacheSet } from "../../../infrastructure/persistence/redis/connection";

export interface ViewPostInput {
  postId: string;
  viewerId?: string;
  fingerprint?: string;
}

export interface ViewPostOutput {
  viewsCount: number;
  counted: boolean;
}

export class ViewPost {
  private readonly VIEW_TTL_SECONDS = 86400;

  constructor(private readonly postRepository: IPostRepository) {}

  async execute(input: ViewPostInput): Promise<Result<ViewPostOutput>> {

    const postIdResult = PostId.create(input.postId);
    if (postIdResult.isFailure()) {
      return Result.fail(postIdResult.getError());
    }

    const postId = postIdResult.getValue();

    const exists = await this.postRepository.existsById(postId);
    if (!exists) {
      return Result.fail(new DomainError("Post not found", "POST_NOT_FOUND"));
    }

    const viewerIdentifier = input.viewerId || input.fingerprint;
    if (!viewerIdentifier) {

      const viewsCount = await this.postRepository.incrementViewCount(postId);
      return Result.ok({ viewsCount, counted: true });
    }

    const viewKey = `view:${input.postId}:${viewerIdentifier}`;
    const alreadyViewed = await cacheGet<boolean>(viewKey);

    if (alreadyViewed) {

      const post = await this.postRepository.findById(postId);
      return Result.ok({
        viewsCount: post?.viewsCount ?? 0,
        counted: false,
      });
    }

    const viewsCount = await this.postRepository.incrementViewCount(postId);

    cacheSet(viewKey, true, this.VIEW_TTL_SECONDS).catch(() => {});

    return Result.ok({ viewsCount, counted: true });
  }
}
