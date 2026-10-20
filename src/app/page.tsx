import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/ui";

export const metadata: Metadata = {
  robots: { index: true, follow: true },
  openGraph: { title: "Cinofili", description: "Il gioco del cineforum tra amici.", type: "website", locale: "it_IT" },
};

// ponytail: segnaposto, la home vera arriva con il suo task
export default function Home() {
  return (
    <>
      <PageTitle>Cinofili</PageTitle>
      <p className="text-muted">Il gioco del cineforum tra amici.</p>
      <Link href="/login" className="mt-6 inline-flex min-h-11 items-center text-gold underline underline-offset-4">
        Accedi
      </Link>
    </>
  );
}
