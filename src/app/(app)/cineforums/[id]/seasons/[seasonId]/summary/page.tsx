import Link from "next/link";
import { notFound } from "next/navigation";
import { AwardWinners, formatAverage, formatVotes } from "@/components/AwardWinners";
import { Avatar, PageTitle, Poster, Section } from "@/components/ui";
import { apiServer } from "@/lib/api-server";
import { formatDate, formatDateTime } from "@/lib/format";
import type { SeasonSummary } from "@/lib/types";

export default async function SummaryPage({ params }: { params: Promise<{ id: string; seasonId: string }> }) {
  const { id, seasonId } = await params;
  if (!/^\d+$/.test(id) || !/^\d+$/.test(seasonId)) notFound();
  const base = `/cineforums/${id}/seasons/${seasonId}`;
  const { season, awards, films, participants } = await apiServer<SeasonSummary>(`${base}/summary`);
  const awardName = new Map(awards.map((a) => [a.awardId, a.name]));

  return (
    <>
      <Link href={base} className="mb-4 inline-flex min-h-11 items-center text-sm text-muted underline underline-offset-4 hover:text-gold print:hidden">
        Torna all&apos;edizione
      </Link>
      <PageTitle>{season.name}</PageTitle>
      {season.description && <p className="mb-2">{season.description}</p>}
      <p className="mb-8 text-sm text-muted">
        Candidature chiuse il {formatDate(season.candidaturesCloseAt)}
        {season.finalNightAt && ` · serata finale ${formatDateTime(season.finalNightAt)}`}
        <br />
        Conclusa il {formatDate(season.concludedAt)}
      </p>

      <Section aria-label="Albo d'oro" title="Albo d'oro">
        {awards.map((a) => (
          <section key={a.awardId} aria-label={a.name} className="border-t border-line py-6 text-center break-inside-avoid first-of-type:border-t-0 first-of-type:pt-0 last:pb-0">
            <h3 className="mb-4 font-serif text-xl text-gold">{a.name}</h3>
            <AwardWinners award={a} />
          </section>
        ))}
      </Section>

      <Section title="I film">
        <ol aria-label="I film">
          {films.map((f) => (
            <li key={f.order} className="flex items-start gap-3 border-t border-line py-4 break-inside-avoid first:border-t-0">
              <Poster movie={f.movie} />
              <div className="min-w-0">
                <p className="text-sm text-muted">Film n. {f.order}</p>
                <h3 className="font-serif text-lg leading-snug">{f.movie.title}</h3>
                {f.category && <p className="text-sm text-muted">{f.category.name}</p>}
                <p className="flex items-center gap-1.5 text-sm">
                  proposto da <Avatar name={f.proposer.username} url={f.proposer.avatarUrl} size={20} />
                  <strong>{f.proposer.username}</strong>
                </p>
                {f.screeningAt && (
                  <p className="text-sm text-muted">
                    {formatDateTime(f.screeningAt)}
                    {f.location && ` · ${f.location}`}
                  </p>
                )}
                <div className="mt-2 text-sm">
                  {f.scores.map((sc) => (
                    <p key={sc.awardId}>
                      {awardName.get(sc.awardId)}:{" "}
                      {sc.average === null ? "nessun voto" : `media ${formatAverage(sc.average)} · ${formatVotes(sc.votes)}`}
                      {f.awardsWon.includes(sc.awardId) && (
                        <span role="img" aria-label="Premio vinto" className="ml-1 text-gold">
                          ★
                        </span>
                      )}
                    </p>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section aria-label="Partecipanti" title="Partecipanti">
        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          {participants.map((p) => (
            <li key={p.userId} className="flex items-center gap-2">
              <Avatar name={p.username} url={p.avatarUrl} />
              {p.username}
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
