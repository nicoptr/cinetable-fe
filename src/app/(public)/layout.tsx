import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="-mt-6 mb-6 border-b border-line print:hidden">
        <Link href="/" className="inline-flex min-h-11 items-center font-serif text-2xl italic text-gold">
          Cinofili
        </Link>
      </header>
      {children}
    </>
  );
}
