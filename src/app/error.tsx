"use client";

import { useEffect } from "react";
import { Button, PageTitle } from "@/components/ui";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <>
      <PageTitle>Qualcosa è andato storto</PageTitle>
      <p className="mb-6 text-muted">Non siamo riusciti a caricare la pagina. Riprova tra un attimo.</p>
      <Button onClick={() => retry()}>Riprova</Button>
    </>
  );
}
