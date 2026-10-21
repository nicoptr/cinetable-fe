"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { path: "", label: "Edizioni" },
  { path: "/members", label: "Membri" },
  { path: "/categories", label: "Categorie" },
  { path: "/awards", label: "Award" },
];

export function SectionNav({ id }: { id: string }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Sezioni del cineforum"
      className="sticky top-0 z-10 -mx-4 mt-4 mb-6 flex gap-6 overflow-x-auto border-b border-line bg-bg px-4 md:static md:mx-0 md:mt-6 md:mb-0 md:flex-col md:gap-1 md:overflow-visible md:border-0 md:bg-transparent md:px-0"
    >
      {SECTIONS.map(({ path, label }) => {
        const href = `/cineforums/${id}${path}`;
        const active = pathname === href;
        return (
          <Link
            key={path}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center border-b-2 whitespace-nowrap focus-visible:outline-offset-[-2px]! md:rounded-lg md:border-b-0 md:border-l-2 md:px-3 ${
              active ? "border-gold text-ink md:bg-gold/8 md:text-gold" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
