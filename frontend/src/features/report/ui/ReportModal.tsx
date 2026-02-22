import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';

const ease = [0.22, 1, 0.36, 1] as const;

type ReportType = 'post' | 'user' | 'comment';

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ReportType;
  targetId: string;
  targetName?: string;
}

const REPORT_REASONS = [
  { id: 'spam', label: 'Спам' },
  { id: 'harassment', label: 'Оскорбление или травля' },
  { id: 'violence', label: 'Насилие или опасный контент' },
  { id: 'hate', label: 'Разжигание ненависти' },
  { id: 'nudity', label: 'Откровенный контент' },
  { id: 'fake', label: 'Ложная информация' },
  { id: 'impersonation', label: 'Выдача себя за другого' },
  { id: 'other', label: 'Другое' },
];

export function ReportModal({ open, onOpenChange, type, targetId: _targetId, targetName }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));
    setLoading(false);
    setSubmitted(true);
  };

  const handleClose = () => {
    onOpenChange(false);

    setTimeout(() => {
      setSelectedReason(null);
      setAdditionalInfo('');
      setSubmitted(false);
    }, 200);
  };

  const getTitle = () => {
    switch (type) {
      case 'post': return 'Пожаловаться на пост';
      case 'user': return `Пожаловаться на пользователя`;
      case 'comment': return 'Пожаловаться на комментарий';
      default: return 'Отправить жалобу';
    }
  };

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
                  className="w-full max-w-md card overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {submitted ? (
                    <div className="p-6 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-green-500/10 rounded-full flex items-center justify-center">
                        <Check className="w-8 h-8 text-green-500" />
                      </div>
                      <h2 className="text-lg font-semibold text-theme mb-2">Жалоба отправлена</h2>
                      <p className="text-sm text-muted mb-6">
                        Спасибо за сообщение. Мы рассмотрим вашу жалобу в ближайшее время.
                      </p>
                      <button
                        onClick={handleClose}
                        className="px-6 py-2 bg-brand-primary text-white rounded-full font-medium hover:bg-brand-primary-hover transition-colors"
                      >
                        Закрыть
                      </button>
                    </div>
                  ) : (
                    <>
                      
                      <div className="flex items-center justify-between p-4 border-b border-theme">
                        <Dialog.Title className="text-lg font-semibold text-theme">
                          {getTitle()}
                        </Dialog.Title>
                        <button
                          onClick={handleClose}
                          className="p-1.5 -m-1.5 rounded-full text-muted hover:text-theme hover:bg-surface-hover transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      
                      <div className="p-4">
                        {targetName && (
                          <p className="text-sm text-muted mb-4">
                            Жалоба на: <span className="text-theme font-medium">{targetName}</span>
                          </p>
                        )}

                        <p className="text-sm text-theme mb-3">Выберите причину жалобы:</p>

                        <div className="space-y-2 mb-4">
                          {REPORT_REASONS.map((reason) => (
                            <label
                              key={reason.id}
                              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                                selectedReason === reason.id
                                  ? 'bg-brand-primary/10 border border-brand-primary'
                                  : 'bg-surface-hover hover:bg-surface-hover/70 border border-transparent'
                              }`}
                            >
                              <input
                                type="radio"
                                name="reason"
                                value={reason.id}
                                checked={selectedReason === reason.id}
                                onChange={() => setSelectedReason(reason.id)}
                                className="sr-only"
                              />
                              <div
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                  selectedReason === reason.id
                                    ? 'border-brand-primary'
                                    : 'border-muted'
                                }`}
                              >
                                {selectedReason === reason.id && (
                                  <div className="w-2 h-2 rounded-full bg-brand-primary" />
                                )}
                              </div>
                              <span className="text-sm text-theme">{reason.label}</span>
                            </label>
                          ))}
                        </div>

                        {selectedReason === 'other' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-4"
                          >
                            <textarea
                              value={additionalInfo}
                              onChange={(e) => setAdditionalInfo(e.target.value)}
                              placeholder="Опишите проблему..."
                              rows={3}
                              className="w-full p-3 rounded-xl bg-surface-hover text-theme text-sm placeholder:text-muted resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                            />
                          </motion.div>
                        )}
                      </div>

                      
                      <div className="flex justify-end gap-3 p-4 border-t border-theme">
                        <button
                          onClick={handleClose}
                          className="px-4 py-2 text-sm font-medium text-muted hover:text-theme transition-colors"
                        >
                          Отмена
                        </button>
                        <button
                          onClick={handleSubmit}
                          disabled={!selectedReason || loading}
                          className="px-6 py-2 bg-brand-danger text-white text-sm font-medium rounded-full hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Отправка...' : 'Отправить жалобу'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
