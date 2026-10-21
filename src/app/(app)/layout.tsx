import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { apiServer } from "@/lib/api-server";
import type { MyInvitation } from "@/lib/types";

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

export default async function AppLayout({ children }: { children: ReactNode }) {
  const pending = await pendingInvites();
  return (
    <>
      <AppHeader pending={pending} />
      {children}
    </>
  );
}
