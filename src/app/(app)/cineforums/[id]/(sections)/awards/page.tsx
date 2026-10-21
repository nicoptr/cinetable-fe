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
  const president = c.myRole === "PRESIDENT";
  if (!president && items.length === 0) return <p className="text-muted">Nessun award.</p>;
  return (
    <Section title={`Award · ${items.length}`}>
      {president ? (
        <ItemEditor
          path={path}
          items={items}
          nameLabel="Nome dell'award"
          extraLabel="Domanda di voto"
          extraKey="question"
          newLabel="Nuovo award"
          addedLabel="Award aggiunto"
        />
      ) : (
        <ItemList items={items} />
      )}
    </Section>
  );
}
