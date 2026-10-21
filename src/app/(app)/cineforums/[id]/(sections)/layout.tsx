import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { apiServer } from "@/lib/api-server";
import type { CineforumDetail } from "@/lib/types";
import { SectionNav } from "./SectionNav";

export default async function CineforumLayout({ children, params }: { children: ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const c = await apiServer<CineforumDetail>(`/cineforums/${id}`);
  return (
    <div data-wide className="md:grid md:grid-cols-[200px_minmax(0,1fr)] md:items-start md:gap-8">
      {/* su mobile i figli stanno nel flusso della pagina, così i tab restano sticky fino in fondo */}
      <div className="contents md:sticky md:top-6 md:block">
        <Link href="/cineforums" className="inline-flex min-h-11 items-center text-sm text-muted hover:text-gold md:min-h-0">
          I miei cineforum
        </Link>
        <h1 className="font-serif text-3xl leading-tight md:text-2xl">{c.name}</h1>
        {c.description && <p className="mt-1 text-muted">{c.description}</p>}
        <SectionNav id={id} />
      </div>
      <div className="min-w-0 md:max-w-[640px]">{children}</div>
    </div>
  );
}
