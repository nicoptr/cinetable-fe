"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, ConfirmButton, Field, Notice } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { InvitationView } from "@/lib/types";

const STATUS: Record<InvitationView["status"], string> = {
  PENDING: "In attesa",
  ACCEPTED: "Accettato",
  DECLINED: "Rifiutato",
  REVOKED: "Revocato",
  EXPIRED: "Scaduto",
};

export function Invitations({ cineforumId, initial }: { cineforumId: string; initial: InvitationView[] }) {
  const router = useRouter();
  const base = `/cineforums/${cineforumId}/invitations`;
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      router.refresh();
      return true;
    } catch (err) {
      setError((err as ApiError).message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function invite(e: FormEvent) {
    e.preventDefault();
    const emails = text.split(/[\s,;]+/).filter(Boolean);
    if (emails.length === 0) return setError("Inserisci almeno un'email");
    if (await run(() => api(base, { method: "POST", body: { emails } }))) setText("");
  }

  return (
    <>
      <h2 className="mb-3 font-serif text-2xl">Inviti</h2>
      {error && <Notice tone="error">{error}</Notice>}
      <form onSubmit={invite}>
        <Field textarea label="Invita per email" hint="Una o più email, separate da virgole, spazi o a capo" value={text} onChange={(e) => setText(e.target.value)} />
        <Button type="submit" pending={busy} disabled={busy}>
          Invita
        </Button>
      </form>
      <ul className="mt-6">
        {initial.map((i) => (
          <li key={i.id} className="border-t border-line py-3 first:border-t-0">
            <p className="break-all">{i.email}</p>
            <p className="text-muted">
              {STATUS[i.status]}
              {i.status === "PENDING" && ` · scade il ${formatDate(i.expiresAt)}`}
            </p>
            {(i.status === "PENDING" || i.status === "EXPIRED") && (
              <div className="flex items-center gap-6">
                <Button variant="secondary" disabled={busy} onClick={() => run(() => api(`${base}/${i.id}/resend`, { method: "POST" }))}>
                  Rimanda
                </Button>
                {i.status === "PENDING" && (
                  <ConfirmButton variant="secondary" disabled={busy} onConfirm={() => run(() => api(`${base}/${i.id}`, { method: "DELETE" }))}>
                    Revoca
                  </ConfirmButton>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
