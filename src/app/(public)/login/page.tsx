import Link from "next/link";
import { PageTitle } from "@/components/ui";
import { safeNext } from "@/lib/nav";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Accedi" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
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
