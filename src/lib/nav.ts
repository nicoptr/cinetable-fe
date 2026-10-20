/** Pagine raggiungibili senza sessione (le stesse che il proxy lascia passare). */
export const PUBLIC_PATHS = ["/", "/login", "/signup", "/verify-email", "/forgot-password", "/reset-password", "/invite"];

/** Solo percorsi interni: niente `//host` o `/\host` (open redirect). */
export function safeNext(raw: string | null | undefined): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\") ? raw : "/cineforums";
}
