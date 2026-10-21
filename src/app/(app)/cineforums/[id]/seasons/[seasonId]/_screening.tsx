import Link from "next/link";
import { Poster, Section } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import type { ProgramItem, SeasonView } from "@/lib/types";

function voteState(p: ProgramItem) {
  if (p.isMine) return "Il tuo film";
  if (p.myVoteSubmitted) return "Hai votato";
  if (p.votingOpen) return "Voto aperto";
  return null;
}

export function Screening({ base, season }: { base: string; season: SeasonView }) {
  const unrevealed = Array.from({ length: season.remainingToReveal }, (_, i) => season.program.length + i + 1);
  return (
    <Section title="Programma">
      <ul aria-label="Programma">
        {season.program.map((p) => {
          const state = voteState(p);
          return (
            <li key={p.order} className="border-t border-line first:border-t-0">
              <Link href={`${base}/films/${p.order}`} className="flex min-h-11 items-start gap-3 py-3 hover:text-gold">
                <Poster movie={p.movie} />
                <div className="min-w-0">
                  <p className="text-sm text-muted">Film n. {p.order}</p>
                  <p className="font-serif text-lg leading-snug">{p.movie.title}</p>
                  {p.category && <p className="text-sm text-muted">{p.category.name}</p>}
                  <p className="text-sm text-muted">
                    {p.screeningAt ? `${formatDateTime(p.screeningAt)}${p.location ? ` · ${p.location}` : ""}` : "Proiezione da programmare"}
                  </p>
                  {state && <p className={`text-sm ${state === "Voto aperto" ? "text-gold" : "text-muted"}`}>{state}</p>}
                </div>
              </Link>
            </li>
          );
        })}
        {unrevealed.map((n) => (
          <li key={n} className="flex items-center gap-3 border-t border-line py-3 first:border-t-0">
            <Poster movie={null} />
            <p className="text-sm text-muted">Film n. {n}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
