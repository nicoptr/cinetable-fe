"use client";

import { useState, type FormEvent } from "react";
import { Button, Field, Notice } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

export function LoginForm({ next }: { next: string }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setResent(false);
    try {
      await api("/auth/login", { quiet: true, method: "POST", body: { usernameOrEmail: identifier.trim(), password } });
      // ricarica piena: il server deve vedere il cookie appena impostato
      window.location.assign(next);
    } catch (err) {
      setError(err as ApiError);
      setPending(false);
    }
  }

  async function resend() {
    setResending(true);
    try {
      await api("/auth/resend-verification", { quiet: true, method: "POST", body: { email: identifier.includes("@") ? identifier.trim() : email.trim() } });
      setResent(true);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setResending(false);
    }
  }

  const unverified = error?.code === "EMAIL_NOT_VERIFIED";
  return (
    <form onSubmit={submit}>
      {error && <Notice tone="error">{error.message}</Notice>}
      {resent && <Notice tone="success">L&apos;email di conferma è stata rimandata: controlla la posta.</Notice>}
      {unverified && (
        <div className="mb-5">
          {!identifier.includes("@") && <Field label="La tua email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
          <Button variant="secondary" type="button" pending={resending} onClick={resend}>
            Rimanda l&apos;email di conferma
          </Button>
        </div>
      )}
      <Field label="Email o nome utente" autoComplete="username" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
      <Field label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button type="submit" pending={pending} pendingLabel="Accesso…" className="w-full">
        Accedi
      </Button>
    </form>
  );
}
