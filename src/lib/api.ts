import { PUBLIC_PATHS, safeNext } from "./nav";
import { toast } from "./toast";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const FALLBACK = "Errore imprevisto, riprova";
const DOWN = "Servizio non disponibile, riprova tra poco";

/** Testo per l'utente: 429, 5xx e rete diventano "servizio non disponibile", gli altri errori il messaggio del backend. */
export function errorText(err: unknown) {
  if (!(err instanceof ApiError) || err.status === 0 || err.status === 429 || err.status >= 500) return DOWN;
  return err.message;
}

function fail(err: ApiError, quiet: boolean): never {
  if (!quiet) toast(errorText(err));
  throw err;
}

/**
 * Client: chiama il backend tramite il rewrite `/api/*`; la sessione viaggia nel cookie httpOnly.
 * Ogni errore compare in un avviso (Toaster), tranne con `quiet` (il chiamante lo mostra già nella pagina) e il 401 che porta al login.
 */
export async function api<T>(path: string, init: { method?: string; body?: unknown; quiet?: boolean } = {}): Promise<T> {
  const quiet = init.quiet ?? false;
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: init.method ?? "GET",
      credentials: "same-origin",
      headers: init.body === undefined ? undefined : { "content-type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    fail(new ApiError(FALLBACK, 0, "NETWORK"), quiet);
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (res.ok) return data as T;

  const err = new ApiError(data?.message ?? FALLBACK, res.status, data?.code ?? String(res.status));
  // login sbagliato o sonda /auth/me su una pagina pubblica: il chiamante mostra l'errore
  if (res.status === 401 && !path.startsWith("/auth/") && !PUBLIC_PATHS.includes(location.pathname)) {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- ricarica piena: da fuori sessione si riparte da zero
    window.location.assign("/login?next=" + encodeURIComponent(safeNext(location.pathname + location.search)));
    throw err;
  }
  fail(err, quiet);
}
