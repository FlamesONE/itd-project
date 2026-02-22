import { useState, useRef, useCallback, useEffect } from 'react';
import { useMutation } from '@apollo/client/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@app/providers/AuthProvider';
import { CREATE_POST_MUTATION, FEED_QUERY, TRENDING_QUERY, USER_POSTS_QUERY } from '@shared/api/graphql/posts';
import { uploadMedia, type UploadedMedia } from '@shared/api/upload';
import { Avatar, Button, CloseIcon, ImageIcon, PollIcon } from '@shared/ui';
import { Video, File } from 'lucide-react';

interface PostComposerProps {
  placeholder?: string;
  targetUserId?: string;
  onSuccess?: () => void;
}

const springTransition = { type: 'spring' as const, stiffness: 300, damping: 30 };
const smoothTransition = { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };
const getSpringWithDelay = (delay: number) => ({ type: 'spring' as const, stiffness: 300, damping: 30, delay });
const getSmoothWithDelay = (delay: number) => ({ duration: 0.3, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] });
const MAX_IMAGES = 4;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export function PostComposer({
  placeholder = 'Что нового?',
  targetUserId,
  onSuccess,
}: PostComposerProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [images, setImages] = useState<UploadedMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [createPost, { loading }] = useMutation(CREATE_POST_MUTATION, {
    onError(error) {
      console.error('Failed to create post:', error);
      alert('Ошибка при создании поста: ' + error.message);
    },
    update(cache, { data }) {
      if (!data?.createPost) return;

      const newPost = data.createPost;

      try {
        const feedData = cache.readQuery({
          query: FEED_QUERY,
          variables: { limit: 20, offset: 0 },
        }) as { feed: any[] } | null;

        if (feedData) {
          cache.writeQuery({
            query: FEED_QUERY,
            variables: { limit: 20, offset: 0 },
            data: {
              feed: [newPost, ...feedData.feed],
            },
          });
        }
      } catch {
      }

      try {
        const trendingData = cache.readQuery({
          query: TRENDING_QUERY,
          variables: { limit: 20, offset: 0 },
        }) as { trending: any[] } | null;

        if (trendingData) {
          cache.writeQuery({
            query: TRENDING_QUERY,
            variables: { limit: 20, offset: 0 },
            data: {
              trending: [newPost, ...trendingData.trending],
            },
          });
        }
      } catch {
      }

      const wallUserId = targetUserId || user?.id;
      if (wallUserId) {
        try {
          const userPostsData = cache.readQuery({
            query: USER_POSTS_QUERY,
            variables: { userId: wallUserId, limit: 20, offset: 0 },
          }) as { userPosts: any[] } | null;

          if (userPostsData) {
            cache.writeQuery({
              query: USER_POSTS_QUERY,
              variables: { userId: wallUserId, limit: 20, offset: 0 },
              data: {
                userPosts: [newPost, ...userPostsData.userPosts],
              },
            });
          }
        } catch {
        }
      }
    },
    onCompleted: () => {
      setContent('');
      setImages([]);
      setIsFocused(false);
      setUploadError(null);
      onSuccess?.();
    },
  });

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUploadError('Необходимо войти в аккаунт');
      return;
    }

    const remainingSlots = MAX_IMAGES - images.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    const invalidFiles = filesToUpload.filter(f => !ALLOWED_TYPES.includes(f.type));
    if (invalidFiles.length > 0) {
      setUploadError('Поддерживаются только изображения (JPEG, PNG, GIF, WebP)');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const uploadedImages: UploadedMedia[] = [];

      for (const file of filesToUpload) {
        try {
          const result = await uploadMedia(file, token);
          uploadedImages.push(result);
        } catch (err) {
          console.error('Failed to upload file:', file.name, err);
        }
      }

      if (uploadedImages.length > 0) {
        setImages(prev => [...prev, ...uploadedImages]);
      } else if (filesToUpload.length > 0) {
        setUploadError('Не удалось загрузить изображения');
      }
    } catch (err) {
      setUploadError('Ошибка при загрузке');
    } finally {
      setUploading(false);
    }
  }, [images.length]);

  const handleRemoveImage = useCallback((imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  }, []);

  const handleSubmit = async () => {
    if ((!content.trim() && images.length === 0) || loading) return;

    await createPost({
      variables: {
        content: content.trim(),
        mediaIds: images.map(img => img.id),
        targetUserId,
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';

    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${newHeight}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [content, adjustTextareaHeight]);

  useEffect(() => {
    if (!isFocused && !content && images.length === 0) {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
      }
    }
  }, [isFocused, content, images.length]);

  const charCount = content.length;
  const maxChars = 280;
  const isOverLimit = charCount > maxChars;
  const canAddMoreImages = images.length < MAX_IMAGES;

  return (
    <motion.div
      layout
      transition={smoothTransition}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />

      
      <motion.div
        className="px-4 py-3"
        layout
        transition={smoothTransition}
      >
        <div className="flex gap-3">
          <Avatar
            emoji={user?.emoji}
            src={user?.avatarUrl}
            alt={user?.displayName || 'User'}
            size="sm"
          />

          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              placeholder={placeholder}
              rows={1}
              className="w-full bg-transparent text-theme placeholder:text-muted resize-none focus:outline-none text-sm leading-relaxed"
              style={{
                transition: 'height 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                minHeight: '24px',
                overflow: 'hidden'
              }}
            />

            
            <AnimatePresence mode="wait">
              {images.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scaleY: 0, originY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  exit={{ opacity: 0, scaleY: 0 }}
                  transition={smoothTransition}
                  className="mt-2"
                >
                  <div className={`grid gap-2 ${images.length === 1 ? 'grid-cols-1' :
                      images.length === 2 ? 'grid-cols-2' :
                        images.length === 3 ? 'grid-cols-2' :
                          'grid-cols-2'
                    }`}>
                    {images.map((image, index) => (
                      <motion.div
                        key={image.id}
                        initial={{ opacity: 0, scale: 0.8, rotateZ: -5 }}
                        animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
                        exit={{ opacity: 0, scale: 0.8, rotateZ: 5 }}
                        transition={getSpringWithDelay(index * 0.08)}
                        className={`relative rounded-xl overflow-hidden bg-theme/10 ${images.length === 3 && index === 0 ? 'row-span-2' : ''
                          }`}
                        style={{ aspectRatio: images.length === 1 ? '16/9' : '1' }}
                      >
                        <motion.img
                          src={image.url}
                          alt=""
                          className="w-full h-full object-cover"
                          initial={{ scale: 1.1 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        />
                        <motion.button
                          type="button"
                          onClick={() => handleRemoveImage(image.id)}
                          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-black/60 text-white rounded-full"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.15, backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
                          whileTap={{ scale: 0.9 }}
                          transition={springTransition}
                        >
                          <CloseIcon className="w-4 h-4" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            
            <AnimatePresence mode="wait">
              {uploadError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={springTransition}
                  className="mt-2 text-sm text-brand-danger"
                >
                  {uploadError}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      
      <AnimatePresence mode="wait">
        {(isFocused || content || images.length > 0) && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0, originY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            transition={smoothTransition}
            className="overflow-hidden border-t border-theme"
          >
            <motion.div
              className="flex items-center justify-between px-4 py-2.5"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={getSmoothWithDelay(0.1)}
            >
              
              <div className="flex items-center gap-1">
                {[
                  { icon: <ImageIcon className="w-4 h-4" />, title: 'Фото', onClick: handleImageButtonClick, disabled: !canAddMoreImages || uploading, loading: uploading },
                  { icon: <VideoIcon />, title: 'Видео', disabled: true },
                  { icon: <FileIcon />, title: 'Документ', disabled: true },
                  { icon: <PollIcon className="w-4 h-4" />, title: 'Опрос', disabled: true },
                ].map((btn, index) => (
                  <motion.div
                    key={btn.title}
                    initial={{ opacity: 0, scale: 0.8, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: -10 }}
                    transition={getSpringWithDelay(index * 0.05)}
                  >
                    <AttachButton {...btn} />
                  </motion.div>
                ))}
              </div>

              
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={getSpringWithDelay(0.15)}
              >
                <AnimatePresence mode="wait">
                  {content && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={springTransition}
                      className={`text-sm ${isOverLimit ? 'text-brand-danger' : 'text-muted'}`}
                    >
                      {charCount}/{maxChars}
                    </motion.span>
                  )}
                </AnimatePresence>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={getSpringWithDelay(0.2)}
                >
                  <Button
                    onClick={handleSubmit}
                    disabled={(!content.trim() && images.length === 0) || loading || isOverLimit || uploading}
                    isLoading={loading}
                    size="sm"
                  >
                    Опубликовать
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface AttachButtonProps {
  icon: React.ReactNode;
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

function AttachButton({ icon, title, onClick, disabled, loading }: AttachButtonProps) {
  return (
    <motion.button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded-lg ${disabled
          ? 'text-muted/40 cursor-not-allowed'
          : 'text-muted'
        } ${loading ? 'animate-pulse' : ''}`}
      whileHover={disabled ? {} : {
        scale: 1.1,
        color: 'var(--brand-primary)',
        backgroundColor: 'rgba(var(--brand-primary-rgb), 0.1)',
      }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      transition={springTransition}
    >
      {icon}
    </motion.button>
  );
}

function VideoIcon() {
  return <Video className="w-4 h-4" />;
}

function FileIcon() {
  return <File className="w-4 h-4" />;
}
