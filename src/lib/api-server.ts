import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

/** Server: chiama il backend inoltrando il cookie della richiesta, mai in cache. */
export async function apiServer<T>(path: string): Promise<T> {
  const res = await fetch(`${process.env.BACKEND_URL}/sub/api${path}`, {
    headers: { cookie: (await cookies()).toString() },
    cache: "no-store",
  });
  if (res.status === 401) {
    const current = (await headers()).get("x-pathname") ?? "/";
    redirect("/login?next=" + encodeURIComponent(current));
  }
  if (res.status === 404) notFound();
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message ?? "Errore imprevisto, riprova");
  return data as T;
}
