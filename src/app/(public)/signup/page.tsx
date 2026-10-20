import Link from "next/link";
import { PageTitle } from "@/components/ui";
import { SignupForm } from "./SignupForm";

export const metadata = { title: "Registrati" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ invite?: string; email?: string }> }) {
  const { invite, email } = await searchParams;
  return (
    <>
      <PageTitle>Crea il tuo account</PageTitle>
      <SignupForm invite={invite && email ? { token: invite, email } : null} />
      <p className="mt-6">
        <Link href="/login" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-gold">
          Hai già un account? Accedi
        </Link>
      </p>
    </>
  );
}
