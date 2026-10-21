import { notFound } from "next/navigation";
import { Section } from "@/components/ui";
import { apiServer } from "@/lib/api-server";
import type { Category, CineforumDetail } from "@/lib/types";
import { ItemEditor, ItemList } from "../_ItemEditor";

export default async function CategoriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const path = `/cineforums/${id}/categories`;
  const [c, categories] = await Promise.all([apiServer<CineforumDetail>(`/cineforums/${id}`), apiServer<Category[]>(path)]);
  const items = categories.map((x) => ({ id: x.id, name: x.name, extra: x.description ?? "" }));
  return (
    <Section title={`Categorie · ${items.length}`}>
      {c.myRole === "PRESIDENT" ? (
        <ItemEditor
          path={path}
          items={items}
          nameLabel="Nome della categoria"
          extraLabel="Descrizione"
          extraKey="description"
          newLabel="Nuova categoria"
          addedLabel="Categoria aggiunta"
        />
      ) : (
        <ItemList items={items} />
      )}
    </Section>
  );
}
