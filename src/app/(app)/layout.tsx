import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { apiServer } from "@/lib/api-server";
import type { MyInvitation } from "@/lib/types";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AppLayout({ children }: { children: ReactNode }) {
  const pending = (await apiServer<MyInvitation[]>("/invitations/mine")).length;
  return (
    <>
      <AppHeader pending={pending} />
      {children}
    </>
  );
}
