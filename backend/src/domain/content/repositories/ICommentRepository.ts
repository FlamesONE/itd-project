import { Comment } from "../entities/Comment";
import { CommentId } from "../value-objects/CommentId";
import { PostId } from "../value-objects/PostId";
import { UserId } from "../../identity/value-objects/UserId";

export type CommentSortBy = 'NEWEST' | 'POPULAR';

export interface ICommentRepository {
  save(comment: Comment): Promise<void>;
  findById(id: CommentId): Promise<Comment | null>;
  findByPostId(postId: PostId, limit?: number, offset?: number, sortBy?: CommentSortBy): Promise<Comment[]>;
  findByAuthorId(authorId: UserId, limit?: number, offset?: number): Promise<Comment[]>;
  findReplies(parentCommentId: CommentId, limit?: number, offset?: number): Promise<Comment[]>;
  delete(id: CommentId): Promise<void>;
  countByPostId(postId: PostId): Promise<number>;
  countReplies(parentCommentId: CommentId): Promise<number>;
}
