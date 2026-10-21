"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ConfirmButton, Field, Notice, Poster, Section } from "@/components/ui";
import { MovieSearch } from "@/components/MovieSearch";
import { api, errorText } from "@/lib/api";
import { formatDateTime, isoToRomeLocal, romeLocalToIso } from "@/lib/format";
import type { CandidatureProgress, MyCandidature, SeasonView } from "@/lib/types";

export function Open({ cineforumId, season, mine, progress }: { cineforumId: string; season: SeasonView; mine: MyCandidature | null; progress: CandidatureProgress | null }) {
  const router = useRouter();
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const serverCloseAt = isoToRomeLocal(season.candidaturesCloseAt);
  const [edit, setEdit] = useState({ from: serverCloseAt, value: serverCloseAt });
  // segue il valore del server dopo router.refresh()
  const closeAt = edit.from === serverCloseAt ? edit.value : serverCloseAt;
  const setCloseAt = (value: string) => setEdit({ from: serverCloseAt, value });
  const base = `/cineforums/${cineforumId}/seasons/${season.id}`;
  const { valid, expected } = season.candidatures;
  const passed = new Date(season.candidaturesCloseAt) <= new Date();

  /** Senza `quiet` l'errore lo mostra l'avviso di api(); con `quiet` lo mostra il chiamante. */
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
      router.refresh();
    } catch {
      // già mostrato
    } finally {
      setBusy(false);
    }
  }

  const showSearch = searching || mine?.status === "NONE" || mine?.status === "DUPLICATE";
  return (
    <>
      <p>{passed ? "Candidature chiuse il" : "Chiusura candidature:"} {formatDateTime(season.candidaturesCloseAt)}</p>
      {season.finalNightAt && <p className="text-muted">Serata finale {formatDateTime(season.finalNightAt)}</p>}
      <p className="mb-6 text-muted">
        {valid} film su {expected}
      </p>

      {season.isParticipant && mine && (
        <>
          {season.myCategory && (
            <Section title="La tua categoria">
              <p className="font-serif text-2xl text-gold">{season.myCategory.name}</p>
              <p className="text-sm text-muted">Tienila segreta</p>
            </Section>
          )}
          <Section title="Il tuo film">
            {mine.status === "NONE" && <p className="mb-4 text-muted">Non hai ancora scelto: cerca il tuo film qui sotto.</p>}
            {mine.status === "DUPLICATE" && <Notice tone="error">Anche un altro partecipante ha scelto questo film: scegline un altro</Notice>}
            {mine.movie && (
              <div className="mb-3 flex items-start gap-3">
                <Poster movie={mine.movie} />
                <div>
                  <p className="font-serif text-lg">{mine.movie.title}</p>
                  <p className="text-muted">{mine.movie.year}</p>
                </div>
              </div>
            )}
            {mine.status === "VALID" && !searching && (
              <Button variant="secondary" onClick={() => setSearching(true)}>
                Cambia film
              </Button>
            )}
            {showSearch && <MovieSearch candidatureUrl={`${base}/candidature`} onDone={() => { setSearching(false); router.refresh(); }} />}
          </Section>
        </>
      )}

      {/* a gioco iniziato (candidature chiuse e tutti i film validi) non manca più nessuno */}
      {progress && !(passed && valid === expected) && (
        <Section title="Chi manca">
          {progress.missing.length === 0 ? (
            <p className="text-muted">Nessuno: tutti hanno un film valido.</p>
          ) : (
            <ul>
              {progress.missing.map((p) => (
                <li key={p.userId} className="flex items-center justify-between gap-3 border-t border-line py-1 first:border-t-0">
                  <span>{p.username}</span>
                  <ConfirmButton variant="danger" disabled={busy} onConfirm={() => run(() => api(`${base}/participants/${p.userId}`, { method: "DELETE" }))}>
                    Togli dall&apos;edizione
                  </ConfirmButton>
                </li>
              ))}
            </ul>
          )}
          <form
            className="mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                setCloseError(null);
                try {
                  await api(base, { quiet: true, method: "PATCH", body: { candidaturesCloseAt: romeLocalToIso(closeAt) } });
                } catch (err) {
                  setCloseError(errorText(err));
                  throw err;
                }
              });
            }}
          >
            <Field label="Sposta la scadenza" type="datetime-local" error={closeError} value={closeAt} onChange={(e) => setCloseAt(e.target.value)} required />
            <Button type="submit" disabled={busy} className="w-full">
              Salva scadenza
            </Button>
          </form>
        </Section>
      )}
    </>
  );
}
