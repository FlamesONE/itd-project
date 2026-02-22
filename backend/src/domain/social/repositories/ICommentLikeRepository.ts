import { CommentLike } from "../entities/CommentLike";
import { CommentLikeId } from "../value-objects/CommentLikeId";
import { UserId } from "../../identity/value-objects/UserId";
import { CommentId } from "../../content/value-objects/CommentId";

export interface ICommentLikeRepository {
  save(commentLike: CommentLike): Promise<void>;
  delete(id: CommentLikeId): Promise<void>;
  findById(id: CommentLikeId): Promise<CommentLike | null>;
  findByUserAndComment(userId: UserId, commentId: CommentId): Promise<CommentLike | null>;
  isLikedBy(userId: UserId, commentId: CommentId): Promise<boolean>;
  countByComment(commentId: CommentId): Promise<number>;
}
