"use client";

import { useState } from "react";
import { Button, Notice } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { MyInvitation } from "@/lib/types";

export function InvitationList({ initial }: { initial: MyInvitation[] }) {
  const list = initial;
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(i: MyInvitation, action: "accept" | "decline") {
    setBusy(i.id);
    setError(null);
    try {
      const r = await api<{ cineforumId: number } | undefined>(`/invitations/${i.id}/${action}`, { method: "POST" });
      // ricarica piena: il menu e l'elenco dei cineforum devono rileggere i dati
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      if (action === "accept" && r) window.location.assign(`/cineforums/${r.cineforumId}`);
      else window.location.reload();
    } catch (err) {
      setError((err as ApiError).message);
      setBusy(null);
    }
  }

  if (list.length === 0) return <p className="text-muted">Nessun invito in attesa.</p>;
  return (
    <>
      {error && <Notice tone="error">{error}</Notice>}
      <ul>
        {list.map((i) => (
          <li key={i.id} className="border-t border-line py-4 first:border-t-0">
            <h2 className="font-serif text-xl">{i.cineforumName}</h2>
            <p className="text-muted">
              Ti invita {i.invitedBy} · scade il {formatDate(i.expiresAt)}
            </p>
            <div className="mt-3 flex items-center gap-6">
              <Button pending={busy === i.id} onClick={() => act(i, "accept")}>
                Accetta
              </Button>
              <Button variant="secondary" disabled={busy === i.id} onClick={() => act(i, "decline")}>
                Rifiuta
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
