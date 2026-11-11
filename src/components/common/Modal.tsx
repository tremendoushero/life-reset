import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  closeAriaLabel?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  closeAriaLabel = 'Close dialog',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso-900/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full ${maxWidths[maxWidth]} bg-cardwhite dark:bg-espresso-800 rounded-2xl border border-ivory-300 dark:border-espresso-700 shadow-soft-lg overflow-hidden animate-slide-up`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-ivory-200 dark:border-espresso-700">
          <div className="flex-1 min-w-0 pr-1">
            {title && (
              <h3 className="font-serif text-base sm:text-lg font-semibold text-espresso-900 dark:text-ivory-50 leading-snug break-words">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-espresso-500 dark:text-ivory-300 mt-1 leading-relaxed break-words">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 -mr-1.5 -mt-1 sm:mr-0 sm:mt-0 min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-xl text-espresso-500 hover:text-espresso-800 dark:text-ivory-300 dark:hover:text-ivory-50 hover:bg-ivory-200/80 dark:hover:bg-espresso-700 active:scale-95 transition-all touch-manipulation cursor-pointer"
            aria-label={closeAriaLabel}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

