"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ConfirmButton, Notice } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { SeasonView } from "@/lib/types";
import { SeasonForm } from "../SeasonForm";

type Editor = { members: { userId: number; username: string }[]; categories: { id: number; name: string }[]; awards: { id: number; name: string }[] };

export function Draft({ cineforumId, season, members, categories, awards }: { cineforumId: string; season: SeasonView } & Partial<Editor>) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const base = `/cineforums/${cineforumId}/seasons/${season.id}`;

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  if (editing && members && categories && awards) {
    return <SeasonForm cineforumId={cineforumId} season={season} members={members} categories={categories} awards={awards} onDone={() => setEditing(false)} />;
  }

  return (
    <>
      {season.description && <p className="mb-4">{season.description}</p>}
      <Summary title="Categorie" items={season.categories.map((c) => c.name)} />
      <Summary title="Premi" items={season.awards.map((a) => a.name)} />
      <Summary title="Partecipanti" items={season.participants.map((p) => p.username)} />
      {error && <Notice tone="error">{error}</Notice>}
      {season.myRole === "PRESIDENT" ? (
        <div className="mt-6 flex flex-col items-stretch gap-3">
          <ConfirmButton
            disabled={busy}
            confirmLabel="Tocca di nuovo: partono le email con le categorie segrete"
            onConfirm={() => run(async () => {
              await api(`${base}/launch`, { method: "POST" });
              router.refresh();
            })}
          >
            Avvia la rassegna
          </ConfirmButton>
          <Button variant="secondary" disabled={busy} onClick={() => setEditing(true)}>
            Modifica
          </Button>
          <ConfirmButton
            variant="danger"
            disabled={busy}
            onConfirm={() => run(async () => {
              await api(base, { method: "DELETE" });
              router.push(`/cineforums/${cineforumId}`);
              router.refresh();
            })}
          >
            Elimina bozza
          </ConfirmButton>
        </div>
      ) : (
        <p className="mt-6 text-muted">La rassegna sta per iniziare.</p>
      )}
    </>
  );
}

function Summary({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="mb-4">
      <h2 className="font-serif text-xl">{title}</h2>
      <p className="text-muted">{items.join(", ")}</p>
    </section>
  );
}
