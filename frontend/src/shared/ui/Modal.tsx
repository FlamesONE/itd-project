import { forwardRef, ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { X } from 'lucide-react';

const ease = [0.22, 1, 0.36, 1] as const;

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function Modal({ open, onOpenChange, children }: ModalProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease }}
                className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                onClick={handleBackdropClick}
              >
                <div
                  className="w-full max-w-2xl max-h-[85vh] overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {children}
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

interface ModalContentProps {
  children: ReactNode;
  className?: string;
}

export const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'bg-surface border border-theme rounded-2xl shadow-2xl overflow-hidden',
          className
        )}
      >
        {children}
      </div>
    );
  }
);
ModalContent.displayName = 'ModalContent';

interface ModalHeaderProps {
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function ModalHeader({ children, onClose, className }: ModalHeaderProps) {
  return (
    <div
      className={clsx(
        'flex items-center justify-between px-4 py-3 border-b border-theme',
        className
      )}
    >
      <DialogPrimitive.Title className="font-semibold text-theme">
        {children}
      </DialogPrimitive.Title>
      {onClose && (
        <DialogPrimitive.Close asChild>
          <button
            onClick={onClose}
            className="p-1.5 -m-1.5 rounded-full text-muted hover:text-theme hover:bg-surface-hover transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <div className={clsx('overflow-y-auto', className)}>
      {children}
    </div>
  );
}
