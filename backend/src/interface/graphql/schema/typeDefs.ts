export const typeDefs = `#graphql
  enum WallPrivacy {
    public
    followers
    private
  }

  type User {
    id: ID!
    email: String!
    username: String!
    displayName: String!
    bio: String
    emoji: String!
    avatarUrl: String
    coverUrl: String
    verified: Boolean!
    followersCount: Int!
    followingCount: Int!
    postsCount: Int!
    wallPrivacy: WallPrivacy!
    canViewWall: Boolean!
    isFollowing: Boolean!
    followsMe: Boolean!
    lastSeenAt: String
    isOnline: Boolean!
    createdAt: String!
  }

  type ClanStats {
    emoji: String!
    membersCount: Int!
    percentage: Int!
  }

  type Hashtag {
    id: ID!
    name: String!
    postsCount: Int!
    dailyCount: Int!
    weeklyCount: Int!
  }

  type HashtagSearchResult {
    id: ID!
    name: String!
    postsCount: Int!
  }

  type HashtagPostsResult {
    hashtag: String!
    postsCount: Int!
    posts: [Post!]!
  }

  type RepostInfo {
    quoteContent: String
    repostedAt: String!
    repostedById: ID
    repostedByUsername: String
    repostedByDisplayName: String
    repostedByEmoji: String
    repostedByAvatarUrl: String
    repostedByVerified: Boolean
  }

  type Post {
    id: ID!
    author: User!
    wallOwner: User
    content: String!
    media: [Media!]!
    likesCount: Int!
    commentsCount: Int!
    repostsCount: Int!
    viewsCount: Int!
    isPinned: Boolean!
    pinnedAt: String
    isLiked: Boolean!
    isReposted: Boolean!
    repostInfo: RepostInfo
    comments(limit: Int, offset: Int): [Comment!]!
    createdAt: String!
    updatedAt: String!
  }

  type Media {
    id: ID!
    url: String!
    thumbnailUrl: String
    width: Int
    height: Int
    type: MediaType!
  }

  enum MediaType {
    IMAGE
    AVATAR
    COVER
  }

  enum CommentSortBy {
    NEWEST
    POPULAR
  }

  type Repost {
    id: ID!
    user: User!
    post: Post!
    quoteContent: String
    createdAt: String!
  }

  enum NotificationType {
    like
    comment
    repost
    follow
    mention
    reply
  }

  type Notification {
    id: ID!
    user: User!
    actor: User!
    type: NotificationType!
    post: Post
    comment: Comment
    isRead: Boolean!
    createdAt: String!
  }

  type Comment {
    id: ID!
    post: Post!
    author: User!
    parentComment: Comment
    content: String!
    audioUrl: String
    audioDuration: Int
    likesCount: Int!
    repliesCount: Int!
    isLiked: Boolean!
    replies(limit: Int, offset: Int): [Comment!]!
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    accessToken: String!
    refreshToken: String!
    user: User!
  }

  type TokenPayload {
    accessToken: String!
    refreshToken: String!
  }

  type HealthStatus {
    status: String!
    timestamp: String!
    services: ServiceStatus!
  }

  type ServiceStatus {
    database: Boolean!
    redis: Boolean!
  }

  type TrendingPost {
    id: ID!
    author: User!
    content: String!
    media: [Media!]!
    likesCount: Int!
    commentsCount: Int!
    repostsCount: Int!
    viewsCount: Int!
    isLiked: Boolean!
    isReposted: Boolean!
    engagementScore: Float!
    createdAt: String!
    updatedAt: String!
  }

  type ViewPostResult {
    viewsCount: Int!
    counted: Boolean!
  }

  enum TrendingPeriod {
    DAY
    WEEK
    MONTH
  }

  type RecommendedUser {
    userId: ID!
    username: String!
    displayName: String!
    emoji: String!
    avatarUrl: String
    bio: String
    followersCount: Int!
    mutualFollowersCount: Int!
    score: Float!
    reason: String!
  }

  type RecommendedPost {
    postId: ID!
    authorId: ID!
    author: User
    content: String!
    likesCount: Int!
    commentsCount: Int!
    repostsCount: Int!
    score: Float!
    reason: String!
  }

  type Query {
    # Health
    health: HealthStatus!

    # Identity
    me: User
    user(id: ID!): User
    userByUsername(username: String!): User

    # Content
    post(id: ID!): Post
    feed(limit: Int, offset: Int): [Post!]!
    trending(limit: Int, offset: Int, period: TrendingPeriod): [TrendingPost!]!
    userPosts(userId: ID!, limit: Int, offset: Int): [Post!]!

    # Comments
    comments(postId: ID!, limit: Int, offset: Int, sortBy: CommentSortBy): [Comment!]!
    commentReplies(commentId: ID!, limit: Int, offset: Int): [Comment!]!

    # Reposts
    userReposts(userId: ID!, limit: Int, offset: Int): [Repost!]!

    # Notifications
    notifications(limit: Int, offset: Int, unreadOnly: Boolean): [Notification!]!
    unreadNotificationsCount: Int!

    # Media
    postMedia(postId: ID!): [Media!]!

    # Recommendations
    recommendedUsers(limit: Int): [RecommendedUser!]!
    recommendedPosts(limit: Int): [RecommendedPost!]!

    # Hashtags
    trendingHashtags(period: String, limit: Int): [Hashtag!]!
    searchHashtags(query: String!, limit: Int): [HashtagSearchResult!]!
    postsByHashtag(hashtag: String!, limit: Int, offset: Int): HashtagPostsResult!

    # Search
    searchPosts(query: String!, limit: Int, offset: Int): [Post!]!
    searchUsers(query: String!, limit: Int, offset: Int): [User!]!

    # Clans
    clanStats(limit: Int): [ClanStats!]!

    # Admin
    adminDashboardStats: AdminDashboardStats!
    adminUserActivity(days: Int): [AdminUserActivity!]!
    adminTopUsers(limit: Int): [AdminTopUser!]!
    adminHourlyActivity: [AdminHourlyActivity!]!
    adminGrowthMetrics(days: Int): [AdminGrowthMetric!]!
    adminCheckAccess: Boolean!
    adminSearchUsers(query: String!, limit: Int, offset: Int): [AdminUserInfo!]!
    adminGetAllUsers(limit: Int, offset: Int): AdminUsersResult!
  }

  # Admin Types
  type AdminDashboardStats {
    totalUsers: Int!
    totalPosts: Int!
    totalComments: Int!
    totalLikes: Int!
    onlineUsers: Int!
    newUsersToday: Int!
    newPostsToday: Int!
    engagementRate: Float!
  }

  type AdminUserActivity {
    date: String!
    users: Int!
    posts: Int!
    comments: Int!
  }

  type AdminTopUser {
    id: ID!
    username: String!
    displayName: String!
    emoji: String!
    avatarUrl: String
    followersCount: Int!
    postsCount: Int!
    engagementScore: Int!
  }

  type AdminHourlyActivity {
    hour: Int!
    posts: Int!
    comments: Int!
    likes: Int!
  }

  type AdminGrowthMetric {
    date: String!
    totalUsers: Int!
    totalPosts: Int!
    dailyActiveUsers: Int!
  }

  type AdminUserInfo {
    id: ID!
    email: String!
    username: String!
    displayName: String!
    emoji: String!
    avatarUrl: String
    bio: String
    verified: Boolean!
    followersCount: Int!
    followingCount: Int!
    postsCount: Int!
    createdAt: String!
  }

  type AdminUsersResult {
    users: [AdminUserInfo!]!
    total: Int!
  }

  type Mutation {
    # Identity
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    refreshToken(refreshToken: String!): TokenPayload!
    updateProfile(input: UpdateProfileInput!): User!
    changePassword(input: ChangePasswordInput!): Boolean!
    updateEmail(input: UpdateEmailInput!): User!
    updateUsername(input: UpdateUsernameInput!): User!

    # Content
    createPost(content: String!, mediaIds: [ID!], targetUserId: ID): Post!
    updatePost(id: ID!, content: String!): Post!
    deletePost(id: ID!): Boolean!
    viewPost(postId: ID!, fingerprint: String): ViewPostResult!

    # Comments
    createComment(postId: ID!, content: String, audioUrl: String, audioDuration: Int): Comment!
    replyToComment(postId: ID!, parentCommentId: ID!, content: String, audioUrl: String, audioDuration: Int): Comment!
    deleteComment(id: ID!): Boolean!
    likeComment(commentId: ID!): Boolean!
    unlikeComment(commentId: ID!): Boolean!

    # Social
    followUser(userId: ID!): Boolean!
    unfollowUser(userId: ID!): Boolean!
    likePost(postId: ID!): Boolean!
    unlikePost(postId: ID!): Boolean!
    repostPost(postId: ID!, quoteContent: String): Repost!
    unrepostPost(postId: ID!): Boolean!

    # Notifications
    markNotificationAsRead(notificationId: ID, postId: ID): Boolean!
    markAllNotificationsAsRead: Boolean!

    # Post management
    pinPost(postId: ID!): Boolean!
    unpinPost(postId: ID!): Boolean!
  }

  input RegisterInput {
    email: String!
    username: String!
    password: String!
    displayName: String
    emoji: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input UpdateProfileInput {
    displayName: String
    bio: String
    emoji: String
    avatarUrl: String
    coverUrl: String
    wallPrivacy: WallPrivacy
  }

  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
  }

  input UpdateEmailInput {
    newEmail: String!
    password: String!
  }

  input UpdateUsernameInput {
    newUsername: String!
    password: String!
  }
`;
