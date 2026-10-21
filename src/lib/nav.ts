/** Pagine raggiungibili senza sessione (le stesse che il proxy lascia passare). */
export const PUBLIC_PATHS = ["/", "/login", "/signup", "/verify-email", "/forgot-password", "/reset-password", "/invite"];

const FALLBACK = "/cineforums";

/** Solo percorsi interni: tutto ciò che il parser URL risolve su un altro host (`//h`, backslash, tab…) torna al fallback. */
export function safeNext(raw: string | null | undefined): string {
  // solo percorsi semplici: un solo "/" iniziale, non seguito da "/" o backslash
  if (!raw || !/^\/(?![/\\])/.test(raw)) return FALLBACK;
  try {
    const url = new URL(raw, "http://x");
    // i dot-segment (`/.//h`, `/x/..//h`) si normalizzano in `//h`
    return url.origin === "http://x" && !url.pathname.startsWith("//") ? url.pathname + url.search + url.hash : FALLBACK;
  } catch {
    return FALLBACK;
  }
}
