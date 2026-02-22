import { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { FOLLOW_USER_MUTATION, UNFOLLOW_USER_MUTATION } from '@shared/api/graphql/users';

export function useFollowUser(userId: string, initialIsFollowing: boolean) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);

  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  const [followUser, { loading: followLoading }] = useMutation(FOLLOW_USER_MUTATION, {
    variables: { userId },
  });

  const [unfollowUser, { loading: unfollowLoading }] = useMutation(UNFOLLOW_USER_MUTATION, {
    variables: { userId },
  });

  const toggle = useCallback(async () => {
    if (followLoading || unfollowLoading) return;

    const wasFollowing = isFollowing;

    setIsFollowing(!wasFollowing);

    try {
      if (wasFollowing) {
        await unfollowUser();
      } else {
        await followUser();
      }
    } catch {

      setIsFollowing(wasFollowing);
    }
  }, [isFollowing, followLoading, unfollowLoading, followUser, unfollowUser]);

  return {
    toggle,
    isFollowing,
    loading: followLoading || unfollowLoading,
  };
}
