import { useMutation } from '@apollo/client/react';
import { PIN_POST_MUTATION, UNPIN_POST_MUTATION } from '@shared/api/graphql/posts';

export function usePinPost() {
  const [pinPost, { loading: pinning }] = useMutation(PIN_POST_MUTATION);
  const [unpinPost, { loading: unpinning }] = useMutation(UNPIN_POST_MUTATION);

  const handlePinPost = async (postId: string) => {
    try {
      await pinPost({
        variables: { postId },
        update: (cache) => {
          cache.evict({ fieldName: 'userPosts' });
          cache.gc();
        },
        refetchQueries: ['UserPosts'],
        awaitRefetchQueries: true,
      });
      return true;
    } catch (error) {
      console.error('Failed to pin post:', error);
      return false;
    }
  };

  const handleUnpinPost = async (postId: string) => {
    try {
      await unpinPost({
        variables: { postId },
        update: (cache) => {

          cache.evict({ fieldName: 'userPosts' });
          cache.gc();
        },
        refetchQueries: ['UserPosts'],
        awaitRefetchQueries: true,
      });
      return true;
    } catch (error) {
      console.error('Failed to unpin post:', error);
      return false;
    }
  };

  return {
    pinPost: handlePinPost,
    unpinPost: handleUnpinPost,
    loading: pinning || unpinning,
  };
}
