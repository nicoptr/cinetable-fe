import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

const TITLE = "Cinofili";
const DESCRIPTION = "Il cineforum tra amici, con la suspense degli Oscar: candida un film in segreto, scoprilo una sera alla volta, vota e apri la busta.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", locale: "it_IT", url: "/" },
};

const STEPS = [
  ["Una categoria segreta", "Ognuno riceve in segreto una categoria e sceglie un film che la rispetta."],
  ["Un film alla volta", "Una sera alla volta il film di qualcuno viene svelato, e si guarda insieme."],
  ["La busta degli Oscar", "Alla serata finale si vota e si aprono le buste: chi vince?"],
];

const linkBase = "inline-flex min-h-11 items-center justify-center";

export default async function Home() {
  const loggedIn = (await cookies()).has("cinofili_token");
  return (
    <>
      <h1 className="mb-4 font-serif text-4xl leading-tight text-gold italic">Cinofili</h1>
      <p className="text-lg text-muted">Il cineforum tra amici, con la suspense degli Oscar</p>
      <ol className="my-8 space-y-5">
        {STEPS.map(([title, text], i) => (
          <li key={title} className="flex gap-4 border-t border-line pt-4">
            <span className="font-serif text-3xl text-gold" aria-hidden>
              {i + 1}
            </span>
            <div>
              <h2 className="text-xl">{title}</h2>
              <p className="text-muted">{text}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {loggedIn ? (
          <Link href="/cineforums" className={`${linkBase} rounded border border-gold px-5 text-gold hover:bg-gold/10`}>
            Vai ai tuoi cineforum
          </Link>
        ) : (
          <>
            <Link href="/signup" className={`${linkBase} rounded border border-gold px-5 text-gold hover:bg-gold/10`}>
              Crea il tuo cineforum
            </Link>
            <Link href="/login" className={`${linkBase} px-1 underline underline-offset-4 hover:text-gold`}>
              Accedi
            </Link>
          </>
        )}
      </div>
    </>
  );
}
