import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { safeNext } from "./nav";

export const BACKEND = process.env.BACKEND_URL ?? "http://localhost:5000";

/** Il segreto che il backend esige quando è dietro Vercel. Solo lato server: mai una variabile `NEXT_PUBLIC_`. */
export const originHeaders = (): Record<string, string> =>
  process.env.ORIGIN_SECRET ? { "x-origin-secret": process.env.ORIGIN_SECRET } : {};

/** Server: chiama il backend inoltrando il cookie della richiesta, mai in cache. */
export async function apiServer<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND}/sub/api${path}`, {
    headers: { cookie: (await cookies()).toString(), ...originHeaders() },
    cache: "no-store",
  });
  if (res.status === 401) {
    redirect("/login?next=" + encodeURIComponent(safeNext((await headers()).get("x-pathname"))));
  }
  if (res.status === 404) notFound();
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message ?? "Errore imprevisto, riprova");
  return data as T;
}
