import { graphql } from './graphql';

export const PostFragment = graphql(`
  fragment PostFields on Post {
    id
    content
    media {
      id
      url
      thumbnailUrl
      width
      height
      type
    }
    likesCount
    commentsCount
    repostsCount
    viewsCount
    isPinned
    pinnedAt
    isLiked
    isReposted
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

export const FeedQuery = graphql(`
  query Feed($limit: Int, $offset: Int) {
    feed(limit: $limit, offset: $offset) {
      id
      content
      media {
        id
        url
        thumbnailUrl
        width
        height
        type
      }
      isPinned
      pinnedAt
      likesCount
      commentsCount
      repostsCount
      viewsCount
      isLiked
      isReposted
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
      wallOwner {
        id
        username
        displayName
      }
    }
  }
`);

export const TrendingQuery = graphql(`
  query Trending($limit: Int, $offset: Int, $period: TrendingPeriod) {
    trending(limit: $limit, offset: $offset, period: $period) {
      id
      content
      media {
        id
        url
        thumbnailUrl
        width
        height
        type
      }
      likesCount
      commentsCount
      repostsCount
      viewsCount
      isLiked
      isReposted
      engagementScore
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

export const PostQuery = graphql(`
  query Post($id: ID!) {
    post(id: $id) {
      id
      content
      media {
        id
        url
        thumbnailUrl
        width
        height
        type
      }
      isPinned
      pinnedAt
      likesCount
      commentsCount
      repostsCount
      viewsCount
      isLiked
      isReposted
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
      wallOwner {
        id
        username
        displayName
      }
    }
  }
`);

export const UserPostsQuery = graphql(`
  query UserPosts($userId: ID!, $limit: Int, $offset: Int) {
    userPosts(userId: $userId, limit: $limit, offset: $offset) {
      id
      content
      media {
        id
        url
        thumbnailUrl
        width
        height
        type
      }
      isPinned
      pinnedAt
      likesCount
      commentsCount
      repostsCount
      viewsCount
      isLiked
      isReposted
      repostInfo {
        quoteContent
        repostedAt
        repostedById
        repostedByUsername
        repostedByDisplayName
        repostedByEmoji
        repostedByAvatarUrl
        repostedByVerified
      }
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
      wallOwner {
        id
        username
        displayName
      }
    }
  }
`);

export const CreatePostMutation = graphql(`
  mutation CreatePost($content: String!, $mediaIds: [ID!], $targetUserId: ID) {
    createPost(content: $content, mediaIds: $mediaIds, targetUserId: $targetUserId) {
      id
      content
      media {
        id
        url
        thumbnailUrl
        width
        height
        type
      }
      likesCount
      commentsCount
      repostsCount
      viewsCount
      isLiked
      isReposted
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
      wallOwner {
        id
        username
        displayName
      }
    }
  }
`);

export const DeletePostMutation = graphql(`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id)
  }
`);

export const LikePostMutation = graphql(`
  mutation LikePost($postId: ID!) {
    likePost(postId: $postId)
  }
`);

export const UnlikePostMutation = graphql(`
  mutation UnlikePost($postId: ID!) {
    unlikePost(postId: $postId)
  }
`);

export const RepostMutation = graphql(`
  mutation RepostPost($postId: ID!, $quoteContent: String) {
    repostPost(postId: $postId, quoteContent: $quoteContent) {
      id
      createdAt
    }
  }
`);

export const UnrepostMutation = graphql(`
  mutation UnrepostPost($postId: ID!) {
    unrepostPost(postId: $postId)
  }
`);

export const PinPostMutation = graphql(`
  mutation PinPost($postId: ID!) {
    pinPost(postId: $postId)
  }
`);

export const UnpinPostMutation = graphql(`
  mutation UnpinPost($postId: ID!) {
    unpinPost(postId: $postId)
  }
`);

export const ViewPostMutation = graphql(`
  mutation ViewPost($postId: ID!, $fingerprint: String) {
    viewPost(postId: $postId, fingerprint: $fingerprint) {
      viewsCount
      counted
    }
  }
`);

export const SearchPostsQuery = graphql(`
  query SearchPosts($query: String!, $limit: Int, $offset: Int) {
    searchPosts(query: $query, limit: $limit, offset: $offset) {
      id
      content
      media {
        id
        url
        thumbnailUrl
        width
        height
        type
      }
      likesCount
      commentsCount
      repostsCount
      viewsCount
      isLiked
      isReposted
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

export const POST_FRAGMENT = PostFragment;
export const FEED_QUERY = FeedQuery;
export const TRENDING_QUERY = TrendingQuery;
export const POST_QUERY = PostQuery;
export const USER_POSTS_QUERY = UserPostsQuery;
export const CREATE_POST_MUTATION = CreatePostMutation;
export const DELETE_POST_MUTATION = DeletePostMutation;
export const LIKE_POST_MUTATION = LikePostMutation;
export const UNLIKE_POST_MUTATION = UnlikePostMutation;
export const REPOST_MUTATION = RepostMutation;
export const UNREPOST_MUTATION = UnrepostMutation;
export const PIN_POST_MUTATION = PinPostMutation;
export const UNPIN_POST_MUTATION = UnpinPostMutation;
export const VIEW_POST_MUTATION = ViewPostMutation;
export const SEARCH_POSTS_QUERY = SearchPostsQuery;
