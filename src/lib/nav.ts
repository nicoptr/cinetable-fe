/** Pagine raggiungibili senza sessione (le stesse che il proxy lascia passare). */
export const PUBLIC_PATHS = ["/", "/login", "/signup", "/verify-email", "/forgot-password", "/reset-password", "/invite"];

const FALLBACK = "/cineforums";

/** Solo percorsi interni: tutto ciò che il parser URL risolve su un altro host (`//h`, backslash, tab…) torna al fallback. */
export function safeNext(raw: string | null | undefined): string {
  if (!raw) return FALLBACK;
  try {
    const url = new URL(raw, "http://x");
    return url.origin === "http://x" ? url.pathname + url.search + url.hash : FALLBACK;
  } catch {
    return FALLBACK;
  }
}
