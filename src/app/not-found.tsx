import Link from "next/link";
import { PageTitle } from "@/components/ui";

export default function NotFound() {
  return (
    <>
      <PageTitle>Non trovato</PageTitle>
      <p className="text-muted">La pagina che cerchi non esiste o non è più disponibile.</p>
      <Link href="/" className="mt-6 inline-flex min-h-11 items-center text-gold underline underline-offset-4">
        Torna alla home
      </Link>
    </>
  );
}
