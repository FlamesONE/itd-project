
import { PostgresUserRepository } from "./infrastructure/persistence/postgresql/repositories/PostgresUserRepository";
import { PostgresPostRepository } from "./infrastructure/persistence/postgresql/repositories/PostgresPostRepository";
import { PostgresFollowRepository } from "./infrastructure/persistence/postgresql/repositories/PostgresFollowRepository";
import { PostgresLikeRepository } from "./infrastructure/persistence/postgresql/repositories/PostgresLikeRepository";
import { PostgresCommentRepository } from "./infrastructure/persistence/postgresql/repositories/PostgresCommentRepository";
import { PostgresRepostRepository } from "./infrastructure/persistence/postgresql/repositories/PostgresRepostRepository";
import { PostgresNotificationRepository } from "./infrastructure/persistence/postgresql/repositories/PostgresNotificationRepository";
import { BroadcastingNotificationRepository } from "./infrastructure/persistence/postgresql/repositories/BroadcastingNotificationRepository";
import type { INotificationRepository } from "./domain/notification/repositories/INotificationRepository";
import { PostgresCommentLikeRepository } from "./infrastructure/persistence/postgresql/repositories/PostgresCommentLikeRepository";

import { BcryptPasswordHasher } from "./infrastructure/services/BcryptPasswordHasher";
import { JwtTokenService } from "./infrastructure/services/JwtTokenService";

import { RegisterUser } from "./application/identity/use-cases/RegisterUser";
import { LoginUser } from "./application/identity/use-cases/LoginUser";
import { GetUserProfile } from "./application/identity/use-cases/GetUserProfile";
import { GetUserByUsername } from "./application/identity/use-cases/GetUserByUsername";
import { RefreshToken } from "./application/identity/use-cases/RefreshToken";
import { UpdateProfile } from "./application/identity/use-cases/UpdateProfile";
import { ChangePassword } from "./application/identity/use-cases/ChangePassword";
import { UpdateEmail } from "./application/identity/use-cases/UpdateEmail";
import { UpdateUsername } from "./application/identity/use-cases/UpdateUsername";

import { CreatePost } from "./application/content/use-cases/CreatePost";
import { GetPost } from "./application/content/use-cases/GetPost";
import { DeletePost } from "./application/content/use-cases/DeletePost";
import { UpdatePost } from "./application/content/use-cases/UpdatePost";
import { GetFeed } from "./application/content/use-cases/GetFeed";
import { CreateComment } from "./application/content/use-cases/CreateComment";
import { DeleteComment } from "./application/content/use-cases/DeleteComment";
import { GetComments } from "./application/content/use-cases/GetComments";
import { ReplyToComment } from "./application/content/use-cases/ReplyToComment";
import { ViewPost } from "./application/content/use-cases/ViewPost";
import { PinPost } from "./application/content/use-cases/PinPost";
import { UnpinPost } from "./application/content/use-cases/UnpinPost";

import { FollowUser } from "./application/social/use-cases/FollowUser";
import { UnfollowUser } from "./application/social/use-cases/UnfollowUser";
import { LikePost } from "./application/social/use-cases/LikePost";
import { UnlikePost } from "./application/social/use-cases/UnlikePost";
import { RepostPost } from "./application/social/use-cases/RepostPost";
import { UnrepostPost } from "./application/social/use-cases/UnrepostPost";
import { LikeComment } from "./application/social/use-cases/LikeComment";
import { UnlikeComment } from "./application/social/use-cases/UnlikeComment";

import { GetNotifications } from "./application/notification/use-cases/GetNotifications";
import { MarkNotificationAsRead } from "./application/notification/use-cases/MarkNotificationAsRead";
import { MarkAllNotificationsAsRead } from "./application/notification/use-cases/MarkAllNotificationsAsRead";
import { CreateNotification } from "./application/notification/use-cases/CreateNotification";
import { GetUnreadCount } from "./application/notification/use-cases/GetUnreadCount";

import { RateLimiter } from "./infrastructure/services/antibot/RateLimiter";
import { SpamDetector } from "./infrastructure/services/antibot/SpamDetector";
import { BehaviorAnalyzer } from "./infrastructure/services/antibot/BehaviorAnalyzer";
import { CaptchaValidator } from "./infrastructure/services/antibot/CaptchaValidator";
import { PostgresTrustScoreRepository } from "./infrastructure/persistence/postgresql/repositories/PostgresTrustScoreRepository";

import { CheckRateLimit } from "./application/antibot/use-cases/CheckRateLimit";
import { CheckSpam } from "./application/antibot/use-cases/CheckSpam";
import { GetTrustScore } from "./application/antibot/use-cases/GetTrustScore";

