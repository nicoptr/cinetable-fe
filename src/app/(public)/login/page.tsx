import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageTitle } from "@/components/ui";
import { BACKEND, originHeaders } from "@/lib/api-server";
import { safeNext } from "@/lib/nav";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Accedi" };

/** Il cookie da solo non basta (può essere scaduto: redirect in loop con apiServer), quindi si chiede al backend. */
async function hasSession(): Promise<boolean> {
  const jar = await cookies();
  if (!jar.has("cinetable_token")) return false;
  try {
    const res = await fetch(`${BACKEND}/sub/api/auth/me`, { headers: { cookie: jar.toString(), ...originHeaders() }, cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await hasSession()) redirect(safeNext(next));
  return (
    <>
      <PageTitle>Accedi</PageTitle>
      <LoginForm next={safeNext(next)} />
      <p className="mt-6 flex flex-wrap gap-x-6">
        <Link href="/forgot-password" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-gold">
          Password dimenticata?
        </Link>
        <Link href="/signup" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-gold">
          Registrati
        </Link>
      </p>
    </>
  );
}
