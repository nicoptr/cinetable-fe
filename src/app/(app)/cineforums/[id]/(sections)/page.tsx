import Link from "next/link";
import { notFound } from "next/navigation";
import { Section } from "@/components/ui";
import { apiServer } from "@/lib/api-server";
import { candidaturesClosed, formatDate } from "@/lib/format";
import type { CineforumDetail, SeasonListItem } from "@/lib/types";

const STATUS: Record<SeasonListItem["status"], string> = {
  DRAFT: "Bozza",
  OPEN: "Candidature aperte",
  SCREENING: "In proiezione",
  FINAL: "Serata finale",
  DONE: "Conclusa",
};

function closeText(s: SeasonListItem) {
  const date = formatDate(s.candidaturesCloseAt);
  if (!candidaturesClosed(s.status, s.candidaturesCloseAt)) return `${STATUS[s.status]} · candidature fino al ${date}`;
  return s.status === "OPEN" ? `Candidature chiuse il ${date}` : `${STATUS[s.status]} · candidature chiuse il ${date}`;
}

function Seasons({ id, title, seasons }: { id: string; title: string; seasons: SeasonListItem[] }) {
  if (seasons.length === 0) return null;
  return (
    <Section title={title}>
      <ul>
        {seasons.map((s) => (
          <li key={s.id} className="border-t border-line first:border-t-0">
            <Link href={`/cineforums/${id}/seasons/${s.id}${s.status === "DONE" ? "/summary" : ""}`} className="block py-3 hover:text-gold">
              <span className="font-serif text-xl">{s.name}</span>
              <span className="block text-muted">
                {closeText(s)}
                {s.finalNightAt && ` · serata finale ${formatDate(s.finalNightAt)}`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export default async function SeasonsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const [c, seasons] = await Promise.all([
    apiServer<CineforumDetail>(`/cineforums/${id}`),
    apiServer<SeasonListItem[]>(`/cineforums/${id}/seasons`),
  ]);
  return (
    <>
      {seasons.length === 0 && <p className="text-muted">Nessuna edizione.</p>}
      <Seasons id={id} title="In corso" seasons={seasons.filter((s) => s.status !== "DONE")} />
      <Seasons id={id} title="Concluse" seasons={seasons.filter((s) => s.status === "DONE")} />
      {c.myRole === "PRESIDENT" && (
        <Link href={`/cineforums/${id}/seasons/new`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded btn-primary border border-gold px-5 text-gold">
          + Nuova edizione
        </Link>
      )}
    </>
  );
}
