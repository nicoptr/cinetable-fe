"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AwardWinners } from "@/components/AwardWinners";
import { Envelope, ENVELOPE_ANIMATION_MS } from "@/components/Envelope";
import { Avatar, Poster, Section } from "@/components/ui";
import { api } from "@/lib/api";
import type { AwardResult, SeasonResults, SeasonView } from "@/lib/types";

/**
 * Serata finale: le buste dei premi (solo presidente) e i risultati già aperti.
 * Sta nello stesso punto dell'albero in SCREENING, FINAL e DONE: dopo `router.refresh()`
 * la busta appena aperta resta montata e aperta, e non si ripete tra i risultati.
 * Una busta alla volta: mentre una si apre (risposta e animazione) le altre sono disabilitate.
 */
export function FinalNight({
  base,
  awards,
  president,
  results,
}: {
  base: string;
  awards: SeasonView["awards"];
  president: boolean;
  results: SeasonResults | null;
}) {
  const router = useRouter();
  const [justOpened, setJustOpened] = useState<number[]>([]);
  const [opening, setOpening] = useState<number | null>(null);
  const openedBefore = new Set((results?.awards ?? []).map((a) => a.awardId));
  const envelopes = president ? awards.filter((a) => !openedBefore.has(a.id) || justOpened.includes(a.id)) : [];
  const shown = (results?.awards ?? []).filter((a) => !justOpened.includes(a.awardId));

  return (
    <>
      {envelopes.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 font-serif text-xl">Le buste</h2>
          {envelopes.map((a) => (
            <Envelope
              key={a.id}
              label={a.name}
              disabled={opening !== null && opening !== a.id}
              onOpen={async () => {
                setOpening(a.id);
                let result: AwardResult;
                try {
                  result = await api<AwardResult>(`${base}/awards/${a.id}/open`, { quiet: true, method: "POST" });
                } catch (err) {
                  setOpening(null);
                  router.refresh();
                  throw err;
                }
                setTimeout(() => setOpening(null), ENVELOPE_ANIMATION_MS);
                setJustOpened((ids) => [...ids, a.id]);
                router.refresh();
                return (
                  <>
                    <h3 className="mb-4 font-serif text-xl text-gold">{result.name}</h3>
                    <AwardWinners award={result} envelope />
                  </>
                );
              }}
            />
          ))}
        </section>
      )}
      {shown.length > 0 && (
        <Section aria-label="Risultati" title="Risultati">
          {shown.map((a) => (
            <section key={a.awardId} aria-label={a.name} className="border-t border-line py-6 text-center first-of-type:border-t-0 first-of-type:pt-0 last:pb-0">
              <h3 className="mb-1 font-serif text-xl text-gold">{a.name}</h3>
              <p className="mb-4 text-sm text-muted">{a.question}</p>
              <AwardWinners award={a} />
            </section>
          ))}
        </Section>
      )}
      {results?.allRevealed && results.proposers.length > 0 && (
        <Section title="Chi ha proposto cosa">
          <ul>
            {results.proposers.map((p) => (
              <li key={p.order} className="flex items-center gap-3 border-t border-line py-3 first:border-t-0">
                <Poster movie={p.movie} size="sm" />
                <div className="min-w-0">
                  <p className="font-serif leading-snug">{p.movie.title}</p>
                  <p className="flex items-center gap-1.5 text-sm text-muted">
                    proposto da <Avatar name={p.proposer.username} url={p.proposer.avatarUrl} size={20} />
                    <strong className="text-ink">{p.proposer.username}</strong>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
