import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@apollo/client/react';
import { Avatar, VerifiedBadge } from '@shared/ui';
import { REPOST_MUTATION } from '@shared/api/graphql/posts';
import { useAuth } from '@app/providers/AuthProvider';
import { formatTimeAgo } from '@shared/lib';
import type { Post } from '@entities/post';
import { X, Globe } from 'lucide-react';

const ease = [0.22, 1, 0.36, 1] as const;

interface RepostModalProps {
  post: Post | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RepostModal({ post, open, onOpenChange, onSuccess }: RepostModalProps) {
  const { user } = useAuth();
  const [quoteContent, setQuoteContent] = useState('');

  const [repost, { loading }] = useMutation(REPOST_MUTATION, {
    onCompleted: () => {
      setQuoteContent('');
      onOpenChange(false);
      onSuccess?.();
    },
  });

  const handleSubmit = async () => {
    if (!post) return;

    await repost({
      variables: {
        postId: post.id,
        quoteContent: quoteContent.trim() || null,
      },
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => setQuoteContent(''), 200);
  };

  if (!post) return null;

  const hasMedia = post.media && post.media.length > 0;
  const maxChars = 280;
  const charCount = quoteContent.length;
  const isOverLimit = charCount > maxChars;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2, ease }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                onClick={(e) => e.target === e.currentTarget && handleClose()}
              >
                <div
                  className="w-full max-w-lg card overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  
                  <div className="flex items-center justify-between p-4 border-b border-theme">
                    <button
                      onClick={handleClose}
                      className="p-1.5 -m-1.5 rounded-full text-muted hover:text-theme hover:bg-surface-hover transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <Dialog.Title className="font-semibold text-theme">
                      Репост
                    </Dialog.Title>
                    <div className="w-8" />
                  </div>

                  
                  <div className="p-4">
                    <div className="flex gap-3">
                      <Avatar
                        emoji={user?.emoji}
                        src={user?.avatarUrl}
                        alt={user?.displayName || 'User'}
                        size="sm"
                      />
                      <div className="flex-1">
                        <textarea
                          value={quoteContent}
                          onChange={(e) => setQuoteContent(e.target.value)}
                          placeholder="Добавить комментарий..."
                          rows={2}
                          className="w-full bg-transparent text-theme placeholder:text-muted resize-none focus:outline-none text-sm leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>

                  
                  <div className="mx-4 mb-4 border border-theme rounded-2xl overflow-hidden">
                    
                    <div className="flex items-center gap-2 p-3">
                      <Avatar
                        emoji={post.author.emoji}
                        src={post.author.avatarUrl}
                        alt={post.author.displayName}
                        size="xs"
                      />
                      <div className="flex-1 min-w-0 flex items-center gap-1.5">
                        <span className="font-semibold text-theme text-sm truncate">
                          {post.author.displayName}
                        </span>
                        {post.author.verified && (
                          <VerifiedBadge className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
                        )}
                        <span className="text-muted text-xs">@{post.author.username}</span>
                        <span className="text-muted text-xs">·</span>
                        <span className="text-muted text-xs">
                          {formatTimeAgo(post.createdAt)}
                        </span>
                      </div>
                    </div>

                    
                    {post.content && (
                      <div className="px-3 pb-3">
                        <p className="text-theme text-sm line-clamp-3">
                          {post.content}
                        </p>
                      </div>
                    )}

                    
                    {hasMedia && (
                      <div className="relative">
                        <img
                          src={post.media[0].thumbnailUrl || post.media[0].url}
                          alt=""
                          className="w-full max-h-48 object-cover"
                        />
                        {post.media.length > 1 && (
                          <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded-full">
                            +{post.media.length - 1}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  
                  <div className="flex items-center justify-between p-4 border-t border-theme">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-brand-primary" />
                      <span className="text-xs text-brand-primary">Все могут ответить</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {quoteContent && (
                        <span className={`text-sm ${isOverLimit ? 'text-brand-danger' : 'text-muted'}`}>
                          {charCount}/{maxChars}
                        </span>
                      )}
                      <button
                        onClick={handleSubmit}
                        disabled={loading || isOverLimit}
                        className="px-5 py-2 bg-brand-primary text-white text-sm font-semibold rounded-full hover:bg-brand-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Публикация...' : 'Репост'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
