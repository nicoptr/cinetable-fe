"use client";

import { useState, type FormEvent } from "react";
import { Button, Field, Notice } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

export function CreateCineforumForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const c = await api<{ id: number }>("/cineforums", { method: "POST", body: { name: name.trim(), description: description.trim() || undefined } });
      // ricarica piena: l'elenco e il menu si rileggono dal server
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/cineforums/${c.id}`);
    } catch (err) {
      setError((err as ApiError).message);
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit}>
      {error && <Notice tone="error">{error}</Notice>}
      <Field label="Nome" required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
      <Field label="Descrizione" textarea maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} />
      <Button type="submit" pending={pending} pendingLabel="Creazione…" className="w-full">
        Crea il cineforum
      </Button>
    </form>
  );
}