import { PostgresMediaRepository } from "./infrastructure/persistence/postgresql/repositories/PostgresMediaRepository";
import { LocalMediaService } from "./infrastructure/services/media/LocalMediaService";
import { UploadMedia } from "./application/media/use-cases/UploadMedia";
import { GetMediaByPost } from "./application/media/use-cases/GetMediaByPost";
import { AttachMediaToPost } from "./application/media/use-cases/AttachMediaToPost";

import { GetTrending } from "./application/content/use-cases/GetTrending";

import { NodemailerEmailService } from "./infrastructure/services/email/NodemailerEmailService";
import { SendWelcomeEmail } from "./application/email/use-cases/SendWelcomeEmail";

import { SimpleRecommendationService } from "./infrastructure/services/recommendation/SimpleRecommendationService";
import { RecommendationCacheService } from "./infrastructure/services/recommendation/RecommendationCacheService";
import { CollaborativeFilteringService } from "./infrastructure/services/recommendation/CollaborativeFilteringService";
import { ContentBasedService } from "./infrastructure/services/recommendation/ContentBasedService";
import { ScoringService } from "./infrastructure/services/recommendation/ScoringService";
import { GetUserRecommendations } from "./application/recommendation/use-cases/GetUserRecommendations";
import { GetPostRecommendations } from "./application/recommendation/use-cases/GetPostRecommendations";

import { PostgresHashtagRepository } from "./infrastructure/persistence/postgresql/repositories/PostgresHashtagRepository";
import { GetTrendingHashtags } from "./application/content/use-cases/GetTrendingHashtags";
import { SearchHashtags } from "./application/content/use-cases/SearchHashtags";
import { GetPostsByHashtag } from "./application/content/use-cases/GetPostsByHashtag";

import { SearchPosts } from "./application/content/use-cases/SearchPosts";
import { SearchUsers } from "./application/identity/use-cases/SearchUsers";

import { PostgresClanRepository } from "./infrastructure/persistence/postgresql/repositories/PostgresClanRepository";
import { GetClanStats } from "./application/identity/use-cases/GetClanStats";

import { PostgresAdminStatsRepository } from "./infrastructure/persistence/postgresql/repositories/PostgresAdminStatsRepository";
import { GetDashboardStats } from "./application/admin/use-cases/GetDashboardStats";
import { GetUserActivityData } from "./application/admin/use-cases/GetUserActivityData";
import { GetTopUsers } from "./application/admin/use-cases/GetTopUsers";
import { GetHourlyActivity } from "./application/admin/use-cases/GetHourlyActivity";
import { GetGrowthMetrics } from "./application/admin/use-cases/GetGrowthMetrics";
import { OnlineUsersService } from "./infrastructure/services/admin/OnlineUsersService";

export interface Container {

  userRepository: PostgresUserRepository;
  postRepository: PostgresPostRepository;
  followRepository: PostgresFollowRepository;
  likeRepository: PostgresLikeRepository;
  commentRepository: PostgresCommentRepository;
  repostRepository: PostgresRepostRepository;
  notificationRepository: INotificationRepository;
  commentLikeRepository: PostgresCommentLikeRepository;

  passwordHasher: BcryptPasswordHasher;
  tokenService: JwtTokenService;

  registerUser: RegisterUser;
  loginUser: LoginUser;
  getUserProfile: GetUserProfile;
  getUserByUsername: GetUserByUsername;
  refreshToken: RefreshToken;
  updateProfile: UpdateProfile;
  changePassword: ChangePassword;
  updateEmail: UpdateEmail;
  updateUsername: UpdateUsername;

  createPost: CreatePost;
  getPost: GetPost;
  deletePost: DeletePost;
  updatePost: UpdatePost;
  getFeed: GetFeed;
  viewPost: ViewPost;
  createComment: CreateComment;
  deleteComment: DeleteComment;
  getComments: GetComments;
  replyToComment: ReplyToComment;
  pinPost: PinPost;
  unpinPost: UnpinPost;

  followUser: FollowUser;
  unfollowUser: UnfollowUser;
  likePost: LikePost;
  unlikePost: UnlikePost;
  repostPost: RepostPost;
  unrepostPost: UnrepostPost;
  likeComment: LikeComment;
  unlikeComment: UnlikeComment;

  getNotifications: GetNotifications;
  markNotificationAsRead: MarkNotificationAsRead;
  markAllNotificationsAsRead: MarkAllNotificationsAsRead;
  createNotification: CreateNotification;
  getUnreadCount: GetUnreadCount;

  trustScoreRepository: PostgresTrustScoreRepository;
  rateLimiter: RateLimiter;
  spamDetector: SpamDetector;
  behaviorAnalyzer: BehaviorAnalyzer;
  captchaValidator: CaptchaValidator;
  checkRateLimit: CheckRateLimit;
  checkSpam: CheckSpam;
  getTrustScore: GetTrustScore;

