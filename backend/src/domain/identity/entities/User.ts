import { AggregateRoot } from "../../shared/AggregateRoot";
import { Result, DomainError } from "../../shared/Result";
import { UserId } from "../value-objects/UserId";
import { Email } from "../value-objects/Email";
import { Username } from "../value-objects/Username";
import { Password } from "../value-objects/Password";
import { UserRegistered } from "../events/UserRegistered";

export type WallPrivacy = 'public' | 'followers' | 'private';

export interface UserProps {
  email: Email;
  username: Username;
  password: Password;
  displayName: string;
  bio: string | null;
  emoji: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  verified: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  wallPrivacy: WallPrivacy;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends AggregateRoot<UserProps, UserId> {
  private constructor(id: UserId, props: UserProps) {
    super(id, props);
  }

  get email(): Email {
    return this.props.email;
  }

  get username(): Username {
    return this.props.username;
  }

  get password(): Password {
    return this.props.password;
  }

  get displayName(): string {
    return this.props.displayName;
  }

  get bio(): string | null {
    return this.props.bio;
  }

  get emoji(): string {
    return this.props.emoji;
  }

  get avatarUrl(): string | null {
    return this.props.avatarUrl;
  }

  get coverUrl(): string | null {
    return this.props.coverUrl;
  }

  get verified(): boolean {
    return this.props.verified;
  }

  get followersCount(): number {
    return this.props.followersCount;
  }

  get followingCount(): number {
    return this.props.followingCount;
  }

  get postsCount(): number {
    return this.props.postsCount;
  }

  get wallPrivacy(): WallPrivacy {
    return this.props.wallPrivacy;
  }

  get lastSeenAt(): Date {
    return this.props.lastSeenAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public static create(props: {
    email: Email;
    username: Username;
    password: Password;
    displayName?: string;
    emoji?: string;
  }): Result<User> {
    const userId = UserId.create().getValue();
    const now = new Date();

    const user = new User(userId, {
      email: props.email,
      username: props.username,
      password: props.password,
      displayName: props.displayName || props.username.value,
      bio: null,
      emoji: props.emoji || "😀",
      avatarUrl: null,
      coverUrl: null,
      verified: false,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      wallPrivacy: 'public',
      lastSeenAt: now,
      createdAt: now,
      updatedAt: now,
    });

    user.addDomainEvent(
      new UserRegistered(
        user.id.value,
        user.email.value,
        user.username.value
      )
    );

    return Result.ok(user);
  }

  public static reconstitute(props: {
    id: UserId;
    email: Email;
    username: Username;
    password: Password;
    displayName: string;
    bio: string | null;
    emoji: string;
    avatarUrl: string | null;
    coverUrl: string | null;
    verified: boolean;
    followersCount: number;
    followingCount: number;
    postsCount: number;
    wallPrivacy?: WallPrivacy;
    lastSeenAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User(props.id, {
      email: props.email,
      username: props.username,
      password: props.password,
      displayName: props.displayName,
      bio: props.bio,
      emoji: props.emoji,
      avatarUrl: props.avatarUrl,
      coverUrl: props.coverUrl,
      verified: props.verified,
      followersCount: props.followersCount,
      followingCount: props.followingCount,
      postsCount: props.postsCount,
      wallPrivacy: props.wallPrivacy ?? 'public',
      lastSeenAt: props.lastSeenAt ?? new Date(),
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  public updateLastSeen(): void {
    this.props.lastSeenAt = new Date();
  }

  public updatePassword(newPassword: Password): void {
    this.props.password = newPassword;
    this.props.updatedAt = new Date();
  }

  public updateEmail(newEmail: Email): void {
    this.props.email = newEmail;
    this.props.updatedAt = new Date();
  }

  public updateUsername(newUsername: Username): void {
    this.props.username = newUsername;
    this.props.updatedAt = new Date();
  }

  public updateProfile(data: {
    displayName?: string;
    bio?: string;
    emoji?: string;
    avatarUrl?: string;
    coverUrl?: string;
    wallPrivacy?: WallPrivacy;
  }): void {
    if (data.displayName !== undefined) {
      this.props.displayName = data.displayName;
    }
    if (data.bio !== undefined) {
      this.props.bio = data.bio;
    }
    if (data.emoji !== undefined) {
      this.props.emoji = data.emoji;
    }
    if (data.avatarUrl !== undefined) {
      this.props.avatarUrl = data.avatarUrl;
    }
    if (data.coverUrl !== undefined) {
      this.props.coverUrl = data.coverUrl;
    }
    if (data.wallPrivacy !== undefined) {
      this.props.wallPrivacy = data.wallPrivacy;
    }
    this.props.updatedAt = new Date();
  }
}
