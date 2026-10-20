import Link from "next/link";
import { PageTitle } from "@/components/ui";
import { apiServer } from "@/lib/api-server";
import type { CineforumItem } from "@/lib/types";
import { CreateCineforumForm } from "./CreateCineforumForm";

export const metadata = { title: "I miei cineforum" };

export default async function CineforumsPage() {
  const list = await apiServer<CineforumItem[]>("/cineforums");
  return (
    <>
      <PageTitle>I miei cineforum</PageTitle>
      {list.length === 0 ? (
        <p className="mb-8 text-muted">Non fai ancora parte di nessun cineforum: creane uno qui sotto oppure aspetta un invito.</p>
      ) : (
        <ul className="mb-8">
          {list.map((c) => (
            <li key={c.id} className="border-t border-line first:border-t-0">
              <Link href={`/cineforums/${c.id}`} className="flex min-h-11 items-center justify-between gap-3 py-3 hover:text-gold">
                <span className="font-serif text-xl">{c.name}</span>
                <span className="text-sm text-muted">{c.role === "PRESIDENT" ? "Presidente" : "Membro"}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <h2 className="mb-4 font-serif text-2xl">Crea un cineforum</h2>
      <CreateCineforumForm />
    </>
  );
}
