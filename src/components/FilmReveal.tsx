"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Poster } from "@/components/ui";

/** Il conto alla rovescia parte quando lo schermo è uscito dalla busta (globals.css, `.leader`). */
const LEADER_START_MS = 1900;
const LEADER_STEP_MS = 1000;
const COUNT = [5, 4, 3, 2, 1];
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Si rimonta a ogni apertura della busta: il conto alla rovescia riparte da 5. */
export function FilmReveal({ movie, caption }: { movie: { title: string; originalTitle?: string; posterUrl: string | null }; caption: ReactNode }) {
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
        {movie.originalTitle && movie.originalTitle !== movie.title && <p className="font-serif text-muted italic">{movie.originalTitle}</p>}
      </div>
      <p className="envelope-caption mt-2 text-gold">{caption}</p>
    </>
  );
}
