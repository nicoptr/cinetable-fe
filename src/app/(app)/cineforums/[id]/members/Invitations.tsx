"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, ConfirmButton, Field } from "@/components/ui";
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
  // row 0 = modulo di invito, altrimenti id dell'invito
  const [msg, setMsg] = useState<{ row: number; tone: "error" | "success"; text: string } | null>(null);

  async function run<T>(row: number, fn: () => Promise<T>): Promise<T | undefined> {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fn();
      router.refresh();
      return r;
    } catch (err) {
      setMsg({ row, tone: "error", text: (err as ApiError).message });
    } finally {
      setBusy(false);
    }
  }

  async function invite(e: FormEvent) {
    e.preventDefault();
    const emails = text.split(/[\s,;]+/).filter(Boolean);
    if (emails.length === 0) return setMsg({ row: 0, tone: "error", text: "Inserisci almeno un'email" });
    const sent = await run(0, () => api<InvitationView[]>(base, { method: "POST", body: { emails } }));
    if (!sent) return;
    setText("");
    const distinct = new Set(emails.map((x) => x.toLowerCase())).size;
    setMsg({ row: 0, tone: "success", text: `Inviti inviati: ${sent.length}${sent.length < distinct ? ". Alcuni indirizzi erano già membri o già invitati" : ""}` });
  }

  async function resend(i: InvitationView) {
    if (await run(i.id, () => api(`${base}/${i.id}/resend`, { method: "POST" }))) setMsg({ row: i.id, tone: "success", text: "Invito rimandato" });
  }

  const note = (row: number) =>
    msg?.row === row && (
      <p role={msg.tone === "error" ? "alert" : "status"} className={msg.tone === "error" ? "text-error" : "text-success"}>
        {msg.text}
      </p>
    );

  return (
    <>
      <h2 className="mb-3 font-serif text-2xl">Inviti</h2>
      <form onSubmit={invite}>
        <Field textarea label="Invita per email" hint="Una o più email, separate da virgole, spazi o a capo" value={text} onChange={(e) => setText(e.target.value)} />
        <Button type="submit" pending={busy} disabled={busy} className="w-full">
          Invita
        </Button>
        {note(0)}
      </form>
      <ul className="mt-6">
        {initial.map((i) => (
          <li key={i.id} className="border-t border-line py-3 first:border-t-0">
            <p className="break-all">{i.email}</p>
            <p className="text-muted">
              {STATUS[i.status]}
              {i.status === "PENDING" && ` · scade il ${formatDate(i.expiresAt)}`}
            </p>
            {note(i.id)}
            {(i.status === "PENDING" || i.status === "EXPIRED") && (
              <div className="flex items-center gap-6">
                <Button variant="secondary" disabled={busy} onClick={() => resend(i)}>
                  Rimanda
                </Button>
                <ConfirmButton variant="danger" disabled={busy} onConfirm={() => run(i.id, () => api(`${base}/${i.id}`, { method: "DELETE" }))}>
                  Revoca
                </ConfirmButton>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
