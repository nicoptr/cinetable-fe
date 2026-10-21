/** Avvisi in basso (components/Toaster.tsx): uno store di modulo, al massimo 3, ognuno sparisce dopo 6 s. */
export type Toast = { id: number; text: string };

const MAX = 3;
const TTL_MS = 6000;
const EMPTY: Toast[] = [];
let toasts = EMPTY;
let lastId = 0;
const listeners = new Set<() => void>();

function set(next: Toast[]) {
  toasts = next;
  listeners.forEach((l) => l());
}

export function toast(text: string) {
  const id = ++lastId;
  set([...toasts, { id, text }].slice(-MAX));
  setTimeout(() => dismiss(id), TTL_MS);
}

export function dismiss(id: number) {
  set(toasts.filter((t) => t.id !== id));
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

export const getToasts = () => toasts;
export const getServerToasts = () => EMPTY;
