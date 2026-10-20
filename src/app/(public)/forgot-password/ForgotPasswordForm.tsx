"use client";

import { useState, type FormEvent } from "react";
import { Button, Field, Notice } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await api("/auth/forgot-password", { method: "POST", body: { email: email.trim() } });
      setDone(true);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setPending(false);
    }
  }

  if (done) return <Notice tone="success">Se l&apos;indirizzo è registrato, ti abbiamo scritto.</Notice>;
  return (
    <form onSubmit={submit}>
      {error && <Notice tone="error">{error.message}</Notice>}
      <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Button type="submit" pending={pending} pendingLabel="Invio…" className="w-full">
        Invia il link
      </Button>
    </form>
  );
}
