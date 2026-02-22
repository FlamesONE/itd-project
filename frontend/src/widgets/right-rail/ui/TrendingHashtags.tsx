import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@apollo/client/react';
import { TRENDING_HASHTAGS_QUERY } from '@/shared/api/graphql';
import type { Hashtag } from '@entities/user';

interface TrendingHashtagsData {
  trendingHashtags: Hashtag[];
}

function formatCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)} тыс. постов`;
  }
  return `${count} постов`;
}

export function TrendingHashtags() {
  const { data, loading, error } = useQuery<TrendingHashtagsData>(TRENDING_HASHTAGS_QUERY, {
    variables: { limit: 5, period: 'week' },
  });

  if (loading) {
    return (
      <div className="card overflow-hidden">
        <h2 className="text-lg font-bold p-4 border-b border-theme">
          Популярные хэштеги
        </h2>
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-start gap-3">
              <div className="w-5 h-4 bg-surface-hover rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-surface-hover rounded w-3/4" />
                <div className="h-3 bg-surface-hover rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card overflow-hidden">
        <h2 className="text-lg font-bold p-4 border-b border-theme">
          Популярные хэштеги
        </h2>
        <p className="p-4 text-muted">Не удалось загрузить хэштеги</p>
      </div>
    );
  }

  const hashtags = data?.trendingHashtags ?? [];

  if (hashtags.length === 0) {
    return (
      <div className="card overflow-hidden">
        <h2 className="text-lg font-bold p-4 border-b border-theme">
          Популярные хэштеги
        </h2>
        <p className="p-4 text-muted">Пока нет популярных хэштегов</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <h2 className="text-lg font-bold p-4 border-b border-theme">
        Популярные хэштеги
      </h2>
      <ul>
        {hashtags.map((hashtag, index) => (
          <motion.li
            key={hashtag.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <NavLink
              to={`/explore?hashtag=${encodeURIComponent(hashtag.name)}`}
              className="flex items-start gap-3 px-4 py-2.5 hover-highlight"
            >
              <span className="text-muted text-sm w-5 text-right font-medium">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-theme text-sm truncate">#{hashtag.name}</p>
                <p className="text-xs text-muted">{formatCount(hashtag.postsCount)}</p>
              </div>
            </NavLink>
          </motion.li>
        ))}
      </ul>
      <NavLink
        to="/explore"
        className="block px-4 py-3 text-sm text-brand-primary hover:bg-surface-hover transition-colors"
      >
        Показать больше
      </NavLink>
    </div>
  );
}
