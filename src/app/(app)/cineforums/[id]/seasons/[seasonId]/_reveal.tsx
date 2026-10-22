"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Envelope } from "@/components/Envelope";
import { Poster } from "@/components/ui";
import { api } from "@/lib/api";
import type { ProgramItem } from "@/lib/types";

/** Il conto alla rovescia parte quando lo schermo è uscito dalla busta (globals.css, `.leader`). */
const LEADER_START_MS = 1900;
const LEADER_STEP_MS = 1000;
const COUNT = [5, 4, 3, 2, 1];
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

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
        return <Revealed item={item} />;
      }}
    />
  );
}

/** Si rimonta a ogni apertura della busta: il conto alla rovescia riparte da 5. */
function Revealed({ item }: { item: ProgramItem }) {
  const [count, setCount] = useState(() => (reducedMotion() ? 0 : COUNT[0]));
  const [skipped, setSkipped] = useState(false);
  useEffect(() => {
    if (reducedMotion() || skipped) return;
    const timers = [...COUNT.slice(1), 0].map((k, i) => setTimeout(() => setCount(k), LEADER_START_MS + (i + 1) * LEADER_STEP_MS));
    return () => timers.forEach(clearTimeout);
  }, [skipped]);
  const n = skipped ? 0 : count;

  if (n > 0) {
    return (
      <div className="env-film">
        <button
          type="button"
          className="leader"
          aria-label="Salta il conto alla rovescia"
          onClick={(e) => {
            // il bottone sparisce: il focus torna al contenuto della busta
            e.currentTarget.closest<HTMLElement>(".env-content")?.focus();
            setSkipped(true);
          }}
        >
          <span className="leader-sweep" />
          <span className="leader-cross" />
          <span className="leader-ring" />
          <span className="leader-ring leader-ring-inner" />
          <span className="leader-num" aria-hidden="true">
            {n}
          </span>
          <span className="leader-scratch" />
          <span className="leader-scratch leader-scratch-dark" />
          <span className="leader-grain" />
        </button>
        <p className="leader-skip">Tocca per saltare</p>
      </div>
    );
  }

  const { movie } = item;
  return (
    <>
      <div className="env-film">
        <div className="reel-window">
          <div className="reel">
            <div className="envelope-poster w-52">
              <Poster movie={movie} size="lg" />
            </div>
            <span className="reel-frame" />
            <span className="reel-frame reel-frame-lit" />
            <span className="reel-frame" />
          </div>
        </div>
      </div>
      <div className="envelope-title">
        <h2 className="mt-5 font-serif text-3xl leading-tight text-ink">{movie.title}</h2>
        {movie.originalTitle !== movie.title && <p className="font-serif text-muted italic">{movie.originalTitle}</p>}
      </div>
      <p className="envelope-caption mt-2 text-gold">
        Film n. {item.order}
        {item.category && ` · ${item.category.name}`}
        {movie.year && ` · ${movie.year}`}
      </p>
    </>
  );
}
