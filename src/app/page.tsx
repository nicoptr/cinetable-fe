import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo, SealMark, Wordmark } from "@/components/Logo";
import { DemoEnvelope, RiseOnScroll } from "./_landing";

const TITLE = "Cinetable";
const DESCRIPTION =
  "Il cineforum tra amici: candidate un film in segreto, guardatelo insieme una sera alla volta e votate. Nella serata finale si aprono le buste, come agli Oscar.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", locale: "it_IT", url: "/" },
};

const STEPS: { title: string; text: string; chips?: string[] }[] = [
  {
    title: "Apri il cineforum e invita gli amici",
    text: "Scegli le categorie e gli award dell'edizione, fissa la scadenza e la serata finale. Gli inviti partono via email.",
  },
  {
    title: "Pesca una categoria, candida un film",
    text: "Ognuno riceve in sorte una categoria e sceglie in segreto un film che la rispetti. Nessun doppione: il nostro sistema li rileva e li gestisce senza rovinare la sorpresa a nessuno.",
    chips: ["Horror anni '80", "Un film che non hai mai visto"],
  },
  {
    title: "Una sera, un film",
    text: "Il presidente svela un film alla volta, in ordine casuale, e lo guardate insieme. Chi l'ha proposto? Nessuno lo sa, nemmeno il presidente.",
  },
  {
    title: "Si vota",
    text: "Dopo la visione ognuno dà un voto per ogni award: miglior film, miglior colonna sonora, quello che volete voi. Chi ha proposto il film non lo vota, e un voto dato non si cambia.",
  },
  {
    title: "La serata degli Oscar",
    text: "Si aprono le buste, una per award. Vince la media più alta, e solo ora si scopre chi aveva proposto ogni film.",
  },
];

const icon = (paths: ReactNode) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="mb-2.5 size-7 fill-none stroke-gold stroke-[1.6]">
    {paths}
  </svg>
);

const FEATURES = [
  {
    icon: icon(
      <>
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </>,
    ),
    title: "Un segreto vero",
    text: "Nessuno vede i film degli altri prima che vengano svelati. Il presidente sa chi deve ancora candidare, mai quale film hanno scelto gli altri.",
  },
  {
    icon: icon(
      <>
        <path d="M4 7h16M4 12h10M4 17h7" />
        <path d="M17 15l4 4M21 15l-4 4" />
      </>,
    ),
    title: "Niente doppioni",
    text: "I film si scelgono dal catalogo TMDB, con le locandine. Se un film arriva due volte, i proponenti ricevono un'email e ne scelgono un altro.",
  },
  {
    icon: icon(
      <>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
        <path d="M10 20a2 2 0 0 0 4 0" />
      </>,
    ),
    title: "Pensa a tutto lui",
    text: "Promemoria prima della scadenza, avvisi quando si vota, solleciti a chi manca. Il presidente non deve inseguire nessuno.",
  },
  {
    icon: icon(
      <>
        <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
        <path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8" />
      </>,
    ),
    title: "Un ricordo che resta",
    text: "A fine edizione resta la scheda con tutti i film, i voti e i vincitori, da riguardare quando volete.",
  },
];

const FAQ = [
  ["Quanto costa?", "Niente. Cinetable è un progetto tra amici: niente abbonamenti, niente pubblicità."],
  ["I film si guardano su Cinetable?", "No: Cinetable organizza il gioco. Il film lo guardate voi, insieme, dove e come preferite."],
  [
    "Quanti amici servono?",
    "Almeno due partecipanti per edizione, e il numero dei partecipanti deve essere un multiplo di quello delle categorie. Il limite è la grandezza del vostro divano.",
  ],
  ["Serve installare qualcosa?", "No. Funziona dal browser, ed è pensato prima di tutto per il telefono."],
];

const btn = "btn-primary inline-flex min-h-12 items-center justify-center rounded-lg border border-gold px-6 text-[17px] text-gold";
const textLink = "inline-flex min-h-11 items-center underline underline-offset-4 hover:text-gold";
const section = "border-t border-line py-14";

