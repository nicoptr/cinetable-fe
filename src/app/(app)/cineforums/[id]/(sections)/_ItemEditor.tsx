"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, ConfirmButton, Field, Notice } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

type Item = { id: number; name: string; extra: string };
type Props = {
  path: string;
  items: Item[];
  nameLabel: string;
  extraLabel: string;
  extraKey: "description" | "question";
  /** titolo del form di aggiunta, es. "Nuova categoria" */
  newLabel: string;
  /** conferma dopo l'aggiunta, es. "Categoria aggiunta" */
  addedLabel: string;
};

/** Elenco con aggiungi, modifica in linea ed elimina, per il presidente. */
export function ItemEditor({ path, items, nameLabel, extraLabel, extraKey, newLabel, addedLabel }: Props) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  // dopo Annulla o Salva il fuoco torna su "+ Nuova …"
  const refocus = useRef(false);
  const addButton = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (adding || !refocus.current) return;
    refocus.current = false;
    addButton.current?.querySelector("button")?.focus();
  }, [adding]);
  const [added, setAdded] = useState(false);
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
    setAdded(false);
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
    if (await run(0, () => api(path, { quiet: true, method: "POST", body }))) {
      closeAdd();
      setAdded(true);
    }
  }

  function closeAdd(focus = true) {
    refocus.current = focus;
    setAdding(false);
    setName("");
    setExtra("");
  }

  async function save(i: Item) {
    if (await run(i.id, () => api(`${path}/${i.id}`, { quiet: true, method: "PATCH", body: { name: draft.name, [extraKey]: draft.extra } }))) setEditing(null);
  }

  const err = (row: number) => (error?.row === row ? error.message : null);

  return (
    <>
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
                    setAdded(false);
                    closeAdd(false);
                    setEditing(i.id);
                    setDraft({ name: i.name, extra: i.extra });
                  }}
                >
                  Modifica
                </Button>
                <ConfirmButton
                  variant="danger"
                  disabled={busy}
                  aria-label={`Elimina ${i.name}`}
                  armedAriaLabel={`Tocca di nuovo per confermare l'eliminazione di ${i.name}`}
                  onConfirm={() => run(i.id, () => api(`${path}/${i.id}`, { quiet: true, method: "DELETE" }))}>
                  Elimina
                </ConfirmButton>
              </div>
            </li>
          ),
        )}
      </ul>
      {added && <Notice tone="success">{addedLabel}</Notice>}
      {adding ? (
        <form onSubmit={add} className="border-t border-line pt-4">
          <h3 className="mb-3 font-serif text-xl">{newLabel}</h3>
          <Field label={nameLabel} autoFocus value={name} error={err(0)} onChange={(e) => setName(e.target.value)} />
          <Field label={extraLabel} textarea value={extra} onChange={(e) => setExtra(e.target.value)} />
          <div className="flex items-center gap-6">
            <Button type="submit" pending={busy} pendingLabel="Salvataggio…">
              Salva
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => closeAdd()}>
              Annulla
            </Button>
          </div>
        </form>
      ) : (
        <div ref={addButton}>
          <Button
            disabled={busy}
            className="w-full"
            onClick={() => {
              setError(null);
              setAdded(false);
              setEditing(null);
              setAdding(true);
            }}
          >
            + {newLabel}
          </Button>
        </div>
      )}
    </>
  );
}

/** Lo stesso elenco in sola lettura, per i membri. */
export function ItemList({ items }: { items: Item[] }) {
  return (
    <ul>
      {items.map((i) => (
        <li key={i.id} className="border-t border-line py-3 first:border-t-0">
          <p className="font-serif text-lg">{i.name}</p>
          {i.extra && <p className="text-muted">{i.extra}</p>}
        </li>
      ))}
    </ul>
  );
}
