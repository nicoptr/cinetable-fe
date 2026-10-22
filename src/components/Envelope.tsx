"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { SealMark } from "@/components/Logo";
import { Button, Notice, useConfirm } from "@/components/ui";
import { errorText } from "@/lib/api";

type Opened = { label: string; content: ReactNode };

const SPARKS = Array.from({ length: 12 }, (_, i) => ({ "--a": `${i * 30 + (i % 2) * 11}deg`, "--d": `${64 + (i % 3) * 22}px` }) as CSSProperties);

/**
 * Busta d'oro da aprire con due tocchi. `onOpen` parte una sola volta per tocco confermato;
 * l'animazione (globals.css, `.env-*`) parte solo quando la risposta è arrivata. Se fallisce,
 * la busta resta chiusa e l'errore compare sotto.
 * Il contenuto può marcare la locandina con `envelope-poster` (alone e riflesso) e la didascalia
 * con `envelope-caption` (appare per ultima).
 * Con `closeLabel` la busta aperta si può richiudere e riaprire: rivede la stessa animazione, senza richiamare `onOpen`.
 */
export function Envelope({ label, onOpen, disabled = false, closeLabel }: { label: string; onOpen: () => Promise<ReactNode>; disabled?: boolean; closeLabel?: string }) {
  // l'etichetta resta quella della busta aperta anche se il genitore passa già la prossima
  const [opened, setOpened] = useState<Opened | null>(null);
  const [closed, setClosed] = useState<Opened | null>(null);
  const [error, setError] = useState<string | null>(null);
  const content = useRef<HTMLDivElement>(null);
  const envelope = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (opened) content.current?.focus();
    else if (closed) envelope.current?.focus();
  }, [opened, closed]);
  const shown = opened ?? closed;
  const { armed, pending, click } = useConfirm(async () => {
    setError(null);
    if (closed) return setOpened(closed);
    try {
      setOpened({ label, content: await onOpen() });
    } catch (err) {
      setError(errorText(err));
    }
  });

  const parts = (
    <div className="env-box" aria-hidden="true">
      <div className="env-part env-back" />
      <div className="env-part env-flap-wrap">
        <div className="env-flap" />
      </div>
      <div className="env-part env-front">
        <span className="env-label">{shown?.label ?? label}</span>
      </div>
      <div className="env-seal">
        <SealMark />
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
      <section aria-label={shown?.label ?? label} aria-live="polite" className="env-stage" data-open={opened ? "" : undefined}>
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
            ref={envelope}
            type="button"
            className="env"
            onClick={click}
            disabled={pending || disabled}
            aria-busy={pending || undefined}
            aria-label={`${shown?.label ?? label}. ${hint}`}
            data-armed={armed || undefined}
            data-pending={pending || undefined}
          >
            {parts}
            <span className="env-hint">{hint}</span>
          </button>
        )}
      </section>
      {opened && closeLabel && (
        <div className="mt-3 text-center">
          <Button
            variant="secondary"
            onClick={() => {
              setClosed(opened);
              setOpened(null);
            }}
          >
            {closeLabel}
          </Button>
        </div>
      )}
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}
