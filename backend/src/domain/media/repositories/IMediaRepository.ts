import type { Media } from "../entities/Media";
import type { MediaId } from "../value-objects";
import type { UserId } from "../../identity";
import type { PostId } from "../../content";

export interface IMediaRepository {
  findById(id: MediaId): Promise<Media | null>;
  findByPostId(postId: PostId): Promise<Media[]>;
  findByUserId(userId: UserId, limit?: number, offset?: number): Promise<Media[]>;
  save(media: Media): Promise<void>;
  delete(id: MediaId): Promise<void>;
  updatePostId(mediaId: MediaId, postId: PostId): Promise<void>;
}
