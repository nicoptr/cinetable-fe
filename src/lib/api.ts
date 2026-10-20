import { PUBLIC_PATHS, safeNext } from "./nav";

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

/** Client: chiama il backend tramite il rewrite `/api/*`; la sessione viaggia nel cookie httpOnly. */
export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: init.method ?? "GET",
      credentials: "same-origin",
      headers: init.body === undefined ? undefined : { "content-type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError(FALLBACK, 0, "NETWORK");
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (res.ok) return data as T;

  // login sbagliato o sonda /auth/me su una pagina pubblica: il chiamante mostra l'errore
  if (res.status === 401 && !path.startsWith("/auth/") && !PUBLIC_PATHS.includes(location.pathname)) {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- ricarica piena: da fuori sessione si riparte da zero
    window.location.assign("/login?next=" + encodeURIComponent(safeNext(location.pathname + location.search)));
  }
  throw new ApiError(data?.message ?? FALLBACK, res.status, data?.code ?? String(res.status));
}
