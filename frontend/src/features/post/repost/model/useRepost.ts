import { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { REPOST_MUTATION, UNREPOST_MUTATION } from '@shared/api/graphql/posts';

interface Post {
  id: string;
  isReposted: boolean;
  repostsCount: number;
}

export function useRepost(postOrId: Post | string, initialIsReposted?: boolean) {
  const isPostObject = typeof postOrId === 'object';
  const postId = isPostObject ? postOrId.id : postOrId;
  const propIsReposted = isPostObject ? postOrId.isReposted : (initialIsReposted ?? false);
  const propRepostsCount = isPostObject ? postOrId.repostsCount : 0;

  const [isReposted, setIsReposted] = useState(propIsReposted);
  const [repostsCount, setRepostsCount] = useState(propRepostsCount);

  useEffect(() => {
    setIsReposted(propIsReposted);
    setRepostsCount(propRepostsCount);
  }, [propIsReposted, propRepostsCount]);

  const [repost, { loading: repostLoading }] = useMutation(REPOST_MUTATION, {
    variables: { postId },
  });

  const [unrepost, { loading: unrepostLoading }] = useMutation(UNREPOST_MUTATION, {
    variables: { postId },
  });

  const toggle = useCallback(async () => {
    if (repostLoading || unrepostLoading) return;

    const wasReposted = isReposted;
    const prevCount = repostsCount;

    setIsReposted(!wasReposted);
    setRepostsCount(wasReposted ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      if (wasReposted) {
        await unrepost();
      } else {
        await repost();
      }
    } catch {

      setIsReposted(wasReposted);
      setRepostsCount(prevCount);
    }
  }, [isReposted, repostsCount, repostLoading, unrepostLoading, repost, unrepost]);

  return {
    toggle,
    toggleRepost: toggle,
    isReposted,
    repostsCount,
    loading: repostLoading || unrepostLoading,
  };
}
