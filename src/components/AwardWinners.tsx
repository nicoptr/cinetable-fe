import { Avatar, Poster } from "@/components/ui";
import type { AwardResult } from "@/lib/types";

const oneDecimal = new Intl.NumberFormat("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const formatAverage = (n: number) => oneDecimal.format(n);
export const formatVotes = (n: number) => (n === 1 ? "1 voto" : `${n} voti`);

/** Vincitori di un award: locandine affiancate se ex aequo. */
export function AwardWinners({ award }: { award: AwardResult }) {
  const { winners } = award;
  if (!winners.length) return <p className="text-muted">Nessun vincitore: nessun voto</p>;
  return (
    <>
      {winners.length > 1 && <p className="mb-2 font-serif text-gold">Ex aequo</p>}
      <ul className="flex flex-wrap justify-center gap-4">
        {winners.map((w) => (
          <li key={w.movie.tmdbId} className={winners.length > 1 ? "w-36" : "w-52"}>
            <Poster movie={w.movie} size="lg" />
            <h4 className="mt-3 font-serif text-2xl leading-tight text-ink">{w.movie.title}</h4>
            <p className="text-sm text-muted">
              proposto da{" "}
              <span className="inline-flex items-center gap-1.5 align-middle">
                <Avatar name={w.proposer.username} url={w.proposer.avatarUrl} size={20} />
                <strong className="text-ink">{w.proposer.username}</strong>
              </span>
              <br />
              media <span className="text-gold">{formatAverage(w.average)}</span> · {formatVotes(w.votes)}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