export default async function Home() {
  const loggedIn = (await cookies()).has("cinetable_token");
  const primary = loggedIn ? { href: "/cineforums", label: "Vai ai tuoi cineforum" } : { href: "/signup", label: "Crea il tuo cineforum" };

  return (
    <div data-landing>
      <RiseOnScroll />
      <noscript>
        <style>{".rise { opacity: 1 !important; translate: none !important; }"}</style>
      </noscript>
      <div className="curtain curtain-intro" aria-hidden="true">
        <div className="curtain-panel curtain-left" />
        <div className="curtain-panel curtain-right" />
        <div className="curtain-valance" />
      </div>

      <header className="-mt-6 flex items-center justify-between py-3.5">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2.5 text-[22px] text-gold">
          <Logo size={34} />
          <Wordmark />
        </Link>
        <Link href={loggedIn ? "/cineforums" : "/login"} className={textLink}>
          {loggedIn ? "Vai ai tuoi cineforum" : "Accedi"}
        </Link>
      </header>

      <section className="pt-6 pb-14 text-center">
        <div className="stage" aria-hidden="true">
          <div className="stage-valance" />
          <div className="stage-side stage-left" />
          <div className="stage-side stage-right" />
          <div className="fan">
            {[-18, -6, 6, 18].map((deg) => (
              <div key={deg} className="fan-poster" style={{ rotate: `${deg}deg` }}>
                ?
              </div>
            ))}
            <div className="mini-env">
              <div className="wax size-[34px]">
                <SealMark />
              </div>
            </div>
          </div>
        </div>
        <p className="eyebrow mb-2.5">Il cineforum tra amici</p>
        <h1 className="mb-3.5 text-[clamp(34px,8vw,52px)] leading-[1.08]">
          Ognuno porta un film.
          <br />
          <em className="text-gold">Nessuno sa di chi è.</em>
        </h1>
        <p className="mx-auto mb-6.5 max-w-[30em] text-lg text-muted">
          Candidate un film in segreto, guardatelo insieme una sera alla volta e votate. Nella serata finale si aprono le buste, come agli Oscar.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
          <Link href={primary.href} className={`${btn} btn-solid`}>
            {primary.label}
          </Link>
          <a href="#come" className={btn}>
            Come si gioca
          </a>
        </div>
        <p className="mt-3.5 text-sm text-muted">Gratis, senza pubblicità. Dal browser, anche dal telefono.</p>
      </section>

      <section id="come" className={section}>
        <p className="eyebrow rise mb-2.5">Come si gioca</p>
        <h2 className="rise mb-3 text-[32px] leading-tight">Cinque passi, dall&apos;invito alla busta</h2>
        <p className="rise mb-7 text-lg text-muted">Il presidente prepara l&apos;edizione, poi gioca come tutti gli altri.</p>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rise grid grid-cols-[44px_1fr] gap-4 pb-6.5">
              <span className="step-num">{i + 1}</span>
              <div>
                <h3 className="mt-1.5 mb-1 text-[22px]">{s.title}</h3>
                <p className="text-muted">{s.text}</p>
                {s.chips?.map((c) => (
                  <span key={c} className="mt-2 mr-1.5 inline-block rounded-full border border-gold/35 px-2.5 py-0.5 text-[13px] text-gold">
                    {c}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${section} text-center`}>
        <p className="eyebrow rise mb-2.5">Provala</p>
        <h2 className="rise mb-3 text-[32px] leading-tight">E l&apos;Oscar per il miglior film va a…</h2>
        <div className="card rise">
          <DemoEnvelope />
        </div>
      </section>

      <section className={section}>
        <p className="eyebrow rise mb-2.5">Perché funziona</p>
        <h2 className="rise mb-6 text-[32px] leading-tight">Il gusto della sorpresa, ogni settimana</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="card rise mt-0!">
              {f.icon}
              <h3 className="mb-1.5 text-xl">{f.title}</h3>
              <p className="text-muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`${section} faq`}>
        <p className="eyebrow rise mb-2.5">Domande</p>
        <h2 className="rise mb-6 text-[32px] leading-tight">Prima di cominciare</h2>
        {FAQ.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p className="mb-4 text-muted">{a}</p>
          </details>
        ))}
      </section>

      <section className={`${section} text-center`}>
        <h2 className="rise mb-3 text-[32px] leading-tight">Il prossimo giovedì, chi porta il film?</h2>
        <p className="rise mb-7 text-lg text-muted">Crea il cineforum in un minuto e invita il tuo gruppo.</p>
        <div className="rise flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
          <Link href={primary.href} className={`${btn} btn-solid`}>
            {primary.label}
          </Link>
          {!loggedIn && (
            <Link href="/login" className={textLink}>
              Ho già un account
            </Link>
          )}
        </div>
      </section>

      <footer className="border-t border-line pt-7 pb-9 text-sm text-muted">
        <div className="flex flex-wrap justify-between gap-2">
          <span>Cinetable · il cineforum tra amici</span>
          <span>
            Dati dei film da{" "}
            <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-4">
              TMDB
            </a>
          </span>
        </div>
        <p className="mt-2">This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
      </footer>
    </div>
  );
}
