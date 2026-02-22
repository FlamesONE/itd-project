import { graphql } from './graphql';

export const UserFragment = graphql(`
  fragment UserFields on User {
    id
    email
    username
    displayName
    bio
    emoji
    avatarUrl
    coverUrl
    verified
    followersCount
    followingCount
    postsCount
    wallPrivacy
    canViewWall
    isFollowing
    followsMe
    lastSeenAt
    isOnline
    createdAt
  }
`);

export const UserQuery = graphql(`
  query User($id: ID!) {
    user(id: $id) {
      id
      email
      username
      displayName
      bio
      emoji
      avatarUrl
      coverUrl
      verified
      followersCount
      followingCount
      postsCount
      isFollowing
      followsMe
      lastSeenAt
      isOnline
      createdAt
    }
  }
`);

export const UserByUsernameQuery = graphql(`
  query UserByUsername($username: String!) {
    userByUsername(username: $username) {
      id
      email
      username
      displayName
      bio
      emoji
      avatarUrl
      coverUrl
      verified
      followersCount
      followingCount
      postsCount
      wallPrivacy
      canViewWall
      isFollowing
      followsMe
      lastSeenAt
      isOnline
      createdAt
    }
  }
`);

export const FollowUserMutation = graphql(`
  mutation FollowUser($userId: ID!) {
    followUser(userId: $userId)
  }
`);

export const UnfollowUserMutation = graphql(`
  mutation UnfollowUser($userId: ID!) {
    unfollowUser(userId: $userId)
  }
`);

export const RecommendedUsersQuery = graphql(`
  query RecommendedUsers($limit: Int) {
    recommendedUsers(limit: $limit) {
      userId
      username
      displayName
      emoji
      avatarUrl
      bio
      followersCount
      mutualFollowersCount
      score
      reason
    }
  }
`);

export const SearchUsersQuery = graphql(`
  query SearchUsers($query: String!, $limit: Int, $offset: Int) {
    searchUsers(query: $query, limit: $limit, offset: $offset) {
      id
      username
      displayName
      emoji
      avatarUrl
      bio
      followersCount
      isFollowing
    }
  }
`);

export const UpdateProfileMutation = graphql(`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      email
      username
      displayName
      bio
      emoji
      avatarUrl
      coverUrl
      verified
      followersCount
      followingCount
      postsCount
      wallPrivacy
      canViewWall
      isFollowing
      followsMe
      createdAt
    }
  }
`);

export const USER_FRAGMENT = UserFragment;
export const USER_QUERY = UserQuery;
export const USER_BY_USERNAME_QUERY = UserByUsernameQuery;
export const FOLLOW_USER_MUTATION = FollowUserMutation;
export const UNFOLLOW_USER_MUTATION = UnfollowUserMutation;
export const RECOMMENDED_USERS_QUERY = RecommendedUsersQuery;
export const SEARCH_USERS_QUERY = SearchUsersQuery;
export const UPDATE_PROFILE_MUTATION = UpdateProfileMutation;
