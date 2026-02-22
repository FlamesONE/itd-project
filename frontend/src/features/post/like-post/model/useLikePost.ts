import { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { LIKE_POST_MUTATION, UNLIKE_POST_MUTATION } from '@shared/api/graphql/posts';

interface Post {
  id: string;
  isLiked: boolean;
  likesCount: number;
}

export function useLikePost(postOrId: Post | string, initialIsLiked?: boolean) {
  const isPostObject = typeof postOrId === 'object';
  const postId = isPostObject ? postOrId.id : postOrId;
  const propIsLiked = isPostObject ? postOrId.isLiked : (initialIsLiked ?? false);
  const propLikesCount = isPostObject ? postOrId.likesCount : 0;

  const [isLiked, setIsLiked] = useState(propIsLiked);
  const [likesCount, setLikesCount] = useState(propLikesCount);

  useEffect(() => {
    setIsLiked(propIsLiked);
    setLikesCount(propLikesCount);
  }, [propIsLiked, propLikesCount]);

  const [likePost, { loading: likeLoading }] = useMutation(LIKE_POST_MUTATION, {
    variables: { postId },
  });

  const [unlikePost, { loading: unlikeLoading }] = useMutation(UNLIKE_POST_MUTATION, {
    variables: { postId },
  });

  const toggle = useCallback(async () => {
    if (likeLoading || unlikeLoading) return;

    const wasLiked = isLiked;
    const prevCount = likesCount;

    setIsLiked(!wasLiked);
    setLikesCount(wasLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      if (wasLiked) {
        await unlikePost();
      } else {
        await likePost();
      }
    } catch {

      setIsLiked(wasLiked);
      setLikesCount(prevCount);
    }
  }, [isLiked, likesCount, likeLoading, unlikeLoading, likePost, unlikePost]);

  return {
    toggle,
    toggleLike: toggle,
    isLiked,
    likesCount,
    loading: likeLoading || unlikeLoading,
  };
}
