import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { PageTitle } from "@/components/ui";
import { BACKEND } from "@/lib/api-server";
import type { InviteInfo } from "@/lib/types";

export const metadata: Metadata = { title: "Invito", robots: { index: false, follow: false }, referrer: "no-referrer" };

const link = "inline-flex min-h-11 items-center justify-center rounded border border-gold px-5 text-gold hover:bg-gold/10";

function Message({ title, text }: { title: string; text: string }) {
  return (
    <>
      <PageTitle>{title}</PageTitle>
      <p className="text-muted">{text}</p>
    </>
  );
}

export default async function InvitePage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const raw = (await searchParams).token;
  const token = Array.isArray(raw) ? raw[0] : raw;
  const invalid = <Message title="Invito non valido o scaduto" text="Chiedi a chi ti ha invitato di mandartene uno nuovo." />;
  if (!token) return invalid;

  // pubblica: niente apiServer (404 per un token sbagliato è un caso normale)
  let res: Response;
  try {
    // l'IP del client, così il rate limit per IP del backend non mette tutti nello stesso secchio
    const forwardedFor = (await headers()).get("x-forwarded-for");
    res = await fetch(`${BACKEND}/sub/api/invitations/token/${encodeURIComponent(token)}`, {
      cache: "no-store",
      headers: forwardedFor ? { "x-forwarded-for": forwardedFor } : undefined,
    });
  } catch {
    return <Message title="Servizio non disponibile, riprova tra poco" text="Non siamo riusciti a controllare l'invito." />;
  }
  if (res.status === 404 || res.status === 400) return invalid;
  if (!res.ok) return <Message title="Servizio non disponibile, riprova tra poco" text="Non siamo riusciti a controllare l'invito." />;

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
        <Link href={`/signup?invite=${encodeURIComponent(token)}&email=${encodeURIComponent(info.email)}`} className={link}>
          Crea il tuo account
        </Link>
      )}
    </>
  );
}
