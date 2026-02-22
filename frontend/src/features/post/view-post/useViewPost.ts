import { useCallback, useRef } from 'react';
import { useMutation } from '@apollo/client/react';
import { VIEW_POST_MUTATION } from '@shared/api/graphql/posts';

function getFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
  }

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
  ].join('|');

  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(36);
}

let cachedFingerprint: string | null = null;
function getCachedFingerprint(): string {
  if (!cachedFingerprint) {
    cachedFingerprint = getFingerprint();
  }
  return cachedFingerprint;
}

export function useViewPost() {
  const [viewPostMutation] = useMutation(VIEW_POST_MUTATION);
  const viewedPosts = useRef<Set<string>>(new Set());

  const viewPost = useCallback(async (postId: string) => {

    if (viewedPosts.current.has(postId)) {
      return;
    }

    viewedPosts.current.add(postId);

    try {
      await viewPostMutation({
        variables: {
          postId,
          fingerprint: getCachedFingerprint(),
        },
      });
    } catch (error) {

      console.debug('Failed to track view:', error);
    }
  }, [viewPostMutation]);

  return { viewPost };
}
