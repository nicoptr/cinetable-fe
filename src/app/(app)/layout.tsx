import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Curtain } from "@/components/Curtain";
import { apiServer } from "@/lib/api-server";
import type { Me, MyInvitation } from "@/lib/types";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Best effort: un 401 porta al login (redirect di apiServer), ogni altro errore nasconde solo il conteggio. */
async function pendingInvites(): Promise<number> {
  try {
    return (await apiServer<MyInvitation[]>("/invitations/mine")).length;
  } catch (e) {
    unstable_rethrow(e);
    return 0;
  }
}

/** Best effort come sopra: senza utente il menu mostra solo l'icona. */
async function me(): Promise<Me | null> {
  try {
    return await apiServer<Me>("/auth/me");
  } catch (e) {
    unstable_rethrow(e);
    return null;
  }
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const [pending, user] = await Promise.all([pendingInvites(), me()]);
  return (
    <>
      <AppHeader pending={pending} user={user} />
      {children}
      <Curtain />
    </>
  );
}
