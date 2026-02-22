import { useState } from 'react';
import { Tabs } from '@shared/ui';
import { PostComposer } from '@widgets/post-composer';
import { FeedList } from '@widgets/feed-list';

type FeedTab = 'popular' | 'following';

export function FeedPage() {
  const [activeTab, setActiveTab] = useState<FeedTab>('popular');

  const tabs = [
    {
      id: 'popular',
      label: 'Популярное',
      content: <FeedList type="trending" />,
    },
    {
      id: 'following',
      label: 'Подписки',
      content: <FeedList type="feed" />,
    },
  ];

  return (
    <div>
      
      <div className="m-4 mb-0">
        <div className="card">
          <PostComposer placeholder="Что нового?" />
        </div>
      </div>

      
      <div className="m-4">
        <div className="card overflow-visible">
          <Tabs
            tabs={tabs}
            defaultTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId as FeedTab)}
            sticky
          />
        </div>
      </div>
    </div>
  );
}
