"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button, Field, Notice } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [mismatch, setMismatch] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMismatch(password !== again);
    if (password !== again) return;
    setPending(true);
    try {
      await api("/auth/reset-password", { method: "POST", body: { token, password } });
      setDone(true);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <>
        <Notice tone="success">Password aggiornata.</Notice>
        <Link href="/login" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-gold">
          Accedi
        </Link>
      </>
    );
  }
  return (
    <form onSubmit={submit}>
      {error && <Notice tone="error">{error.message}</Notice>}
      <Field label="Nuova password" type="password" hint="Almeno 8 caratteri" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
      <Field
        label="Ripeti la nuova password"
        type="password"
        autoComplete="new-password"
        required
        error={mismatch ? "Le password non coincidono" : null}
        value={again}
        onChange={(e) => setAgain(e.target.value)}
      />
      <Button type="submit" pending={pending} pendingLabel="Salvataggio…" className="w-full">
        Aggiorna la password
      </Button>
    </form>
  );
}
