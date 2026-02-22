export interface ClanStats {
  emoji: string;
  membersCount: number;
  percentage: number;
}

export interface IClanRepository {

  getClanStats(): Promise<ClanStats[]>;

  getTopClans(limit: number): Promise<ClanStats[]>;

  getClanByEmoji(emoji: string): Promise<ClanStats | null>;

  getTotalUsersCount(): Promise<number>;
}
