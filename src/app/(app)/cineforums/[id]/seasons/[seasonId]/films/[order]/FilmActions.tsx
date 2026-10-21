"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ConfirmButton, Field, Notice } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { isoToRomeLocal, romeLocalToIso } from "@/lib/format";
import type { SeasonView } from "@/lib/types";

/** Esegue una mutazione: errore del backend così com'è, poi refresh dei dati del server. */
function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** true se è andata a buon fine (anche con 204 e corpo vuoto). */
  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      router.refresh();
      return true;
    } catch (err) {
      setError((err as ApiError).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, run };
}

export function PlanScreening({ base, screeningAt, location }: { base: string; screeningAt: string | null; location: string | null }) {
  const { busy, error, run } = useAction();
  return (
    <section className="mb-8">
      <h2 className="mb-3 font-serif text-xl">Programma la proiezione</h2>
      {error && <Notice tone="error">{error}</Notice>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void run(() => api(`${base}/screening`, { method: "PATCH", body: { screeningAt: romeLocalToIso(String(f.get("at"))), location: f.get("location") } }));
        }}
      >
        <Field label="Data e ora" name="at" type="datetime-local" defaultValue={screeningAt ? isoToRomeLocal(screeningAt) : ""} required />
        <Field label="Luogo" name="location" defaultValue={location ?? ""} maxLength={200} required />
        <Button type="submit" pending={busy} pendingLabel="Salvataggio…">
          Salva la proiezione
        </Button>
      </form>
    </section>
  );
}

export function Voting({ base, votingOpen, votesMissing }: { base: string; votingOpen: boolean; votesMissing: number }) {
  const { busy, error, run } = useAction();
  const [sent, setSent] = useState<number | null>(null);
  return (
    <section className="mb-8">
      {error && <Notice tone="error">{error}</Notice>}
      {!votingOpen ? (
        <ConfirmButton onConfirm={() => run(() => api(`${base}/open-voting`, { method: "POST" }))}>Apri il voto</ConfirmButton>
      ) : (
        <>
          <p className="mb-2">{votesMissing === 0 ? "Hanno votato tutti" : votesMissing === 1 ? "Manca 1 voto" : `Mancano ${votesMissing} voti`}</p>
          {sent != null && <Notice tone="success">Sollecito inviato a {sent === 1 ? "1 persona" : `${sent} persone`}</Notice>}
          {votesMissing > 0 && (
            <Button
              disabled={busy}
              pending={busy}
              pendingLabel="Invio…"
              onClick={async () => {
                await run(async () => setSent((await api<{ sent: number }>(`${base}/vote-reminder`, { method: "POST" })).sent));
              }}
            >
              Sollecita
            </Button>
          )}
        </>
      )}
    </section>
  );
}

export function VoteForm({ base, awards }: { base: string; awards: SeasonView["awards"] }) {
  const { error, run } = useAction();
  // inviati: niente secondo POST mentre router.refresh() porta la vista in sola lettura
  const [sent, setSent] = useState(false);
  // solo i cursori toccati (primo evento `input`, anche da tastiera)
  const [values, setValues] = useState<Record<number, number>>({});
  // un tocco sul valore di riposo non genera `input`: conta anche il pointerup (non il pointercancel di uno scroll)
  const touch = (awardId: number, value: number) => setValues((v) => ({ ...v, [awardId]: value }));
  const allTouched = awards.every((a) => values[a.id] !== undefined);
  return (
    <section>
      <h2 className="mb-3 font-serif text-xl">Il tuo voto</h2>
      {error && <Notice tone="error">{error}</Notice>}
      {awards.map((a) => (
        <div key={a.id} className="mb-6">
          <label htmlFor={`award-${a.id}`} className="block">
            <span className="font-serif text-lg">{a.name}</span>
            <span className="block text-muted">{a.question}</span>
          </label>
          <div className="mt-2 flex items-center gap-4">
            <input
              id={`award-${a.id}`}
              type="range"
              min={0}
              max={100}
              value={values[a.id] ?? 50}
              aria-valuetext={values[a.id] === undefined ? "Non ancora votato" : undefined}
              disabled={sent}
              onChange={(e) => touch(a.id, Number(e.target.value))}
              onPointerUp={(e) => touch(a.id, Number(e.currentTarget.value))}
              className={`h-11 flex-1 accent-gold ${values[a.id] === undefined ? "opacity-40" : ""}`}
            />
            <output htmlFor={`award-${a.id}`} className="w-10 text-right font-serif text-2xl text-gold tabular-nums">
              {values[a.id] ?? "–"}
            </output>
          </div>
        </div>
      ))}
      <p className="mb-3 text-sm text-muted">I voti non si possono modificare</p>
      {!allTouched && <p className="mb-3 text-sm text-gold">Muovi tutti i cursori per votare</p>}
      <ConfirmButton
        disabled={sent || !allTouched}
        onConfirm={async () => {
          const ok = await run(() => api(`${base}/votes`, { method: "POST", body: { votes: Object.entries(values).map(([id, value]) => ({ awardId: Number(id), value })) } }));
          if (ok) setSent(true);
        }}
      >
        Invia i voti
      </ConfirmButton>
    </section>
  );
}
