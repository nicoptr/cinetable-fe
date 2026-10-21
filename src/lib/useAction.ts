import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApiError } from "@/lib/api";

/** Esegue una mutazione: errore del backend così com'è, poi refresh dei dati del server. */
export function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** true se è andata a buon fine (anche con 204 e corpo vuoto). */
  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      router.refresh();
      return true;
    } catch (err) {
      const { status, message } = err as ApiError;
      setError(message);
      // 4xx (es. 409 voto già inviato o voto chiuso): il form è vecchio, la vista del server no
      if (status >= 400 && status < 500 && status !== 429) router.refresh();
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, setError, run };
}
