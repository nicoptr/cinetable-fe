"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button, Field, Notice } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

function useSubmit(run: () => Promise<void>, done: string) {
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, setPending] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setOk(false);
    try {
      await run();
      setOk(true);
    } catch (err) {
      setError((err as ApiError).message);
    }
    setPending(false);
  }
  const notice = error ? <Notice tone="error">{error}</Notice> : ok ? <Notice tone="success">{done}</Notice> : null;
  return { submit, pending, notice };
}

export function ProfileForm({ username: u, avatarUrl: a }: { username: string; avatarUrl: string }) {
  const router = useRouter();
  const [username, setUsername] = useState(u);
  const [avatarUrl, setAvatarUrl] = useState(a);
  const [saved, setSaved] = useState(a);
  const [preview, setPreview] = useState(a.startsWith("https://") ? a : "");
  const [broken, setBroken] = useState<string | null>(null);
  // l'anteprima parte dopo una pausa o al blur, non a ogni tasto
  useEffect(() => {
    const t = setTimeout(() => setPreview(avatarUrl.startsWith("https://") ? avatarUrl : ""), 600);
    return () => clearTimeout(t);
  }, [avatarUrl]);
  const { submit, pending, notice } = useSubmit(
    async () => {
      await api("/users/me", { quiet: true, method: "PATCH", body: { username: username.trim(), avatarUrl: avatarUrl.trim() || null } });
      setSaved(avatarUrl);
      router.refresh(); // nome e avatar nel menu
    },
    "Profilo aggiornato",
  );
  const previewBroken = !!preview && broken === preview;
  const unsaved = !!preview && !previewBroken && avatarUrl.trim() !== saved.trim();
  return (
    <form onSubmit={submit}>
      {notice}
      <Field label="Nome utente" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} />
      <Field
        label="Avatar (URL https)"
        type="url"
        pattern="https://.*"
        value={avatarUrl}
        onChange={(e) => setAvatarUrl(e.target.value)}
        onBlur={() => setPreview(avatarUrl.startsWith("https://") ? avatarUrl : "")}
        hint={unsaved ? "Questa è solo l'anteprima: salva il profilo per usarla." : undefined}
        error={previewBroken ? "Questo link non apre un'immagine. Serve l'indirizzo dell'immagine stessa: tasto destro sulla foto, poi \"Copia indirizzo immagine\"." : undefined}
      />
      {preview && !previewBroken && (
        // eslint-disable-next-line @next/next/no-img-element -- anteprima di un URL esterno arbitrario
        <img
          src={preview}
          alt="Anteprima avatar"
          // un errore arrivato prima dell'idratazione non passa da onError: lo si legge dall'immagine
          ref={(img) => {
            if (img?.complete && img.naturalWidth === 0) setBroken(preview);
          }}
          onError={() => setBroken(preview)}
          className="mb-5 size-16 rounded-full border border-line object-cover"
        />
      )}
      <Button type="submit" pending={pending} pendingLabel="Salvataggio…" disabled={previewBroken} className="w-full">
        Salva il profilo
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const { submit, pending, notice } = useSubmit(async () => {
    await api("/users/me/password", { quiet: true, method: "PATCH", body: { currentPassword: current, newPassword: next } });
    setCurrent("");
    setNext("");
  }, "Password aggiornata");
  return (
    <form onSubmit={submit}>
      {notice}
      <Field label="Password attuale" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
      <Field label="Nuova password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} hint="Almeno 8 caratteri" value={next} onChange={(e) => setNext(e.target.value)} />
      <Button type="submit" pending={pending} pendingLabel="Salvataggio…" className="w-full">
        Cambia la password
      </Button>
    </form>
  );
}
