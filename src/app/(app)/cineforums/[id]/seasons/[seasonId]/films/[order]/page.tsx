import { notFound } from "next/navigation";
import { Poster } from "@/components/ui";
import { apiServer } from "@/lib/api-server";
import { formatDateTime } from "@/lib/format";
import type { MyVote, SeasonView } from "@/lib/types";
import { PlanScreening, Voting, VoteForm } from "./FilmActions";

export default async function FilmPage({ params }: { params: Promise<{ id: string; seasonId: string; order: string }> }) {
  const { id, seasonId, order } = await params;
  if (![id, seasonId, order].every((x) => /^\d+$/.test(x))) notFound();
  const s = await apiServer<SeasonView>(`/cineforums/${id}/seasons/${seasonId}`);
  const item = s.program.find((p) => p.order === Number(order));
  if (!item) notFound();
  const base = `/cineforums/${id}/seasons/${seasonId}/program/${order}`;
  const { movie } = item;
  const screening = s.status === "SCREENING";
  const screened = item.screeningAt != null && new Date(item.screeningAt) <= new Date();
  const myVotes = item.myVoteSubmitted ? await apiServer<MyVote[]>(`${base}/votes/me`) : null;

  return (
    <>
      <header className="mb-8">
        <div className="mx-auto mb-5 w-52">
          <Poster movie={movie} size="lg" />
        </div>
        <p className="text-sm text-muted">
          {s.name} · Film n. {item.order}
        </p>
        <h1 className="font-serif text-3xl leading-tight">{movie.title}</h1>
        {movie.originalTitle !== movie.title && <p className="font-serif text-muted italic">{movie.originalTitle}</p>}
        <p className="text-muted">{[movie.year, item.category?.name].filter(Boolean).join(" · ")}</p>
        <p className="mt-2">
          {item.screeningAt ? `Proiezione ${formatDateTime(item.screeningAt)}${item.location ? ` · ${item.location}` : ""}` : "Proiezione da programmare"}
        </p>
      </header>

      {s.myRole === "PRESIDENT" && screening && (
        <>
          {!screened && <PlanScreening key={`${item.screeningAt}|${item.location}`} base={base} screeningAt={item.screeningAt} location={item.location} />}
          {screened && <Voting base={base} votingOpen={item.votingOpen} votesMissing={item.votesMissing ?? 0} />}
        </>
      )}

      {item.isMine ? (
        <p className="border-l-2 border-gold py-1 pl-3">Questo è il tuo film: non puoi votarlo</p>
      ) : myVotes ? (
        <section>
          <h2 className="mb-2 font-serif text-xl">I tuoi voti</h2>
          <ul>
            {s.awards.map((a) => (
              <li key={a.id} className="border-b border-line py-2">
                {a.name}: {myVotes.find((v) => v.awardId === a.id)?.value ?? "–"}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        s.isParticipant && screening && item.votingOpen && <VoteForm base={base} awards={s.awards} />
      )}
    </>
  );
}
