"use client";

import { useState, type ReactNode } from "react";
import { Envelope } from "@/components/Envelope";
import { Button } from "@/components/ui";

/**
 * Un risultato già svelato: si vede aperto, si può richiudere nella sua busta e riaprire per rivedere `replay`.
 * Solo in questa pagina e senza server: ricaricando torna aperto.
 */
export function Replayable({ label, replay, children }: { label: string; replay: ReactNode; children: ReactNode }) {
  const [closed, setClosed] = useState(false);
  if (closed) return <Envelope label={label} closeLabel="Richiudi la busta" onOpen={async () => replay} />;
  return (
    <>
      {children}
      <div className="mt-3 text-center print:hidden">
        <Button variant="secondary" onClick={() => setClosed(true)}>
          Richiudi la busta
        </Button>
      </div>
    </>
  );
}
