import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: 'default' | 'wide';
  children?: ReactNode;
}

export function Dialog({ open, onClose, title, description, size = 'default', children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="dialog-title"
      aria-describedby={description ? 'dialog-description' : undefined}
      className={`m-auto w-[calc(100%-2rem)] rounded-xl bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/50 ${
        size === 'wide' ? 'max-w-3xl' : 'max-w-md'
      }`}
    >
      {open && (
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="dialog-title" className="text-lg font-semibold">
                {title}
              </h2>
              {description && (
                <p id="dialog-description" className="mt-1 text-sm text-slate-600">
                  {description}
                </p>
              )}
            </div>
            <button onClick={onClose} aria-label="Close" className="-m-1 rounded p-1 text-slate-400 hover:text-slate-700">
              <X size={20} />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
