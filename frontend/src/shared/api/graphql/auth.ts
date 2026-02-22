import { graphql } from './graphql';

export const MeQuery = graphql(`
  query Me {
    me {
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
      createdAt
    }
  }
`);

export const LoginMutation = graphql(`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        username
        displayName
        emoji
        avatarUrl
        verified
      }
    }
  }
`);

export const RegisterMutation = graphql(`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        username
        displayName
        emoji
        avatarUrl
      }
    }
  }
`);

export const RefreshTokenMutation = graphql(`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken
      refreshToken
    }
  }
`);

export const ChangePasswordMutation = graphql(`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input)
  }
`);

export const UpdateEmailMutation = graphql(`
  mutation UpdateEmail($input: UpdateEmailInput!) {
    updateEmail(input: $input) {
      id
      email
      username
      displayName
    }
  }
`);

export const UpdateUsernameMutation = graphql(`
  mutation UpdateUsername($input: UpdateUsernameInput!) {
    updateUsername(input: $input) {
      id
      email
      username
      displayName
    }
  }
`);

export const ME_QUERY = MeQuery;
export const LOGIN_MUTATION = LoginMutation;
export const REGISTER_MUTATION = RegisterMutation;
export const REFRESH_TOKEN_MUTATION = RefreshTokenMutation;
export const CHANGE_PASSWORD_MUTATION = ChangePasswordMutation;
export const UPDATE_EMAIL_MUTATION = UpdateEmailMutation;
export const UPDATE_USERNAME_MUTATION = UpdateUsernameMutation;
