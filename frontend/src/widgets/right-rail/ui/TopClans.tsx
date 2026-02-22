import { motion } from 'framer-motion';
import { useQuery } from '@apollo/client/react';
import clsx from 'clsx';
import { CLAN_STATS_QUERY } from '@/shared/api/graphql';
import type { ClanStats } from '@entities/user';

interface ClanStatsData {
  clanStats: ClanStats[];
}

function formatCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return String(count);
}

export function TopClans() {
  const { data, loading, error } = useQuery<ClanStatsData>(CLAN_STATS_QUERY, {
    variables: { limit: 10 },
  });

  if (loading) {
    return (
      <div className="card overflow-hidden">
        <h2 className="text-lg font-bold p-4 border-b border-theme">
          Топ кланов
        </h2>
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse w-20 h-8 bg-surface-hover rounded-full"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card overflow-hidden">
        <h2 className="text-lg font-bold p-4 border-b border-theme">
          Топ кланов
        </h2>
        <p className="p-4 text-muted">Не удалось загрузить кланы</p>
      </div>
    );
  }

  const clans = data?.clanStats ?? [];

  if (clans.length === 0) {
    return (
      <div className="card overflow-hidden">
        <h2 className="text-lg font-bold p-4 border-b border-theme">
          Топ кланов
        </h2>
        <p className="p-4 text-muted">Пока нет кланов</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <h2 className="text-lg font-bold p-4 border-b border-theme">
        Топ кланов
      </h2>
      <div className="p-4">
        <div className="flex flex-wrap gap-2">
          {clans.map((clan, index) => (
            <motion.button
              key={clan.emoji}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-200',
                index < 3
                  ? 'bg-brand-primary/10 border-brand-primary text-theme'
                  : 'border-theme text-muted hover:bg-surface-hover hover:text-theme'
              )}
            >
              <span className="font-medium text-sm">{index + 1}</span>
              <span className="text-lg">{clan.emoji}</span>
              <span className="text-sm" title={`${clan.percentage}%`}>
                {formatCount(clan.membersCount)}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
