import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Media } from '@entities/post';
import { ImageLightbox } from '@shared/ui';

interface PostMediaProps {
  media: Media[];
  onImageClick?: () => void;
}

export function PostMedia({ media }: PostMediaProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handleImageLoad = useCallback((id: string) => {
    setLoadedImages(prev => new Set([...prev, id]));
  }, []);

  const handleImageClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    e.preventDefault();
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (media.length === 0) return null;

  return (
    <>
    <div
      className={`grid gap-0.5 rounded-2xl overflow-hidden ${getGridClass(media.length)}`}
    >
      {media.slice(0, 4).map((item, index) => {
        const isLoaded = loadedImages.has(item.id);

        return (
          <div
            key={item.id}
            className={`relative overflow-hidden bg-surface-hover cursor-pointer ${getItemClass(media.length, index)}`}
            onClick={(e) => handleImageClick(e, index)}
          >
            
            <AnimatePresence>
              {!isLoaded && (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-surface-hover animate-pulse"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer" />
                </motion.div>
              )}
            </AnimatePresence>

            
            <motion.img
              src={item.thumbnailUrl || item.url}
              alt=""
              className={`w-full h-full ${media.length === 1 ? 'object-contain' : 'object-cover'}`}
              loading="lazy"
              onLoad={() => handleImageLoad(item.id)}
              initial={{ opacity: 0 }}
              animate={{ opacity: isLoaded ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              style={{
                filter: isLoaded ? 'none' : 'blur(20px)',
                transform: isLoaded ? 'scale(1)' : 'scale(1.1)'
              }}
            />

            
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />

            
            {index === 3 && media.length > 4 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px]">
                <span className="text-white text-2xl font-semibold">+{media.length - 4}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
    <ImageLightbox
      images={media.map(m => ({ url: m.url, thumbnailUrl: m.thumbnailUrl }))}
      initialIndex={lightboxIndex}
      isOpen={lightboxOpen}
      onClose={() => setLightboxOpen(false)}
    />
    </>
  );
}

function getGridClass(count: number): string {
  switch (count) {
    case 1:
      return 'grid-cols-1';
    case 2:
      return 'grid-cols-2';
    case 3:
      return 'grid-cols-2 grid-rows-2';
    case 4:
    default:
      return 'grid-cols-2 grid-rows-2';
  }
}

function getItemClass(total: number, index: number): string {
  if (total === 1) {
    return 'max-h-[400px] bg-black/5 dark:bg-white/5';
  }
  if (total === 2) {
    return 'aspect-[4/5]';
  }
  if (total === 3) {
    if (index === 0) return 'row-span-2 aspect-auto h-full';
    return 'aspect-square';
  }
  return 'aspect-square';
}
