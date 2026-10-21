"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, Button, ConfirmButton, Notice } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { SeasonView } from "@/lib/types";
import { SeasonForm } from "../SeasonForm";

type Editor = { members: { userId: number; username: string }[]; categories: { id: number; name: string }[]; awards: { id: number; name: string }[] };

export function Draft({ cineforumId, season, members, categories, awards }: { cineforumId: string; season: SeasonView } & Partial<Editor>) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  // ogni azione mostra il suo errore accanto al suo bottone
  const [error, setError] = useState<{ action: "launch" | "delete"; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const base = `/cineforums/${cineforumId}/seasons/${season.id}`;

  async function run(action: "launch" | "delete", fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError({ action, message: (err as ApiError).message });
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
      <section className="mb-4">
        <h2 className="font-serif text-xl">Partecipanti</h2>
        <ul className="flex flex-wrap gap-x-4">
          {season.participants.map((p) => (
            <li key={p.userId} className="flex min-h-11 items-center gap-2 text-muted">
              <Avatar name={p.username} url={p.avatarUrl} />
              {p.username}
            </li>
          ))}
        </ul>
      </section>
      {season.myRole === "PRESIDENT" ? (
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <ConfirmButton
            disabled={busy}
            className="w-full"
            confirmLabel="Tocca di nuovo: partono le email con le categorie segrete"
            onConfirm={() => run("launch", async () => {
              await api(`${base}/launch`, { quiet: true, method: "POST" });
              router.refresh();
            })}
          >
            Avvia l&apos;edizione
          </ConfirmButton>
          {/* sotto il bottone: l'avvio elenca tutto quello che manca */}
          {error?.action === "launch" && (
            <div className="w-full">
              <Notice tone="error">{error.message}</Notice>
            </div>
          )}
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => {
              setError(null); // dopo la modifica l'elenco dei problemi sarebbe vecchio
              setEditing(true);
            }}
          >
            Modifica
          </Button>
          <ConfirmButton
            variant="danger"
            disabled={busy}
            onConfirm={() => run("delete", async () => {
              await api(base, { quiet: true, method: "DELETE" });
              router.push(`/cineforums/${cineforumId}`);
              router.refresh();
            })}
          >
            Elimina bozza
          </ConfirmButton>
          {error?.action === "delete" && (
            <div className="w-full">
              <Notice tone="error">{error.message}</Notice>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-6 text-muted">L&apos;edizione sta per iniziare.</p>
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
