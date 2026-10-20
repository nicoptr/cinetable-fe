"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button, Field, Notice } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { isoToRomeLocal, romeLocalToIso } from "@/lib/format";
import type { SeasonView } from "@/lib/types";

type Item = { id: number; name: string };
type Member = { userId: number; username: string };

function Checks({ legend, name, items, selected, toggle, manage }: { legend: string; name: string; items: { id: number; label: string }[]; selected: number[]; toggle: (id: number) => void; manage?: string }) {
  return (
    <fieldset className="mb-5">
      <legend className="mb-1.5 text-base">{legend}</legend>
      {items.map((i) => (
        <label key={i.id} className="flex min-h-11 items-center gap-3">
          <input type="checkbox" name={name} checked={selected.includes(i.id)} onChange={() => toggle(i.id)} className="size-5 accent-gold" />
          {i.label}
        </label>
      ))}
      {manage && (
        <Link href={manage} className="inline-flex min-h-11 items-center text-gold underline underline-offset-4">
          Gestisci
        </Link>
      )}
    </fieldset>
  );
}

/** Creazione (`season` assente) e modifica di una bozza. */
export function SeasonForm({ cineforumId, categories, awards, members, season, onDone }: { cineforumId: string; categories: Item[]; awards: Item[]; members: Member[]; season?: SeasonView; onDone?: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(season?.name ?? "");
  const [description, setDescription] = useState(season?.description ?? "");
  const [closeAt, setCloseAt] = useState(season ? isoToRomeLocal(season.candidaturesCloseAt) : "");
  const [finalAt, setFinalAt] = useState(season?.finalNightAt ? isoToRomeLocal(season.finalNightAt) : "");
  const [cats, setCats] = useState(season?.categories.map((c) => c.id) ?? []);
  const [aws, setAws] = useState(season?.awards.map((a) => a.id) ?? []);
  const [users, setUsers] = useState(season ? season.participants.map((p) => p.userId) : members.map((m) => m.userId));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const toggle = (set: (f: (a: number[]) => number[]) => void) => (id: number) => set((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const body = {
      name: name.trim(),
      description: description.trim() || undefined,
      candidaturesCloseAt: romeLocalToIso(closeAt),
      finalNightAt: finalAt ? romeLocalToIso(finalAt) : undefined,
      categoryIds: cats,
      awardIds: aws,
      participantUserIds: users,
    };
    try {
      if (season) {
        await api(`/cineforums/${cineforumId}/seasons/${season.id}`, { method: "PATCH", body });
        router.refresh();
        onDone?.();
      } else {
        const s = await api<{ id: number }>(`/cineforums/${cineforumId}/seasons`, { method: "POST", body });
        router.push(`/cineforums/${cineforumId}/seasons/${s.id}`);
        router.refresh();
      }
    } catch (err) {
      setError((err as ApiError).message);
      setPending(false);
    }
  }

  const settings = `/cineforums/${cineforumId}/settings`;
  return (
    <form onSubmit={submit}>
      {error && <Notice tone="error">{error}</Notice>}
      <Field label="Nome" required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
      <Field label="Descrizione" textarea maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} />
      <Field label="Chiusura candidature" type="datetime-local" required value={closeAt} onChange={(e) => setCloseAt(e.target.value)} hint="Ora di Roma" />
      <Field label="Serata finale (facoltativa)" type="datetime-local" value={finalAt} onChange={(e) => setFinalAt(e.target.value)} hint="Ora di Roma" />
      <Checks legend="Categorie" name="category" items={categories.map((c) => ({ id: c.id, label: c.name }))} selected={cats} toggle={toggle(setCats)} manage={settings} />
      <Checks legend="Premi" name="award" items={awards.map((a) => ({ id: a.id, label: a.name }))} selected={aws} toggle={toggle(setAws)} manage={settings} />
      <Checks legend="Partecipanti" name="participant" items={members.map((m) => ({ id: m.userId, label: m.username }))} selected={users} toggle={toggle(setUsers)} />
      <div className="flex items-center gap-4">
        <Button type="submit" pending={pending} pendingLabel="Salvataggio…" className="flex-1">
          {season ? "Salva" : "Crea la bozza"}
        </Button>
        {onDone && (
          <Button variant="secondary" disabled={pending} onClick={onDone}>
            Annulla
          </Button>
        )}
      </div>
    </form>
  );
}
