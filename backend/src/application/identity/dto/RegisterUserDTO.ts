export interface RegisterUserInput {
  email: string;
  username: string;
  password: string;
  displayName?: string;
  emoji?: string;
}

export interface RegisterUserOutput {
  userId: string;
  email: string;
  username: string;
  displayName: string;
}
