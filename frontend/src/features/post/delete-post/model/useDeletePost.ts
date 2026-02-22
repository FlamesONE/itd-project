import { useMutation } from '@apollo/client/react';
import { DELETE_POST_MUTATION } from '@shared/api/graphql/posts';
import { useNavigate } from 'react-router-dom';

export function useDeletePost() {
  const navigate = useNavigate();
  const [deletePost, { loading }] = useMutation(DELETE_POST_MUTATION);

  const handleDeletePost = async (postId: string, redirectAfter = false) => {
    try {
      await deletePost({
        variables: { id: postId },
        update: (cache) => {
          cache.evict({ id: cache.identify({ __typename: 'Post', id: postId }) });
          cache.evict({ fieldName: 'feed' });
          cache.evict({ fieldName: 'userPosts' });
          cache.evict({ fieldName: 'trending' });
          cache.gc();
        },
      });

      if (redirectAfter) {
        navigate(-1);
      }

      return true;
    } catch (error) {
      console.error('Failed to delete post:', error);
      return false;
    }
  };

  return {
    deletePost: handleDeletePost,
    loading,
  };
}
