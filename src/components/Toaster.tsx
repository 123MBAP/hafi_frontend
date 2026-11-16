import { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { dismissToast, subscribeToToasts, type Toast, type ToastKind } from '../utils/notify';

const STYLES: Record<ToastKind, { icon: typeof Info; accent: string }> = {
  success: { icon: CheckCircle, accent: 'text-emerald-500 border-l-emerald-500' },
  error: { icon: AlertCircle, accent: 'text-[#E5252A] border-l-[#E5252A]' },
  warning: { icon: AlertTriangle, accent: 'text-amber-500 border-l-amber-500' },
  info: { icon: Info, accent: 'text-sky-500 border-l-sky-500' },
};

/** Renders notify() messages in the corner of the screen. Mounted once, in main.tsx. */
export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => subscribeToToasts(setToasts), []);

  return (
    <div
      className="fixed z-[10000] bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:w-96 flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const { icon: Icon, accent } = STYLES[toast.kind];
        return (
          <div
            key={toast.id}
            role={toast.kind === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border border-l-4 border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 shadow-lg ${accent}`}
          >
            <Icon className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="flex-1 text-sm font-medium text-[#151515] dark:text-white break-words whitespace-pre-line">
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss"
              className="shrink-0 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
