"use client";

import { useEffect, useState } from "react";
import { Button, Field, Notice, Poster } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { MovieSearchResult, MovieView } from "@/lib/types";

const DOWN = "Servizio film non disponibile, riprova";
const msg = (e: unknown) => ((e as ApiError).status >= 500 ? DOWN : (e as ApiError).message);

/** Ricerca TMDB (400 ms dopo l'ultima battuta, minimo 2 caratteri) e candidatura con conferma. */
export function MovieSearch({ candidatureUrl, onDone }: { candidatureUrl: string; onDone: () => void }) {
  const [q, setQ] = useState("");
  const [movies, setMovies] = useState<MovieView[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pick, setPick] = useState<MovieView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load(term: string, p: number) {
    setBusy(true);
    setError(null);
    try {
      const r = await api<MovieSearchResult>(`/movies/search?q=${encodeURIComponent(term)}&page=${p}`);
      setMovies((prev) => (p === 1 ? r.results : [...prev, ...r.results]));
      setPage(p);
      setTotalPages(r.totalPages);
    } catch (e) {
      setError(msg(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const t = setTimeout(() => void load(term, 1), 400);
    return () => clearTimeout(t);
  }, [q]);

  async function confirm() {
    if (!pick) return;
    setBusy(true);
    setError(null);
    try {
      await api(candidatureUrl, { method: "PUT", body: { tmdbId: pick.tmdbId } });
      onDone();
    } catch (e) {
      setError(msg(e));
      setPick(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Field label="Cerca un film" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      {error && <Notice tone="error">{error}</Notice>}
      {pick && (
        <div className="mb-5 border-l-2 border-gold py-1 pl-3">
          <p className="mb-2">
            Candidare <strong>{pick.title}</strong>?
          </p>
          <div className="flex gap-3">
            <Button pending={busy} pendingLabel="Invio…" onClick={confirm}>
              Sì, candida
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => setPick(null)}>
              Annulla
            </Button>
          </div>
        </div>
      )}
      <ul className="grid grid-cols-2 gap-3 min-[600px]:grid-cols-3">
        {movies.map((m) => (
          <li key={m.tmdbId}>
            <button type="button" disabled={busy} onClick={() => setPick(m)} className="block min-h-11 w-full text-left disabled:opacity-60">
              <Poster movie={m} size="lg" />
              <span className="mt-1 block">{m.title}</span>
              <span className="block text-sm text-muted">{m.year ?? "—"}</span>
            </button>
          </li>
        ))}
      </ul>
      {totalPages > page && (
        <div className="mt-4">
          <Button variant="secondary" disabled={busy} onClick={() => load(q.trim(), page + 1)}>
            Altri risultati
          </Button>
        </div>
      )}
    </div>
  );
}
