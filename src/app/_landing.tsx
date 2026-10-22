"use client";

import { useEffect } from "react";
import { Envelope } from "@/components/Envelope";
import { FilmReveal } from "@/components/FilmReveal";

/** Le `.rise` compaiono quando entrano nello schermo, a gruppi di cinque scalati di 60 ms. */
export function RiseOnScroll() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      },
      { threshold: 0.15 },
    );
    document.querySelectorAll<HTMLElement>(".rise").forEach((el, i) => {
      el.style.transitionDelay = `${(i % 5) * 60}ms`;
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);
  return null;
}

const DEMO_FILM = { title: "Cars - Motori ruggenti", posterUrl: "https://image.tmdb.org/t/p/w500/wpImvqmdrvJsa3edcUUnr4RCkNU.jpg" };

/** Busta di prova, solo lato client: si apre come quella vera, con il conto alla rovescia, senza chiamare il server. */
export function DemoEnvelope() {
  return <Envelope label="Miglior film" closeLabel="Richiudi la busta" onOpen={async () => <FilmReveal movie={DEMO_FILM} caption="proposto da Nicola · media 99" />} />;
}
