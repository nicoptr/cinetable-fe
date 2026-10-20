import { notFound } from "next/navigation";
import { PageTitle } from "@/components/ui";
import { apiServer } from "@/lib/api-server";
import type { Award, Category, CineforumDetail } from "@/lib/types";
import { ItemEditor } from "./ItemEditor";

export default async function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const c = await apiServer<CineforumDetail>(`/cineforums/${id}`);
  if (c.myRole !== "PRESIDENT") notFound();
  const [categories, awards] = await Promise.all([
    apiServer<Category[]>(`/cineforums/${id}/categories`),
    apiServer<Award[]>(`/cineforums/${id}/awards`),
  ]);
  return (
    <>
      <PageTitle>Impostazioni</PageTitle>
      <ItemEditor
        title="Categorie"
        path={`/cineforums/${id}/categories`}
        items={categories.map((x) => ({ id: x.id, name: x.name, extra: x.description ?? "" }))}
        nameLabel="Nome della categoria"
        extraLabel="Descrizione"
        extraKey="description"
        addLabel="Aggiungi categoria"
      />
      <ItemEditor
        title="Premi"
        path={`/cineforums/${id}/awards`}
        items={awards.map((x) => ({ id: x.id, name: x.name, extra: x.question }))}
        nameLabel="Nome del premio"
        extraLabel="Domanda di voto"
        extraKey="question"
        addLabel="Aggiungi premio"
      />
    </>
  );
}
