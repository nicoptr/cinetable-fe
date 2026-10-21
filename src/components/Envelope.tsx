"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Notice, useConfirm } from "@/components/ui";
import { ApiError } from "@/lib/api";

const SPARKS = Array.from({ length: 12 }, (_, i) => ({ "--a": `${i * 30 + (i % 2) * 11}deg`, "--d": `${64 + (i % 3) * 22}px` }) as CSSProperties);

/**
 * Busta d'oro da aprire con due tocchi. `onOpen` parte una sola volta per tocco confermato;
 * l'animazione (globals.css, `.env-*`) parte solo quando la risposta è arrivata. Se fallisce,
 * la busta resta chiusa e l'errore compare sotto.
 * Il contenuto può marcare la locandina con `envelope-poster` (alone e riflesso) e la didascalia
 * con `envelope-caption` (appare per ultima).
 */
export function Envelope({ label, onOpen }: { label: string; onOpen: () => Promise<ReactNode> }) {
  // l'etichetta resta quella della busta aperta anche se il genitore passa già la prossima
  const [opened, setOpened] = useState<{ label: string; content: ReactNode } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (opened) content.current?.focus();
  }, [opened]);
  const { armed, pending, click } = useConfirm(async () => {
    setError(null);
    try {
      setOpened({ label, content: await onOpen() });
    } catch (err) {
      const down = !(err instanceof ApiError) || err.status === 0 || err.status === 429 || err.status >= 500;
      setError(down ? "Servizio non disponibile, riprova tra poco" : err.message);
    }
  });

  const parts = (
    <div className="env-box" aria-hidden="true">
      <div className="env-part env-back" />
      <div className="env-part env-flap-wrap">
        <div className="env-flap" />
      </div>
      <div className="env-part env-front">
        <span className="env-label">{opened?.label ?? label}</span>
      </div>
      <div className="env-seal">
        <span>C</span>
      </div>
      <div className="env-ring" />
      {SPARKS.map((style, i) => (
        <i key={i} className="env-spark" style={style} />
      ))}
    </div>
  );
  const hint = pending ? "Apertura…" : armed ? "Tocca di nuovo per aprire" : "Tocca per aprire";

  return (
    <div className="mb-8">
      <section aria-label={opened?.label ?? label} aria-live="polite" className="env-stage" data-open={opened ? "" : undefined}>
        <div className="env-glow" aria-hidden="true" />
        {opened ? (
          <>
            <div className="env">{parts}</div>
            <div ref={content} tabIndex={-1} className="env-content outline-none">
              {opened.content}
            </div>
          </>
        ) : (
          <button
            type="button"
            className="env"
            onClick={click}
            disabled={pending}
            aria-busy={pending || undefined}
            aria-label={`${label}. ${hint}`}
            data-armed={armed || undefined}
            data-pending={pending || undefined}
          >
            {parts}
            <span className="env-hint">{hint}</span>
          </button>
        )}
      </section>
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}
