"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { formatAverage, formatVotes } from "@/components/AwardWinners";
import { Avatar, Poster } from "@/components/ui";
import type { AwardResult } from "@/lib/types";

type Film = { tmdbId: number; title: string; posterUrl: string | null };
type Step = "announce" | "nominees" | "revealed" | "done";

/** Dalla risposta del server: la busta si apre e l'annuncio comincia a scriversi quando il contenuto è salito (globals.css, `.env-*`). */
const TYPE_START_MS = 1900;
const TYPE_STEP_MS = 45;
/** Il riflettore passa da un candidato all'altro sempre più piano e si ferma sul vincitore. */
const SPOTLIGHT_GAPS_MS = [100, 100, 100, 110, 120, 130, 150, 170, 200, 240, 290, 360, 450, 560, 700];
const HOLD_MS = 1300;
const TIE_MS = 900;
const COUNT_UP_DELAY_MS = 900;
const COUNT_UP_MS = 1300;
const PROPOSER_MS = 2400;
const DONE_MS = 3200;

const CONFETTI = Array.from({ length: 70 }, (_, i) => {
  const angle = (i * 137.5 * Math.PI) / 180;
  const distance = 6 + ((i * 7) % 12);
  return {
    "--c": ["#c9a24a", "#e6c46e", "#f4eee2", "#8a2028", "#b8913f"][i % 5],
    "--dx": `${(Math.cos(angle) * distance).toFixed(1)}rem`,
    "--dy": `${(Math.sin(angle) * distance - 6).toFixed(1)}rem`,
    "--r": `${((i * 97) % 720) - 360}deg`,
    "--delay": `${(i * 13) % 120}ms`,
  } as CSSProperties;
});

const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const mod = (n: number, m: number) => ((n % m) + m) % m;

/**
 * Busta di un award aperta: la sala si spegne, l'annuncio si scrive, un riflettore scorre sui film dell'edizione
 * e si ferma sul vincitore; poi lampo, raggi, coriandoli, la media che sale e, per ultimo, chi l'ha proposto.
 * Si rimonta a ogni apertura. Con il movimento ridotto si vede subito il risultato.
 */
export function AwardReveal({ award, films, onDone }: { award: AwardResult; films: Film[]; onDone: () => void }) {
  const phrase = `E l'award «${award.name}» va a…`;
  const winners = award.winners;
  const spotlight = winners.map((w) => films.findIndex((f) => f.tmdbId === w.movie.tmdbId));
  const instant = reducedMotion() || !winners.length || spotlight.includes(-1);

  const [step, setStep] = useState<Step>(instant ? "done" : "announce");
  const [typed, setTyped] = useState(instant ? phrase.length : 0);
  const [lit, setLit] = useState<number[]>([]);
  const [average, setAverage] = useState(instant ? (winners[0]?.average ?? 0) : 0);
  const [proposer, setProposer] = useState(instant);
  const timers = useRef<number[]>([]);
  const winner = useRef<HTMLDivElement>(null);

  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  function reveal() {
    clear();
    setTyped(phrase.length);
    setStep("revealed");
    later(PROPOSER_MS, () => {
      setProposer(true);
      winner.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    later(DONE_MS, () => {
      setStep("done");
      onDone();
    });
  }

  useEffect(() => {
    if (instant) {
      onDone();
      return;
    }
    [...phrase].forEach((_, i) => later(TYPE_START_MS + i * TYPE_STEP_MS, () => setTyped(i + 1)));
    let t = TYPE_START_MS + phrase.length * TYPE_STEP_MS;
    later(t, () => setStep("nominees"));
    t += 500;
    for (const [k, gap] of SPOTLIGHT_GAPS_MS.entries()) {
      const i = mod(spotlight[0] - (SPOTLIGHT_GAPS_MS.length - 1 - k), films.length);
      later(t, () => setLit([i]));
      t += gap;
    }
    if (spotlight.length > 1) later(t + TIE_MS, () => setLit(spotlight));
    later(t + (spotlight.length > 1 ? 2 * TIE_MS : HOLD_MS), reveal);
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- la sequenza si programma una volta sola, al montaggio
  }, []);

  useEffect(() => {
    if (step !== "revealed") return;
    let frame = 0;
    const start = performance.now() + COUNT_UP_DELAY_MS;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / COUNT_UP_MS));
      setAverage((winners[0]?.average ?? 0) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [step, winners]);

  const dark = step !== "done";
  return (
    <div className="award-reveal" data-step={step} data-dark={dark || undefined}>
      {createPortal(<div className="award-dimmer" data-on={dark || undefined} aria-hidden="true" />, document.body)}
      <p className="award-announce">
        <span className="eyebrow block">{award.name}</span>
        <span className="block text-sm text-muted">{award.question}</span>
        <span className="mt-2 block font-serif text-2xl italic">
          {phrase.slice(0, typed)}
          {typed < phrase.length && <span className="award-caret" aria-hidden="true" />}
        </span>
      </p>

      {(step === "announce" || step === "nominees") && (
        <>
          <ul className="award-nominees" aria-hidden="true">
            {films.map((f, i) => (
              <li key={f.tmdbId} data-lit={lit.includes(i) || undefined} data-hold={(lit.includes(i) && spotlight.includes(i) && lit.length === spotlight.length) || undefined}>
                <Poster movie={f} size="lg" />
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="award-skip"
            onClick={(e) => {
              // il bottone sparisce: il focus torna al contenuto della busta
              e.currentTarget.closest<HTMLElement>(".env-content")?.focus();
              reveal();
            }}
          >
            Salta »
          </button>
        </>
      )}

      {(step === "revealed" || step === "done") && (
        <div ref={winner} className="award-winner">
          {winners.length === 0 ? (
            <p className="text-muted">Nessun vincitore: nessun voto</p>
          ) : (
            <>
              <span className="award-rays" aria-hidden="true" />
              {step === "revealed" && (
                <span className="award-confetti" aria-hidden="true">
                  {CONFETTI.map((style, i) => (
                    <i key={i} style={style} />
                  ))}
                </span>
              )}
              {winners.length > 1 && <p className="award-tie font-serif text-xl text-gold italic">Ex aequo!</p>}
              <ul className="flex flex-wrap justify-center gap-4">
                {winners.map((w) => (
                  <li key={w.movie.tmdbId} className={`award-poster ${winners.length > 1 ? "w-36" : "w-48"}`}>
                    <Poster movie={w.movie} size="lg" />
                  </li>
                ))}
              </ul>
              <h3 className="award-title mt-4 font-serif text-3xl leading-tight text-ink">{winners.map((w) => w.movie.title).join(" · ")}</h3>
              <p className="award-score mt-1 text-muted">
                media <strong className="font-serif text-2xl text-gold tabular-nums">{formatAverage(average)}</strong>
                {winners.length === 1 && ` · ${formatVotes(winners[0].votes)}`}
              </p>
              <p className="award-by mt-3 text-muted">
                proposto da…{" "}
                <span className="award-proposer" data-on={proposer || undefined}>
                  {winners.map((w, i) => (
                    <span key={w.movie.tmdbId} className="inline-flex items-center gap-1.5 align-middle">
                      {i > 0 && <span className="text-muted">e</span>}
                      <Avatar name={w.proposer.username} url={w.proposer.avatarUrl} size={28} />
                      <strong className="font-serif text-xl text-ink">{w.proposer.username}</strong>
                    </span>
                  ))}
                </span>
              </p>
            </>
          )}
        </div>
      )}
      {step === "revealed" && <span className="award-flash" aria-hidden="true" />}
    </div>
  );
}
