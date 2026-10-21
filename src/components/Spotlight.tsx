"use client";

import { useEffect, useRef } from "react";

/**
 * Occhio di bue ai lati della colonna (globals.css, `.spotlight`): segue solo il mouse, si accende fuori dalla colonna.
 * Un frame per movimento, nessun loop da fermo.
 */
export function Spotlight() {
  const light = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    let x = 0;
    let y = 0;

    function place() {
      frame = 0;
      const el = light.current;
      const column = document.querySelector(".column");
      if (!el || !column) return;
      const box = column.getBoundingClientRect();
      const outside = x < box.left || x > box.right;
      el.toggleAttribute("data-live", outside);
      if (!outside) return;
      // il fascio parte sopra il centro della fascia laterale dove sta il mouse
      const sourceX = x < box.left ? box.left / 2 : (box.right + innerWidth) / 2;
      const dx = x - sourceX;
      const dy = y + 40;
      el.style.setProperty("--x", `${x}px`);
      el.style.setProperty("--y", `${y}px`);
      el.style.setProperty("--bx", `${sourceX}px`);
      el.style.setProperty("--bl", `${Math.hypot(dx, dy) + 60}px`);
      el.style.setProperty("--ba", `${-Math.atan2(dx, dy)}rad`);
    }

    function onMove(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      if (!frame) frame = requestAnimationFrame(place);
    }

    const off = () => light.current?.removeAttribute("data-live");
    addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("pointerleave", off);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", off);
    };
  }, []);

  return (
    <div ref={light} className="spotlight print:hidden" aria-hidden="true">
      <div className="spotlight-reveal" />
      <div className="spotlight-beam" />
      <div className="spotlight-spot" />
    </div>
  );
}
