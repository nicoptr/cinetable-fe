"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Notice, PageTitle } from "@/components/ui";
import { api } from "@/lib/api";

export function VerifyEmail({ token }: { token: string }) {
  const [state, setState] = useState<"loading" | "ok" | { error: string }>("loading");
  const started = useRef(false); // il token è monouso: una sola chiamata anche con StrictMode

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    api("/auth/verify-email", { quiet: true, method: "POST", body: { token } })
      .then(() => {
        setState("ok");
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- ricarica piena: il server deve vedere il cookie
        setTimeout(() => window.location.assign("/cineforums"), 1200);
      })
      .catch((e) => setState({ error: e.message }));
  }, [token]);

  if (state === "ok") {
    return (
      <>
        <PageTitle>Email confermata</PageTitle>
        <p>Ti stiamo portando ai tuoi cineforum…</p>
      </>
    );
  }
  if (state === "loading") return <p role="status">Verifica in corso…</p>;
  return (
    <>
      <PageTitle>Conferma non riuscita</PageTitle>
      <Notice tone="error">{state.error}</Notice>
      <p>
        <Link href="/login" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-gold">
          Accedi per rimandare l&apos;email di conferma
        </Link>
      </p>
    </>
  );
}
