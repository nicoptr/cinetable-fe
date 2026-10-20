"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ConfirmButton, Field, Notice, Poster } from "@/components/ui";
import { MovieSearch } from "@/components/MovieSearch";
import { api, ApiError } from "@/lib/api";
import { formatDateTime, isoToRomeLocal, romeLocalToIso } from "@/lib/format";
import type { CandidatureProgress, MyCandidature, SeasonView } from "@/lib/types";

export function Open({ cineforumId, season, mine, progress }: { cineforumId: string; season: SeasonView; mine: MyCandidature | null; progress: CandidatureProgress | null }) {
  const router = useRouter();
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const serverCloseAt = isoToRomeLocal(season.candidaturesCloseAt);
  const [edit, setEdit] = useState({ from: serverCloseAt, value: serverCloseAt });
  // segue il valore del server dopo router.refresh()
  const closeAt = edit.from === serverCloseAt ? edit.value : serverCloseAt;
  const setCloseAt = (value: string) => setEdit({ from: serverCloseAt, value });
  const base = `/cineforums/${cineforumId}/seasons/${season.id}`;
  const { valid, expected } = season.candidatures;
  const passed = new Date(season.candidaturesCloseAt) <= new Date();

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  const showSearch = searching || mine?.status === "NONE" || mine?.status === "DUPLICATE";
  return (
    <>
      <p>Candidature aperte fino a {formatDateTime(season.candidaturesCloseAt)}</p>
      {season.finalNightAt && <p className="text-muted">Serata finale {formatDateTime(season.finalNightAt)}</p>}
      <p className="mb-6 text-muted">
        {valid} film su {expected}
      </p>

      {season.isParticipant && mine && (
        <>
          {season.myCategory && (
            <section className="mb-6 border border-gold p-4">
              <h2 className="text-sm text-muted">La tua categoria</h2>
              <p className="font-serif text-2xl text-gold">{season.myCategory.name}</p>
              <p className="text-sm text-muted">Tienila segreta</p>
            </section>
          )}
          <section className="mb-6">
            <h2 className="mb-2 font-serif text-xl">Il tuo film</h2>
            {mine.status === "NONE" && <p className="text-muted">Non hai ancora scelto: cerca il tuo film qui sotto.</p>}
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
          </section>
        </>
      )}

      {progress && (
        <section className="mb-6">
          <h2 className="mb-2 font-serif text-xl">Chi manca</h2>
          {progress.missing.length === 0 ? (
            <p className="text-muted">Nessuno: tutti hanno un film valido.</p>
          ) : (
            <ul>
              {progress.missing.map((p) => (
                <li key={p.userId} className="flex items-center justify-between gap-3 border-b border-line py-1">
                  <span>{p.username}</span>
                  <ConfirmButton variant="secondary" disabled={busy} onConfirm={() => run(() => api(`${base}/participants/${p.userId}`, { method: "DELETE" }))}>
                    Togli dalla rassegna
                  </ConfirmButton>
                </li>
              ))}
            </ul>
          )}
          <form
            className="mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              void run(() => api(base, { method: "PATCH", body: { candidaturesCloseAt: romeLocalToIso(closeAt) } }));
            }}
          >
            <Field label="Sposta la scadenza" type="datetime-local" value={closeAt} onChange={(e) => setCloseAt(e.target.value)} required />
            <Button type="submit" disabled={busy}>
              Salva scadenza
            </Button>
          </form>
          {passed && valid === expected && (
            <div className="mt-6">
              <Button disabled={busy} onClick={() => run(() => api(`${base}/reveal-next`, { method: "POST" }))}>
                Svela il primo film
              </Button>
            </div>
          )}
        </section>
      )}
      {error && <Notice tone="error">{error}</Notice>}
    </>
  );
}
