import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/ui";
import { apiServer } from "@/lib/api-server";
import { formatDate } from "@/lib/format";
import type { CineforumDetail, SeasonListItem } from "@/lib/types";

const STATUS: Record<SeasonListItem["status"], string> = {
  DRAFT: "Bozza",
  OPEN: "Candidature aperte",
  SCREENING: "In proiezione",
  FINAL: "Serata finale",
  DONE: "Conclusa",
};

const LINK = "inline-flex min-h-11 items-center text-gold underline underline-offset-4";

export default async function CineforumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const [c, seasons] = await Promise.all([
    apiServer<CineforumDetail>(`/cineforums/${id}`),
    apiServer<SeasonListItem[]>(`/cineforums/${id}/seasons`),
  ]);
  const president = c.myRole === "PRESIDENT";
  return (
    <>
      <PageTitle>{c.name}</PageTitle>
      {c.description && <p className="text-muted">{c.description}</p>}
      <nav className="mt-3 flex gap-6">
        <Link href={`/cineforums/${id}/members`} className={LINK}>
          Membri
        </Link>
        {president && (
          <Link href={`/cineforums/${id}/settings`} className={LINK}>
            Impostazioni
          </Link>
        )}
      </nav>
      <h2 className="mt-8 mb-2 font-serif text-2xl">Rassegne</h2>
      {seasons.length === 0 && <p className="text-muted">Nessuna rassegna.</p>}
      <ul>
        {seasons.map((s) => (
          <li key={s.id} className="border-t border-line first:border-t-0">
            <Link href={`/cineforums/${id}/seasons/${s.id}${s.status === "DONE" ? "/summary" : ""}`} className="block py-3">
              <span className="font-serif text-xl">{s.name}</span>
              <span className="block text-muted">
                {STATUS[s.status]} · candidature fino al {formatDate(s.candidaturesCloseAt)}
                {s.finalNightAt && ` · serata finale ${formatDate(s.finalNightAt)}`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {president && (
        <Link href={`/cineforums/${id}/seasons/new`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded border border-gold px-5 text-gold hover:bg-gold/10">
          Nuova rassegna
        </Link>
      )}
    </>
  );
}
