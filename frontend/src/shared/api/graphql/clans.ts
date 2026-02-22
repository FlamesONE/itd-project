import { graphql } from './graphql';

export const ClanStatsQuery = graphql(`
  query ClanStats($limit: Int) {
    clanStats(limit: $limit) {
      emoji
      membersCount
      percentage
    }
  }
`);

export const CLAN_STATS_QUERY = ClanStatsQuery;
