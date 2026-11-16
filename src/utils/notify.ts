// In-page notifications (toasts). Replaces blocking alert() popups.
//
//   notify('Saved successfully')            -> kind is guessed from the wording
//   notify.error('Could not save')          -> explicit kind
//
// <Toaster /> (mounted once in main.tsx) renders whatever is in this store.

export type ToastKind = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<Listener>();
const MAX_VISIBLE = 4;

const emit = () => listeners.forEach((listener) => listener(toasts));

export function subscribeToToasts(listener: Listener): () => void {
  listeners.add(listener);
  listener(toasts);
  return () => {
    listeners.delete(listener);
  };
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

// alert() carried no type, so infer one from the message for the calls that were converted.
function guessKind(message: string): ToastKind {
  const text = message.toLowerCase();
  if (/(fail|error|invalid|unable|could not|couldn't|cannot|can't|denied|wrong|expired|not allowed|no permission|don't have permission)/.test(text)) {
    return 'error';
  }
  if (/(success|saved|updated|created|deleted|removed|copied|sent|added|completed|done)/.test(text)) {
    return 'success';
  }
  if (/(please|required|must|select|enter|missing|too large|warning)/.test(text)) {
    return 'warning';
  }
  return 'info';
}

function show(message: unknown, kind?: ToastKind, durationMs?: number): number {
  const text = message instanceof Error ? message.message : String(message ?? '');
  const resolvedKind = kind ?? guessKind(text);
  const id = nextId++;
  toasts = [...toasts, { id, kind: resolvedKind, message: text }].slice(-MAX_VISIBLE);
  emit();
  // Errors stay a little longer; longer messages get more reading time.
  const duration = durationMs ?? Math.min(10000, (resolvedKind === 'error' ? 6000 : 4000) + text.length * 30);
  if (duration > 0) window.setTimeout(() => dismissToast(id), duration);
  return id;
}

type Notify = {
  (message: unknown): number;
  success: (message: unknown, durationMs?: number) => number;
  error: (message: unknown, durationMs?: number) => number;
  info: (message: unknown, durationMs?: number) => number;
  warning: (message: unknown, durationMs?: number) => number;
};

export const notify: Notify = Object.assign((message: unknown) => show(message), {
  success: (message: unknown, durationMs?: number) => show(message, 'success', durationMs),
  error: (message: unknown, durationMs?: number) => show(message, 'error', durationMs),
  info: (message: unknown, durationMs?: number) => show(message, 'info', durationMs),
  warning: (message: unknown, durationMs?: number) => show(message, 'warning', durationMs),
});

export default notify;
