import { PageTitle } from "@/components/ui";
import { apiServer } from "@/lib/api-server";
import type { MyInvitation } from "@/lib/types";
import { InvitationList } from "./InvitationList";

export const metadata = { title: "Inviti" };

export default async function InvitationsPage() {
  const list = await apiServer<MyInvitation[]>("/invitations/mine");
  return (
    <>
      <PageTitle>Inviti</PageTitle>
      <InvitationList initial={list} />
    </>
  );
}
