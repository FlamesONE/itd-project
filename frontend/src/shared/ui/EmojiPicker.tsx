import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPickerReact, { Theme, EmojiStyle, Categories } from 'emoji-picker-react';
import clsx from 'clsx';

interface EmojiPickerProps {
  value?: string;
  onChange: (emoji: string) => void;
  className?: string;
}

export function EmojiPicker({ value, onChange, className }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleEmojiSelect = (emojiData: { emoji: string }) => {
    onChange(emojiData.emoji);
    setIsOpen(false);
  };

  return (
    <div ref={pickerRef} className={clsx('relative inline-block', className)}>
      
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={clsx(
          'w-20 h-20 rounded-2xl flex items-center justify-center text-5xl transition-all',
          'bg-surface border-2',
          isOpen ? 'border-brand-primary shadow-glow' : 'border-theme hover:border-muted'
        )}
      >
        {value || '😊'}
      </motion.button>

      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute z-[310] mt-3 left-1/2 -translate-x-1/2"
          >
            <div className="rounded-2xl overflow-hidden shadow-xl border border-theme">
              <EmojiPickerReact
                onEmojiClick={handleEmojiSelect}
                theme={Theme.DARK}
                emojiStyle={EmojiStyle.NATIVE}
                searchPlaceholder="Поиск эмодзи..."
                width={340}
                height={420}
                previewConfig={{ showPreview: false }}
                skinTonesDisabled
                lazyLoadEmojis
                categories={[
                  { category: Categories.SUGGESTED, name: 'Часто используемые' },
                  { category: Categories.SMILEYS_PEOPLE, name: 'Смайлы и люди' },
                  { category: Categories.ANIMALS_NATURE, name: 'Животные и природа' },
                  { category: Categories.FOOD_DRINK, name: 'Еда и напитки' },
                  { category: Categories.TRAVEL_PLACES, name: 'Путешествия' },
                  { category: Categories.ACTIVITIES, name: 'Активности' },
                  { category: Categories.OBJECTS, name: 'Объекты' },
                  { category: Categories.SYMBOLS, name: 'Символы' },
                  { category: Categories.FLAGS, name: 'Флаги' },
                ]}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface EmojiSelectorProps {
  value?: string;
  onChange: (emoji: string) => void;
  label?: string;
  hint?: string;
  className?: string;
}

export function EmojiSelector({ value, onChange, label, hint, className }: EmojiSelectorProps) {
  return (
    <div className={clsx('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-muted">
          {label}
        </label>
      )}
      <EmojiPicker value={value} onChange={onChange} />
      {hint && (
        <p className="text-xs text-muted leading-relaxed">
          {hint}
        </p>
      )}
    </div>
  );
}
