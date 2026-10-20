import Link from "next/link";
import { PageTitle } from "@/components/ui";
import type { InviteInfo } from "@/lib/types";

export const metadata = { title: "Invito" };

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:5000";
const link = "inline-flex min-h-11 items-center justify-center rounded border border-gold px-5 text-gold hover:bg-gold/10";

export default async function InvitePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  // pubblica: niente apiServer (il 404 di un token sbagliato è un caso normale, non una notFound)
  const res = token ? await fetch(`${BACKEND}/sub/api/invitations/token/${encodeURIComponent(token)}`, { cache: "no-store" }) : null;
  if (!res?.ok) {
    return (
      <>
        <PageTitle>Invito non valido o scaduto</PageTitle>
        <p className="text-muted">Chiedi a chi ti ha invitato di mandartene uno nuovo.</p>
      </>
    );
  }
  const info = (await res.json()) as InviteInfo;
  return (
    <>
      <PageTitle>
        {info.invitedBy} ti invita in {info.cineforumName}
      </PageTitle>
      {info.userExists ? (
        <Link href="/login?next=/invitations" className={link}>
          Accedi per accettare
        </Link>
      ) : (
        <Link href={`/signup?invite=${encodeURIComponent(token!)}&email=${encodeURIComponent(info.email)}`} className={link}>
          Crea il tuo account
        </Link>
      )}
    </>
  );
}
