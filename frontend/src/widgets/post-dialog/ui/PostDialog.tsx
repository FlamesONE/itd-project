import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import { PostDetailedView } from '@widgets/post-view/ui/PostDetailedView';
import type { Post } from '@entities/post';

const ease = [0.22, 1, 0.36, 1] as const;

interface PostDialogProps {
  post: Post | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PostDialog({ post, open, onOpenChange }: PostDialogProps) {
  const [activePost, setActivePost] = useState<Post | null>(post);

  useEffect(() => {
    if (post) setActivePost(post);
  }, [post]);

  const displayPost = post || activePost;

  if (!displayPost) return null;

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
                onClick={(e) => e.target === e.currentTarget && onOpenChange(false)}
              >
                <div
                  className="w-full max-w-lg max-h-[85vh] card flex flex-col overflow-hidden shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <PostDetailedView
                    key={displayPost.id}
                    post={displayPost}
                    onClose={() => onOpenChange(false)}
                    onLinkClick={() => onOpenChange(false)}
                  />
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
