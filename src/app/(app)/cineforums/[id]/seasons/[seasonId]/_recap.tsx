import { Avatar, Section } from "@/components/ui";
import type { SeasonView } from "@/lib/types";

/** Chi gioca e con cosa, per tutti i membri. Partecipanti e categorie restano elenchi separati: chi ha quale categoria è segreto. */
export function SeasonRecap({ season }: { season: SeasonView }) {
  return (
    <Section title="L'edizione" aria-label="L'edizione" className="mt-8">
      <h3 className="mt-3 text-sm text-muted">Partecipanti · {season.participants.length}</h3>
      <ul className="flex flex-wrap gap-x-4">
        {season.participants.map((p) => (
          <li key={p.userId} className="flex min-h-11 items-center gap-2">
            <Avatar name={p.username} url={p.avatarUrl} />
            {p.username}
          </li>
        ))}
      </ul>
      <h3 className="mt-3 border-t border-line pt-3 text-sm text-muted">Categorie · {season.categories.length}</h3>
      <ul>
        {season.categories.map((c) => (
          <li key={c.id} className="py-1">
            {c.name}
            {c.description && <span className="block text-sm text-muted">{c.description}</span>}
          </li>
        ))}
      </ul>
      <h3 className="mt-3 border-t border-line pt-3 text-sm text-muted">Award · {season.awards.length}</h3>
      <ul>
        {season.awards.map((a) => (
          <li key={a.id} className="py-1">
            {a.name}
            <span className="block text-sm text-muted">{a.question}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
