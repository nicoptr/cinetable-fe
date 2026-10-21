"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

const MOVE_MS = 380;
const HOLD_MS = 120;
const GIVE_UP_MS = 5000;

const APP_PATH = /^\/(cineforums|invitations|profile)(\/|$)/;

/** La sezione principale: le quattro sezioni del cineforum sono una sola, l'edizione con film, scheda e `seasons/new` un'altra. */
const sectionKey = (path: string) => path.match(/^\/cineforums\/\d+\/seasons|^\/cineforums\/\d+|^\/[^/]*/)![0];

const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// un solo sipario per pagina, quindi un solo timer: le fasi si susseguono, mai due insieme
let timer: number | undefined;
function after(ms: number, then: () => void) {
  clearTimeout(timer);
  timer = window.setTimeout(then, ms);
}

function reopen(curtain: HTMLElement) {
  curtain.dataset.state = "opening";
  after(MOVE_MS, () => (curtain.dataset.state = "open"));
}

/**
 * Sipario tra le sezioni principali. Un link interno verso un'altra sezione chiude il sipario e naviga dopo;
 * le altre navigazioni (router.push, indietro/avanti) trovano il sipario chiuso sulla nuova pagina e lo vedono riaprirsi.
 */
export function Curtain() {
  const pathname = usePathname();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const shownKey = useRef(sectionKey(pathname));
  const closedAt = useRef(0);

  useEffect(() => {
    const curtain = ref.current!;
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element).closest?.<HTMLAnchorElement>("a[href]");
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      const url = new URL(link.href);
      if (url.origin !== location.origin || !APP_PATH.test(url.pathname)) return;
      if (curtain.dataset.state === "closing" || curtain.dataset.state === "closed") {
        e.preventDefault();
        return;
      }
      if (sectionKey(url.pathname) === sectionKey(location.pathname) || reducedMotion()) return;
      e.preventDefault();
      curtain.dataset.state = "closing";
      after(MOVE_MS, () => {
        curtain.dataset.state = "closed";
        closedAt.current = Date.now();
        router.push(url.pathname + url.search + url.hash);
        after(GIVE_UP_MS, () => reopen(curtain));
      });
    }
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimeout(timer);
    };
  }, [router]);

  // prima del paint: la nuova pagina non si vede mai senza sipario
  useLayoutEffect(() => {
    const curtain = ref.current!;
    const key = sectionKey(pathname);
    if (key === shownKey.current) return;
    shownKey.current = key;
    // una chiusura da clic in corso finisce con la sua navigazione, che riapre il sipario
    if (reducedMotion() || curtain.dataset.state === "closing") return;
    if (curtain.dataset.state !== "closed") {
      curtain.dataset.state = "closed";
      closedAt.current = Date.now();
    }
    after(Math.max(0, closedAt.current + HOLD_MS - Date.now()), () => reopen(curtain));
  }, [pathname]);

  return (
    <div ref={ref} className="curtain print:hidden" data-state="open" aria-hidden="true">
      <div className="curtain-panel curtain-left" />
      <div className="curtain-panel curtain-right" />
      <div className="curtain-valance" />
    </div>
  );
}
