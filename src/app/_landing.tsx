"use client";

import { useEffect, useState } from "react";
import { SealMark } from "@/components/Logo";
import { Button } from "@/components/ui";

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

/** Busta di prova, solo lato client: si apre e si richiude senza chiamare il server. */
export function DemoEnvelope() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="demo-env" data-open={open || undefined}>
        <div className="demo-winner">
          {/* eslint-disable-next-line @next/next/no-img-element -- locandina TMDB già dimensionata */}
          <img
            src="https://image.tmdb.org/t/p/w500/wpImvqmdrvJsa3edcUUnr4RCkNU.jpg"
            alt="Locandina di Cars - Motori ruggenti"
            loading="lazy"
            className="mx-auto mb-2.5 aspect-[2/3] w-[110px] rounded-lg object-cover shadow-[0_14px_26px_rgb(0_0_0/0.6)]"
          />
          <p className="font-serif text-2xl">Cars - Motori ruggenti</p>
          <p className="text-[15px] text-muted">proposto da Nicola · media 99</p>
        </div>
        <div className="demo-body" aria-hidden="true" />
        <div className="demo-flap" aria-hidden="true" />
        <div className="wax" aria-hidden="true">
          <SealMark />
        </div>
      </div>
      <Button onClick={() => setOpen(!open)} className="min-h-12 px-6 text-[17px]">
        {open ? "Richiudi" : "Apri la busta"}
      </Button>
    </>
  );
}
