import Link from "next/link";
import { BrandHeader } from "@/components/BrandHeader";
import { PageTitle } from "@/components/ui";

export default function NotFound() {
  return (
    <>
      <BrandHeader />
      <PageTitle>Non trovato</PageTitle>
      <p className="text-muted">La pagina che cerchi non esiste o non è più disponibile.</p>
      <p className="mt-6 flex flex-wrap gap-x-6">
        <Link href="/cineforums" className="inline-flex min-h-11 items-center justify-center rounded border border-gold px-5 text-gold hover:bg-gold/10">
          I miei cineforum
        </Link>
        <Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-gold">
          Torna alla home
        </Link>
      </p>
    </>
  );
}
