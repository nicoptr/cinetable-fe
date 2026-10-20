import { notFound } from "next/navigation";
import { PageTitle } from "@/components/ui";
import { apiServer } from "@/lib/api-server";
import type { CineforumDetail } from "@/lib/types";

export default async function CineforumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const c = await apiServer<CineforumDetail>(`/cineforums/${encodeURIComponent(id)}`);
  return (
    <>
      <PageTitle>{c.name}</PageTitle>
      {c.description && <p className="text-muted">{c.description}</p>}
    </>
  );
}
