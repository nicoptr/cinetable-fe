"use client";

import { useSyncExternalStore } from "react";
import { dismiss, getServerToasts, getToasts, subscribe } from "@/lib/toast";

/** In basso al centro su mobile, in basso a destra da 768 px. Un tocco chiude l'avviso. */
export function Toaster() {
  const toasts = useSyncExternalStore(subscribe, getToasts, getServerToasts);
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Avvisi"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md md:right-6 md:left-auto md:mx-0 md:w-96 print:hidden"
    >
      <ul className="flex flex-col gap-2">
        {toasts.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="pointer-events-auto min-h-11 w-full rounded border border-l-2 border-line border-l-error bg-surface px-4 py-3 text-left text-base text-ink shadow-lg shadow-black/40"
            >
              {t.text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
