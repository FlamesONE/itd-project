import { graphql } from './graphql';

export const AdminDashboardStatsQuery = graphql(`
  query AdminDashboardStats {
    adminDashboardStats {
      totalUsers
      totalPosts
      totalComments
      totalLikes
      onlineUsers
      newUsersToday
      newPostsToday
      engagementRate
    }
  }
`);

export const AdminUserActivityQuery = graphql(`
  query AdminUserActivity($days: Int) {
    adminUserActivity(days: $days) {
      date
      users
      posts
      comments
    }
  }
`);

export const AdminTopUsersQuery = graphql(`
  query AdminTopUsers($limit: Int) {
    adminTopUsers(limit: $limit) {
      id
      username
      displayName
      emoji
      avatarUrl
      followersCount
      postsCount
      engagementScore
    }
  }
`);

export const AdminHourlyActivityQuery = graphql(`
  query AdminHourlyActivity {
    adminHourlyActivity {
      hour
      posts
      comments
      likes
    }
  }
`);

export const AdminGrowthMetricsQuery = graphql(`
  query AdminGrowthMetrics($days: Int) {
    adminGrowthMetrics(days: $days) {
      date
      totalUsers
      totalPosts
      dailyActiveUsers
    }
  }
`);

export const AdminCheckAccessQuery = graphql(`
  query AdminCheckAccess {
    adminCheckAccess
  }
`);

export const AdminSearchUsersQuery = graphql(`
  query AdminSearchUsers($query: String!, $limit: Int, $offset: Int) {
    adminSearchUsers(query: $query, limit: $limit, offset: $offset) {
      id
      email
      username
      displayName
      emoji
      avatarUrl
      bio
      verified
      followersCount
      followingCount
      postsCount
      createdAt
    }
  }
`);

export const AdminGetAllUsersQuery = graphql(`
  query AdminGetAllUsers($limit: Int, $offset: Int) {
    adminGetAllUsers(limit: $limit, offset: $offset) {
      users {
        id
        email
        username
        displayName
        emoji
        avatarUrl
        bio
        verified
        followersCount
        followingCount
        postsCount
        createdAt
      }
      total
    }
  }
`);
