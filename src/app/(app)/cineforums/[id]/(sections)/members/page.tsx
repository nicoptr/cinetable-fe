import { notFound } from "next/navigation";
import { Avatar, Section } from "@/components/ui";
import { apiServer } from "@/lib/api-server";
import type { CineforumDetail, InvitationView } from "@/lib/types";
import { Invitations } from "./Invitations";

export default async function MembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const c = await apiServer<CineforumDetail>(`/cineforums/${id}`);
  const president = c.myRole === "PRESIDENT";
  const invitations = president ? await apiServer<InvitationView[]>(`/cineforums/${id}/invitations`) : [];
  return (
    <>
      <Section title={`Membri · ${c.members.length}`}>
        <ul>
          {c.members.map((m) => (
            <li key={m.userId} className="flex min-h-11 items-center justify-between border-t border-line py-2 first:border-t-0">
              <span className="flex items-center gap-3">
                <Avatar name={m.username} url={m.avatarUrl} size={32} />
                {m.username}
              </span>
              <span className="text-muted">{m.role === "PRESIDENT" ? "Presidente" : "Membro"}</span>
            </li>
          ))}
        </ul>
      </Section>
      {president && (
        <Section title="Inviti">
          <Invitations cineforumId={id} initial={invitations} />
        </Section>
      )}
    </>
  );
}
