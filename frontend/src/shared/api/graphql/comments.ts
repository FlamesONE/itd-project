import { graphql } from './graphql';

export const CommentFragment = graphql(`
  fragment CommentFields on Comment {
    id
    content
    audioUrl
    audioDuration
    likesCount
    repliesCount
    isLiked
    createdAt
    updatedAt
    author {
      id
      username
      displayName
      emoji
      avatarUrl
      verified
    }
  }
`);

export const CommentsQuery = graphql(`
  query Comments($postId: ID!, $limit: Int, $offset: Int, $sortBy: CommentSortBy) {
    comments(postId: $postId, limit: $limit, offset: $offset, sortBy: $sortBy) {
      id
      content
      audioUrl
      audioDuration
      likesCount
      repliesCount
      isLiked
      createdAt
      updatedAt
      author {
        id
        username
        displayName
        emoji
        avatarUrl
        verified
      }
    }
  }
`);

export const CommentRepliesQuery = graphql(`
  query CommentReplies($commentId: ID!, $limit: Int, $offset: Int) {
    commentReplies(commentId: $commentId, limit: $limit, offset: $offset) {
      id
      content
      audioUrl
      audioDuration
      likesCount
      repliesCount
      isLiked
      createdAt
      updatedAt
      author {
        id
        username
        displayName
        emoji
        avatarUrl
        verified
      }
    }
  }
`);

export const CreateCommentMutation = graphql(`
  mutation CreateComment($postId: ID!, $content: String, $audioUrl: String, $audioDuration: Int) {
    createComment(postId: $postId, content: $content, audioUrl: $audioUrl, audioDuration: $audioDuration) {
      id
      content
      audioUrl
      audioDuration
      likesCount
      repliesCount
      isLiked
      createdAt
      updatedAt
      author {
        id
        username
        displayName
        emoji
        avatarUrl
        verified
      }
    }
  }
`);

export const ReplyToCommentMutation = graphql(`
  mutation ReplyToComment($postId: ID!, $parentCommentId: ID!, $content: String, $audioUrl: String, $audioDuration: Int) {
    replyToComment(postId: $postId, parentCommentId: $parentCommentId, content: $content, audioUrl: $audioUrl, audioDuration: $audioDuration) {
      id
      content
      audioUrl
      audioDuration
      likesCount
      repliesCount
      isLiked
      createdAt
      updatedAt
      author {
        id
        username
        displayName
        emoji
        avatarUrl
        verified
      }
    }
  }
`);

export const DeleteCommentMutation = graphql(`
  mutation DeleteComment($id: ID!) {
    deleteComment(id: $id)
  }
`);

export const LikeCommentMutation = graphql(`
  mutation LikeComment($commentId: ID!) {
    likeComment(commentId: $commentId)
  }
`);

export const UnlikeCommentMutation = graphql(`
  mutation UnlikeComment($commentId: ID!) {
    unlikeComment(commentId: $commentId)
  }
`);

export const COMMENT_FRAGMENT = CommentFragment;
export const COMMENTS_QUERY = CommentsQuery;
export const COMMENT_REPLIES_QUERY = CommentRepliesQuery;
export const CREATE_COMMENT_MUTATION = CreateCommentMutation;
export const REPLY_TO_COMMENT_MUTATION = ReplyToCommentMutation;
export const DELETE_COMMENT_MUTATION = DeleteCommentMutation;
export const LIKE_COMMENT_MUTATION = LikeCommentMutation;
export const UNLIKE_COMMENT_MUTATION = UnlikeCommentMutation;
