"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Envelope } from "@/components/Envelope";
import { FilmReveal } from "@/components/FilmReveal";
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
      closeLabel="Richiudi la busta"
      onOpen={async () => {
        // anche dopo un errore: il server può aver già cambiato stato (es. svelato da un'altra scheda)
        const item = await api<ProgramItem>(`${base}/reveal-next`, { quiet: true, method: "POST" }).finally(() => router.refresh());
        setOpened(true);
        return (
          <FilmReveal
            movie={item.movie}
            caption={
              <>
                Film n. {item.order}
                {item.category && ` · ${item.category.name}`}
                {item.movie.year && ` · ${item.movie.year}`}
              </>
            }
          />
        );
      }}
    />
  );
}
