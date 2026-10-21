"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, ConfirmButton, Field } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

type Item = { id: number; name: string; extra: string };
type Props = { title: string; path: string; items: Item[]; nameLabel: string; extraLabel: string; extraKey: "description" | "question"; addLabel: string };

/** Elenco con aggiungi, modifica in linea ed elimina: serve sia alle categorie sia ai premi. */
export function ItemEditor({ title, path, items, nameLabel, extraLabel, extraKey, addLabel }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [extra, setExtra] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState({ name: "", extra: "" });
  const [busy, setBusy] = useState(false);
  // errore legato a una riga (id) oppure al form di aggiunta (0)
  const [error, setError] = useState<{ row: number; message: string } | null>(null);

  async function run(row: number, fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      router.refresh();
      return true;
    } catch (err) {
      setError({ row, message: (err as ApiError).message });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function add(e: FormEvent) {
    e.preventDefault();
    const body = { name, ...(extra.trim() || extraKey === "question" ? { [extraKey]: extra } : {}) };
    if (await run(0, () => api(path, { method: "POST", body }))) {
      setName("");
      setExtra("");
    }
  }

  async function save(i: Item) {
    if (await run(i.id, () => api(`${path}/${i.id}`, { method: "PATCH", body: { name: draft.name, [extraKey]: draft.extra } }))) setEditing(null);
  }

  const err = (row: number) => (error?.row === row ? error.message : null);

  return (
    <section className="mb-10">
      <h2 className="mb-3 font-serif text-2xl">{title}</h2>
      <ul className="mb-6">
        {items.map((i) =>
          editing === i.id ? (
            <li key={i.id} className="border-t border-line py-3 first:border-t-0">
              <Field label={nameLabel} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              <Field label={extraLabel} textarea value={draft.extra} error={err(i.id)} onChange={(e) => setDraft({ ...draft, extra: e.target.value })} />
              <div className="flex items-center gap-6">
                <Button pending={busy} disabled={busy} onClick={() => save(i)}>
                  Salva
                </Button>
                <Button variant="secondary" disabled={busy} onClick={() => setEditing(null)}>
                  Annulla
                </Button>
              </div>
            </li>
          ) : (
            <li key={i.id} className="border-t border-line py-3 first:border-t-0">
              <p className="font-serif text-lg">{i.name}</p>
              {i.extra && <p className="text-muted">{i.extra}</p>}
              {err(i.id) && (
                <p role="alert" className="text-error">
                  {err(i.id)}
                </p>
              )}
              <div className="flex items-center gap-6">
                <Button
                  variant="secondary"
                  disabled={busy}
                  aria-label={`Modifica ${i.name}`}
                  onClick={() => {
                    setError(null);
                    setEditing(i.id);
                    setDraft({ name: i.name, extra: i.extra });
                  }}
                >
                  Modifica
                </Button>
                <ConfirmButton variant="danger" disabled={busy} onConfirm={() => run(i.id, () => api(`${path}/${i.id}`, { method: "DELETE" }))}>
                  Elimina
                </ConfirmButton>
              </div>
            </li>
          ),
        )}
      </ul>
      <form onSubmit={add}>
        <Field label={nameLabel} value={name} onChange={(e) => setName(e.target.value)} />
        <Field label={extraLabel} textarea value={extra} onChange={(e) => setExtra(e.target.value)} />
        <Button type="submit" pending={busy} disabled={busy} className="w-full">
          {addLabel}
        </Button>
        {err(0) && (
          <p role="alert" className="mt-2 text-error">
            {err(0)}
          </p>
        )}
      </form>
    </section>
  );
}