  mediaRepository: PostgresMediaRepository;
  mediaService: LocalMediaService;
  uploadMedia: UploadMedia;
  getMediaByPost: GetMediaByPost;
  attachMediaToPost: AttachMediaToPost;

  getTrending: GetTrending;

  emailService: NodemailerEmailService;
  sendWelcomeEmail: SendWelcomeEmail;

  recommendationCacheService: RecommendationCacheService;
  collaborativeFilteringService: CollaborativeFilteringService;
  contentBasedService: ContentBasedService;
  scoringService: ScoringService;
  recommendationService: SimpleRecommendationService;
  getUserRecommendations: GetUserRecommendations;
  getPostRecommendations: GetPostRecommendations;

  hashtagRepository: PostgresHashtagRepository;
  getTrendingHashtags: GetTrendingHashtags;
  searchHashtags: SearchHashtags;
  getPostsByHashtag: GetPostsByHashtag;

  clanRepository: PostgresClanRepository;
  getClanStats: GetClanStats;

  searchPosts: SearchPosts;
  searchUsers: SearchUsers;

  adminStatsRepository: PostgresAdminStatsRepository;
  onlineUsersService: OnlineUsersService;
  getDashboardStats: GetDashboardStats;
  getUserActivityData: GetUserActivityData;
  getTopUsers: GetTopUsers;
  getHourlyActivity: GetHourlyActivity;
  getGrowthMetrics: GetGrowthMetrics;
}

let container: Container | null = null;

