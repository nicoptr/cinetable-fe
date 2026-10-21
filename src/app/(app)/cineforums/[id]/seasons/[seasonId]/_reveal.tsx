"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Envelope } from "@/components/Envelope";
import { Poster } from "@/components/ui";
import { api } from "@/lib/api";
import type { ProgramItem } from "@/lib/types";

/**
 * Busta "Film n. <prossimo>" del presidente, in OPEN (primo svelamento) e in SCREENING.
 * Sta nello stesso punto dell'albero in entrambe le viste: dopo `router.refresh()` (che può
 * passare l'edizione da OPEN a SCREENING) resta montata e aperta sul film appena svelato.
 */
export function RevealNext({ base, next, available }: { base: string; next: number; available: boolean }) {
  const router = useRouter();
  const [opened, setOpened] = useState(false);
  if (!available && !opened) return null;
  return (
    <Envelope
      label={`Film n. ${next}`}
      onOpen={async () => {
        // anche dopo un errore: il server può aver già cambiato stato (es. svelato da un'altra scheda)
        const item = await api<ProgramItem>(`${base}/reveal-next`, { quiet: true, method: "POST" }).finally(() => router.refresh());
        setOpened(true);
        return <Revealed item={item} />;
      }}
    />
  );
}

function Revealed({ item }: { item: ProgramItem }) {
  const { movie } = item;
  return (
    <>
      <div className="envelope-poster mx-auto w-52">
        <Poster movie={movie} size="lg" />
      </div>
      <h2 className="mt-5 font-serif text-3xl leading-tight text-ink">{movie.title}</h2>
      {movie.originalTitle !== movie.title && <p className="font-serif text-muted italic">{movie.originalTitle}</p>}
      <p className="envelope-caption mt-2 text-gold">
        Film n. {item.order}
        {item.category && ` · ${item.category.name}`}
        {movie.year && ` · ${movie.year}`}
      </p>
    </>
  );
}
