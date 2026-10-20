"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { MyInvitation } from "@/lib/types";

const item = "flex min-h-11 items-center border-t border-line px-1 text-left text-base hover:text-gold";

export function AppHeader() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    api<MyInvitation[]>("/invitations/mine").then((l) => setPending(l.length), () => {});
  }, []);

  async function logout() {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- ricarica piena: la sessione è finita
    window.location.assign("/");
  }

  const close = () => setOpen(false);
  return (
    <header className="-mt-6 mb-6 border-b border-line">
      <div className="flex items-center justify-between">
        <Link href="/cineforums" className="inline-flex min-h-11 items-center font-serif text-2xl text-gold">
          Cinofili
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="app-menu"
          onClick={() => setOpen(!open)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded px-3 hover:text-gold"
        >
          <span className="sr-only">Menu</span>
          <span aria-hidden className="text-2xl leading-none">{open ? "✕" : "☰"}</span>
        </button>
      </div>
      {open && (
        <nav id="app-menu" className="pb-2">
          <Link href="/cineforums" onClick={close} className={item}>I miei cineforum</Link>
          <Link href="/invitations" onClick={close} className={item}>Inviti{pending > 0 && ` (${pending})`}</Link>
          <Link href="/profile" onClick={close} className={item}>Profilo</Link>
          <button type="button" onClick={logout} className={`${item} w-full`}>Esci</button>
        </nav>
      )}
    </header>
  );
}