export function getContainer(): Container {
  if (container) return container;

  const userRepository = new PostgresUserRepository();
  const postRepository = new PostgresPostRepository();
  const followRepository = new PostgresFollowRepository();
  const likeRepository = new PostgresLikeRepository();
  const commentRepository = new PostgresCommentRepository();
  const repostRepository = new PostgresRepostRepository();
  const baseNotificationRepository = new PostgresNotificationRepository();

  const notificationRepository = new BroadcastingNotificationRepository(
    baseNotificationRepository,
    userRepository
  );
  const commentLikeRepository = new PostgresCommentLikeRepository();

  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new JwtTokenService();

  const registerUser = new RegisterUser(userRepository, passwordHasher);
  const loginUser = new LoginUser(userRepository, passwordHasher, tokenService);
  const getUserProfile = new GetUserProfile(userRepository, followRepository);
  const getUserByUsername = new GetUserByUsername(userRepository, followRepository);
  const refreshToken = new RefreshToken(userRepository, tokenService, tokenService);
  const updateProfile = new UpdateProfile(userRepository);
  const changePassword = new ChangePassword(userRepository, passwordHasher, passwordHasher);
  const updateEmail = new UpdateEmail(userRepository, passwordHasher);
  const updateUsername = new UpdateUsername(userRepository, passwordHasher);

  const recommendationCacheService = new RecommendationCacheService();

  const createPost = new CreatePost(postRepository, userRepository, notificationRepository, recommendationCacheService);
  const getPost = new GetPost(postRepository, userRepository, likeRepository, commentRepository, repostRepository);
  const deletePost = new DeletePost(postRepository);
  const updatePost = new UpdatePost(postRepository);
  const getFeed = new GetFeed(postRepository, userRepository, likeRepository, repostRepository);
  const viewPost = new ViewPost(postRepository);
  const createComment = new CreateComment(commentRepository, postRepository, userRepository, notificationRepository);
  const deleteComment = new DeleteComment(commentRepository);
  const getComments = new GetComments(commentRepository, postRepository, userRepository);
  const replyToComment = new ReplyToComment(commentRepository, postRepository, userRepository, notificationRepository);
  const pinPost = new PinPost(postRepository, userRepository, followRepository);
  const unpinPost = new UnpinPost(postRepository);

  const followUser = new FollowUser(followRepository, userRepository, notificationRepository, recommendationCacheService);
  const unfollowUser = new UnfollowUser(followRepository, recommendationCacheService);
  const likePost = new LikePost(likeRepository, postRepository, notificationRepository, recommendationCacheService);
  const unlikePost = new UnlikePost(likeRepository);
  const repostPost = new RepostPost(repostRepository, postRepository, notificationRepository);
  const unrepostPost = new UnrepostPost(repostRepository);
  const likeComment = new LikeComment(commentLikeRepository, commentRepository, notificationRepository);
  const unlikeComment = new UnlikeComment(commentLikeRepository);

  const getNotifications = new GetNotifications(notificationRepository, userRepository);
  const markNotificationAsRead = new MarkNotificationAsRead(notificationRepository);
  const markAllNotificationsAsRead = new MarkAllNotificationsAsRead(notificationRepository);
  const createNotification = new CreateNotification(notificationRepository);
  const getUnreadCount = new GetUnreadCount(notificationRepository);

  const trustScoreRepository = new PostgresTrustScoreRepository();
  const rateLimiter = new RateLimiter();
  const spamDetector = new SpamDetector();
  const behaviorAnalyzer = new BehaviorAnalyzer();
  const captchaValidator = new CaptchaValidator();

  const checkRateLimit = new CheckRateLimit(rateLimiter);
  const checkSpam = new CheckSpam(spamDetector);
  const getTrustScore = new GetTrustScore(trustScoreRepository, userRepository, followRepository);

  const mediaRepository = new PostgresMediaRepository();
  const mediaService = new LocalMediaService();
  const uploadMedia = new UploadMedia(mediaRepository, mediaService);
  const getMediaByPost = new GetMediaByPost(mediaRepository);
  const attachMediaToPost = new AttachMediaToPost(mediaRepository);

  const getTrendingUseCase = new GetTrending(postRepository, userRepository, likeRepository, repostRepository);

  const emailService = new NodemailerEmailService();
  const sendWelcomeEmail = new SendWelcomeEmail(emailService);

  const collaborativeFilteringService = new CollaborativeFilteringService(recommendationCacheService);
  const contentBasedService = new ContentBasedService(recommendationCacheService);
  const scoringService = new ScoringService();
  const recommendationService = new SimpleRecommendationService(
    userRepository,
    followRepository,
    postRepository,
    likeRepository,
    recommendationCacheService,
    collaborativeFilteringService,
    contentBasedService,
    scoringService
  );
  const getUserRecommendations = new GetUserRecommendations(recommendationService);
  const getPostRecommendations = new GetPostRecommendations(recommendationService);

  const hashtagRepository = new PostgresHashtagRepository();
  const getTrendingHashtags = new GetTrendingHashtags(hashtagRepository);
  const searchHashtags = new SearchHashtags(hashtagRepository);
  const getPostsByHashtag = new GetPostsByHashtag(
    hashtagRepository,
    userRepository,
    likeRepository,
    repostRepository
  );

  const clanRepository = new PostgresClanRepository();
  const getClanStats = new GetClanStats(clanRepository);

  const searchPosts = new SearchPosts(
    postRepository,
    userRepository,
    likeRepository,
    repostRepository
  );
  const searchUsers = new SearchUsers(userRepository, followRepository);

  const adminStatsRepository = new PostgresAdminStatsRepository();
  const onlineUsersService = new OnlineUsersService();
  const getDashboardStats = new GetDashboardStats(adminStatsRepository);
  const getUserActivityData = new GetUserActivityData(adminStatsRepository);
  const getTopUsers = new GetTopUsers(adminStatsRepository);
  const getHourlyActivity = new GetHourlyActivity(adminStatsRepository);
  const getGrowthMetrics = new GetGrowthMetrics(adminStatsRepository);

  container = {
    userRepository,
    postRepository,
    followRepository,
    likeRepository,
    commentRepository,
    repostRepository,
    passwordHasher,
    tokenService,
    registerUser,
    loginUser,
    getUserProfile,
    getUserByUsername,
    refreshToken,
    updateProfile,
    changePassword,
    updateEmail,
    updateUsername,
    createPost,
    getPost,
    deletePost,
    updatePost,
    getFeed,
    viewPost,
    createComment,
    deleteComment,
    getComments,
    replyToComment,
    pinPost,
    unpinPost,
    followUser,
    unfollowUser,
    likePost,
    unlikePost,
    repostPost,
    unrepostPost,
    likeComment,
    unlikeComment,
    notificationRepository,
    commentLikeRepository,
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    createNotification,
    getUnreadCount,

    trustScoreRepository,
    rateLimiter,
    spamDetector,
    behaviorAnalyzer,
    captchaValidator,
    checkRateLimit,
    checkSpam,
    getTrustScore,

    mediaRepository,
    mediaService,
    uploadMedia,
    getMediaByPost,
    attachMediaToPost,

    getTrending: getTrendingUseCase,

    emailService,
    sendWelcomeEmail,

    recommendationCacheService,
    collaborativeFilteringService,
    contentBasedService,
    scoringService,
    recommendationService,
    getUserRecommendations,
    getPostRecommendations,

    hashtagRepository,
    getTrendingHashtags,
    searchHashtags,
    getPostsByHashtag,

    clanRepository,
    getClanStats,

    searchPosts,
    searchUsers,

    adminStatsRepository,
    onlineUsersService,
    getDashboardStats,
    getUserActivityData,
    getTopUsers,
    getHourlyActivity,
    getGrowthMetrics,
  };

  return container;
}

export function clearContainer(): void {
  container = null;
}
