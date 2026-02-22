import { graphql } from './graphql';

export const TrendingHashtagsQuery = graphql(`
  query TrendingHashtags($period: String, $limit: Int) {
    trendingHashtags(period: $period, limit: $limit) {
      id
      name
      postsCount
      dailyCount
      weeklyCount
    }
  }
`);

export const SearchHashtagsQuery = graphql(`
  query SearchHashtags($query: String!, $limit: Int) {
    searchHashtags(query: $query, limit: $limit) {
      id
      name
      postsCount
    }
  }
`);

export const PostsByHashtagQuery = graphql(`
  query PostsByHashtag($hashtag: String!, $limit: Int, $offset: Int) {
    postsByHashtag(hashtag: $hashtag, limit: $limit, offset: $offset) {
      hashtag
      postsCount
      posts {
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
  }
`);

export const TRENDING_HASHTAGS_QUERY = TrendingHashtagsQuery;
export const SEARCH_HASHTAGS_QUERY = SearchHashtagsQuery;
export const POSTS_BY_HASHTAG_QUERY = PostsByHashtagQuery;
