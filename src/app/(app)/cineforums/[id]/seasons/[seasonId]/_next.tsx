"use client";

import { useState } from "react";
import { ScreeningForm } from "@/components/ScreeningForm";
import { Button, Section } from "@/components/ui";
import { api } from "@/lib/api";
import { formatLongDateTime } from "@/lib/format";
import type { SeasonView } from "@/lib/types";
import { useAction } from "@/lib/useAction";

type Next = NonNullable<SeasonView["nextScreening"]>;

/**
 * Serata del prossimo film, prima dello svelamento: data, luogo e categoria, mai altro.
 * `base` solo per il presidente, quando c'è un film da svelare: allora si programma e si modifica.
 */
export function NextScreening({ base, next }: { base?: string; next: Next | null }) {
  const { busy, error, run } = useAction();
  const [editing, setEditing] = useState(false);
  if (!base && !next) return null;

  const summary = next && (
    <p>
      {formatLongDateTime(next.screeningAt)} · {next.location}
      {next.categoryName && ` · categoria ${next.categoryName}`}
    </p>
  );
  if (!base || (next && !editing)) {
    return (
      <Section title="Prossima proiezione" className="mb-8">
        {summary}
        {base && (
          <Button variant="secondary" onClick={() => setEditing(true)} className="mt-2">
            Modifica
          </Button>
        )}
      </Section>
    );
  }
  return (
    <Section title="Prossima proiezione" className="mb-8">
      <ScreeningForm
        screeningAt={next?.screeningAt ?? null}
        location={next?.location ?? null}
        busy={busy}
        error={error}
        submitLabel="Programma"
        onSubmit={async (body) => {
          if (await run(() => api(`${base}/next-screening`, { quiet: true, method: "POST", body }))) setEditing(false);
        }}
      >
        {editing && (
          <Button variant="secondary" onClick={() => setEditing(false)} className="mt-2 w-full">
            Annulla
          </Button>
        )}
      </ScreeningForm>
    </Section>
  );
}
