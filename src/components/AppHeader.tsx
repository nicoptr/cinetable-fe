"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Me } from "@/lib/types";
import { Avatar, Notice } from "./ui";

const item = "flex min-h-11 items-center border-t border-line text-left text-base hover:text-gold disabled:opacity-60";

export function AppHeader({ pending, user }: { pending: number; user: Me | null }) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLElement>(null);

  useEffect(() => {
    if (open) nav.current?.querySelector<HTMLElement>("a")?.focus();
  }, [open]);

  function close(refocus = true) {
    setOpen(false);
    if (refocus) button.current?.focus();
  }

  async function logout() {
    setLoggingOut(true);
    setError(null);
    try {
      await api("/auth/logout", { quiet: true, method: "POST" });
      // ricarica piena: la sessione è finita, niente stato da tenere
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/");
    } catch (err) {
      setError((err as ApiError).message);
      setLoggingOut(false);
    }
  }

  return (
    <header className="-mt-6 mb-6 border-b border-line print:hidden" onKeyDown={(e) => e.key === "Escape" && open && close()}>
      <div className="flex items-center justify-between">
        <Link href="/cineforums" className="inline-flex min-h-11 items-center font-serif text-2xl italic text-gold">
          Cinetable
        </Link>
        <button
          ref={button}
          type="button"
          aria-expanded={open}
          aria-controls={open ? "app-menu" : undefined}
          onClick={() => (open ? close() : setOpen(true))}
          className="inline-flex min-h-11 min-w-11 items-center justify-end gap-2 rounded hover:text-gold"
        >
          <span className="sr-only">Menu</span>
          {user && <Avatar name={user.username} url={user.avatarUrl} size={28} />}
          <span aria-hidden className="text-2xl leading-none">{open ? "✕" : "☰"}</span>
        </button>
      </div>
      {open && (
        <nav id="app-menu" ref={nav} aria-label="Menu principale" className="pb-2">
          {error && <Notice tone="error">{error}</Notice>}
          <Link href="/cineforums" onClick={() => close(false)} className={item}>I miei cineforum</Link>
          <Link href="/invitations" onClick={() => close(false)} className={item}>Inviti{pending > 0 && ` (${pending})`}</Link>
          <Link href="/profile" onClick={() => close(false)} className={item}>Profilo</Link>
          <button type="button" disabled={loggingOut} onClick={logout} className={`${item} w-full`}>{loggingOut ? "Uscita…" : "Esci"}</button>
        </nav>
      )}
    </header>
  );
}
