"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ScreeningForm } from "@/components/ScreeningForm";
import { Button, ConfirmButton, Notice, Section } from "@/components/ui";
import { api } from "@/lib/api";
import { formatLongDateTime } from "@/lib/format";
import type { SeasonView } from "@/lib/types";
import { useAction } from "@/lib/useAction";

/** Oltre questo ritardo setTimeout scatta subito: per date così lontane il timer non serve. */
const MAX_TIMEOUT = 2 ** 31 - 1;

export function PlanScreening({ base, screeningAt, location }: { base: string; screeningAt: string | null; location: string | null }) {
  const { busy, error, run } = useAction();
  return (
    <Section title="Programma la proiezione">
      <ScreeningForm
        screeningAt={screeningAt}
        location={location}
        busy={busy}
        error={error}
        submitLabel="Salva la proiezione"
        onSubmit={(body) => void run(() => api(`${base}/screening`, { quiet: true, method: "PATCH", body }))}
      />
    </Section>
  );
}

/** true dall'orario della proiezione in poi: parte dal valore del server, poi un timer lo fa scattare da solo e aggiorna la vista. */
function useScreened(screeningAt: string | null, initiallyScreened: boolean) {
  const router = useRouter();
  const [screened, setScreened] = useState(initiallyScreened);
  useEffect(() => {
    if (!screeningAt || screened) return;
    const wait = Date.parse(screeningAt) - Date.now();
    if (wait > MAX_TIMEOUT) return;
    const timer = setTimeout(() => {
      setScreened(true);
      router.refresh();
    }, Math.max(0, wait));
    return () => clearTimeout(timer);
  }, [screeningAt, screened, router]);
  return screened;
}

type VotingProps = { base: string; screeningAt: string | null; screened: boolean; votingOpen: boolean; votesMissing: number };

export function Voting({ base, screeningAt, screened: initiallyScreened, votingOpen, votesMissing }: VotingProps) {
  const { busy, error, run } = useAction();
  const [sent, setSent] = useState<number | null>(null);
  const screened = useScreened(screeningAt, initiallyScreened);
  return (
    <Section>
      {error && <Notice tone="error">{error}</Notice>}
      {!votingOpen ? (
        !screeningAt ? (
          <p className="text-muted">Fissa prima la proiezione</p>
        ) : !screened ? (
          <p className="text-muted">Potrai aprire il voto dopo la proiezione del {formatLongDateTime(screeningAt)}</p>
        ) : (
          <ConfirmButton onConfirm={() => run(() => api(`${base}/open-voting`, { quiet: true, method: "POST" }))}>Apri il voto</ConfirmButton>
        )
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
                await run(async () => setSent((await api<{ sent: number }>(`${base}/vote-reminder`, { quiet: true, method: "POST" })).sent));
              }}
            >
              Sollecita
            </Button>
          )}
        </>
      )}
    </Section>
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
    <Section title="Il tuo voto">
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
          const ok = await run(() => api(`${base}/votes`, { quiet: true, method: "POST", body: { votes: Object.entries(values).map(([id, value]) => ({ awardId: Number(id), value })) } }));
          if (ok) setSent(true);
        }}
      >
        Invia i voti
      </ConfirmButton>
    </Section>
  );
}
