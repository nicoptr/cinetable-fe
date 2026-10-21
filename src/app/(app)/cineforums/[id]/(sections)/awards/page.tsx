import { notFound } from "next/navigation";
import { Section } from "@/components/ui";
import { apiServer } from "@/lib/api-server";
import type { Award, CineforumDetail } from "@/lib/types";
import { ItemEditor, ItemList } from "../_ItemEditor";

export default async function AwardsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const path = `/cineforums/${id}/awards`;
  const [c, awards] = await Promise.all([apiServer<CineforumDetail>(`/cineforums/${id}`), apiServer<Award[]>(path)]);
  const items = awards.map((x) => ({ id: x.id, name: x.name, extra: x.question }));
  return (
    <Section title={`Premi · ${items.length}`}>
      {c.myRole === "PRESIDENT" ? (
        <ItemEditor
          path={path}
          items={items}
          nameLabel="Nome del premio"
          extraLabel="Domanda di voto"
          extraKey="question"
          newLabel="Nuovo premio"
          addedLabel="Premio aggiunto"
        />
      ) : (
        <ItemList items={items} />
      )}
    </Section>
  );
}
