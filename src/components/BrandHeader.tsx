import Link from "next/link";
import { Logo, Wordmark } from "./Logo";

export function BrandHeader() {
  return (
    <header className="-mt-6 mb-6 border-b border-line print:hidden">
      <Link href="/" className="inline-flex min-h-11 items-center gap-2.5 text-2xl text-gold">
        <Logo className="drop-shadow-[0_2px_6px_rgb(201_162_74/0.35)]" />
        <Wordmark />
      </Link>
    </header>
  );
}
