"use client";

import { useState, type FormEvent } from "react";
import { Button, Field, Notice, PageTitle } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

type Membership = { cineforumId: number }[];

export function SignupForm({ invite }: { invite: { token: string; email: string } | null }) {
  const [email, setEmail] = useState(invite?.email ?? "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await api("/auth/register", { method: "POST", body: { email: email.trim(), username: username.trim(), password, inviteToken: invite?.token } });
      if (invite) {
        // già verificato e con la sessione aperta: si entra nel cineforum dell'invito
        const me = await api<{ memberships: Membership }>("/auth/me");
        window.location.assign(me.memberships.length === 1 ? `/cineforums/${me.memberships[0].cineforumId}` : "/cineforums");
        return;
      }
      setDone(true);
    } catch (err) {
      setError(err as ApiError);
      setPending(false);
    }
  }

  if (done) {
    return (
      <>
        <PageTitle>Controlla la tua email</PageTitle>
        <p>
          Ti abbiamo scritto a <strong>{email}</strong>: apri il link che trovi nel messaggio per confermare l&apos;account.
        </p>
      </>
    );
  }

  return (
    <form onSubmit={submit}>
      {error && <Notice tone="error">{error.message}</Notice>}
      <Field label="Email" type="email" autoComplete="email" required readOnly={!!invite} value={email} onChange={(e) => setEmail(e.target.value)} />
      <Field
        label="Nome utente"
        hint="lettere, numeri, punto, trattino, trattino basso"
        autoComplete="username"
        required
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <Field label="Password" type="password" hint="Almeno 8 caratteri" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button type="submit" pending={pending} pendingLabel="Creazione…" className="w-full">
        Crea l&apos;account
      </Button>
    </form>
  );
}
