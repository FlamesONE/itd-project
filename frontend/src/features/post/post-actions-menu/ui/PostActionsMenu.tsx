import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { FlagIcon, LinkIcon, Pin, PinOff, Trash2 } from 'lucide-react';
import { ReportModal } from '@features/report';
import { usePinPost } from '@features/post/pin-post';
import { useDeletePost } from '@features/post/delete-post';
import clsx from 'clsx';

const ease = [0.22, 1, 0.36, 1] as const;

interface PostActionsMenuProps {
  trigger: React.ReactNode;
  postId: string;
  authorId?: string;
  authorName?: string;
  currentUserId?: string;
  isPinned?: boolean;
  isOwnPost?: boolean;
  wallOwnerId?: string;
}

export function PostActionsMenu({
  trigger,
  postId,
  authorName,
  isPinned = false,
  isOwnPost = false,
  currentUserId,
  authorId,
  wallOwnerId,
}: PostActionsMenuProps) {
  const [reportOpen, setReportOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { pinPost, unpinPost, loading } = usePinPost();
  const { deletePost, loading: deleteLoading } = useDeletePost();

  const canPin = isOwnPost || (currentUserId && wallOwnerId && currentUserId === wallOwnerId) ||
                 (currentUserId && !wallOwnerId && currentUserId === authorId);

  const isWallOwner = currentUserId && wallOwnerId && currentUserId === wallOwnerId;
  const canDelete = isOwnPost || isWallOwner;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(url);
    setIsOpen(false);
  };

  const handleReport = () => {
    setIsOpen(false);
    setReportOpen(true);
  };

  const handleTogglePin = async () => {
    setIsOpen(false);
    if (isPinned) {
      await unpinPost(postId);
    } else {
      await pinPost(postId);
    }
  };

  const handleDelete = () => {
    setIsOpen(false);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    await deletePost(postId);
    setDeleteConfirmOpen(false);
  };

  return (
    <>
      <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenu.Trigger asChild>
          {trigger}
        </DropdownMenu.Trigger>

        <AnimatePresence>
          {isOpen && (
            <>
              <DropdownMenu.Portal forceMount>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-transparent"
                  style={{ zIndex: 9998 }}
                  onClick={() => setIsOpen(false)}
                />
              </DropdownMenu.Portal>
              <DropdownMenu.Portal forceMount>
                <DropdownMenu.Content
                  asChild
                  sideOffset={8}
                  align="end"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.2, ease }}
                    className="w-52 bg-surface border border-theme rounded-2xl shadow-xl overflow-hidden"
                    style={{ zIndex: 9999, position: 'relative' }}
                  >
                    <div className="py-1">
                      {canPin && (
                        <DropdownMenuItem onClick={handleTogglePin} disabled={loading}>
                          {isPinned ? (
                            <>
                              <PinOff className="w-4 h-4 text-muted" />
                              <span>Открепить</span>
                            </>
                          ) : (
                            <>
                              <Pin className="w-4 h-4 text-muted" />
                              <span>Закрепить</span>
                            </>
                          )}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={handleCopyLink}>
                        <LinkIcon className="w-4 h-4 text-muted" />
                        <span>Копировать ссылку</span>
                      </DropdownMenuItem>
                      {canDelete && (
                        <DropdownMenuItem onClick={handleDelete} className="text-brand-danger" disabled={deleteLoading}>
                          <Trash2 className="w-4 h-4" />
                          <span>Удалить</span>
                        </DropdownMenuItem>
                      )}
                      {!canDelete && (
                        <DropdownMenuItem onClick={handleReport} className="text-brand-danger">
                          <FlagIcon className="w-4 h-4" />
                          <span>Пожаловаться</span>
                        </DropdownMenuItem>
                      )}
                    </div>
                  </motion.div>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </>
          )}
        </AnimatePresence>
      </DropdownMenu.Root>

      <ReportModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        type="post"
        targetId={postId}
        targetName={authorName}
      />

      
      <AnimatePresence>
        {deleteConfirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
            onClick={() => setDeleteConfirmOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease }}
              className="bg-surface border border-theme rounded-2xl p-6 max-w-sm mx-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-theme mb-2">Удалить пост?</h3>
              <p className="text-muted text-sm mb-6">
                Это действие нельзя отменить. Пост будет удален навсегда.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="flex-1 px-4 py-2 rounded-full border border-theme text-theme hover:bg-surface-hover transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleteLoading ? 'Удаление...' : 'Удалить'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

function DropdownMenuItem({ children, onClick, className, disabled }: DropdownMenuItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      onClick?.();
    }
  };

  return (
    <DropdownMenu.Item
      className={clsx(
        'w-full px-4 py-2.5 text-left hover:bg-surface-hover transition-colors flex items-center gap-3 text-sm text-theme cursor-pointer outline-none',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </DropdownMenu.Item>
  );
}
