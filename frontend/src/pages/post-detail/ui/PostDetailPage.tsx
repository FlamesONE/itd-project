import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { POST_QUERY } from '@shared/api/graphql/posts';
import { PostDetailedView } from '@widgets/post-view/ui/PostDetailedView';
import type { Post } from '@entities/post';

export function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();

  const { data: postData, loading: postLoading } = useQuery(POST_QUERY, {
    variables: { id: postId! },
    skip: !postId,
  });

  const post = postData?.post as Post | undefined;

  if (postLoading) {
    return <PostDetailSkeleton />;
  }

  if (!post) {
    return (
      <div className="min-h-screen">
        
        <header className="sticky top-0 z-10 bg-theme/80 backdrop-blur-md border-b border-theme">
          <div className="px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-bold text-theme">Пост</h1>
          </div>
        </header>

        <div className="p-4 flex items-center justify-center">
          <div className="card p-8">
            <h1 className="text-xl font-bold text-theme text-center">Пост не найден</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      
      <header className="sticky top-0 z-10 bg-theme/80 backdrop-blur-md border-b border-theme">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-theme">Пост</h1>
        </div>
      </header>

      <div className="p-4">
        <div className="card overflow-visible">
          <PostDetailedView
            post={post}
            hideHeader
          />
        </div>
      </div>
    </div>
  );
}

function PostDetailSkeleton() {
  return (
    <div className="min-h-screen">
      
      <header className="sticky top-0 z-10 bg-theme/80 backdrop-blur-md border-b border-theme">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-theme">Пост</h1>
        </div>
      </header>

      <div className="p-4">
        <div className="card overflow-hidden">
          <div className="animate-pulse p-4">
            <div className="flex gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-surface-hover" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-surface-hover rounded" />
                <div className="h-3 w-24 bg-surface-hover rounded" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-5 w-full bg-surface-hover rounded" />
              <div className="h-5 w-3/4 bg-surface-hover rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
