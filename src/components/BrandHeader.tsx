import Link from "next/link";

export function BrandHeader() {
  return (
    <header className="-mt-6 mb-6 border-b border-line print:hidden">
      <Link href="/" className="inline-flex min-h-11 items-center font-serif text-2xl text-gold italic">
        Cinofili
      </Link>
    </header>
  );
}
