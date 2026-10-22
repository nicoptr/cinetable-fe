"use client";

import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ComponentProps, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "btn-primary border border-gold px-5 text-gold",
  secondary: "text-ink underline underline-offset-4 hover:text-gold",
  danger: "text-error underline underline-offset-4 hover:opacity-80",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  /** In attesa: disabilitato, con `pendingLabel` al posto del testo. */
  pending?: boolean;
  pendingLabel?: string;
};

export function Button({ variant = "primary", pending = false, pendingLabel = "Attendere…", disabled, className = "", children, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={`inline-flex min-h-11 items-center justify-center rounded text-base transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

const CONFIRM_MS = 4000;

type ConfirmButtonProps = Omit<ButtonProps, "onClick" | "pending"> & {
  onConfirm: () => unknown;
  confirmLabel?: string;
  /** nome accessibile da armato (quello da fermo è `aria-label`) */
  armedAriaLabel?: string;
};

/**
 * Due tocchi per le azioni irreversibili: il primo arma per 4 s, il secondo esegue `onConfirm`
 * e resta `pending` finché non finisce. Un ref blocca i tocchi in più prima del nuovo render.
 */
export function useConfirm(onConfirm: () => unknown) {
  const [armed, setArmed] = useState(false);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function click() {
    if (busy.current) return;
    if (!armed) {
      setArmed(true);
      timer.current = setTimeout(() => setArmed(false), CONFIRM_MS);
      return;
    }
    clearTimeout(timer.current);
    busy.current = true;
    setArmed(false);
    setPending(true);
    try {
      await onConfirm();
    } catch {
      // l'errore lo mostra il chiamante; qui basta non lasciarlo senza gestione
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return { armed, pending, click };
}

/** Primo tocco: chiede conferma per 4 s. Secondo tocco: esegue `onConfirm` e resta in attesa finché non finisce. */
export function ConfirmButton({ onConfirm, confirmLabel = "Tocca di nuovo per confermare", armedAriaLabel, "aria-label": ariaLabel, children, ...rest }: ConfirmButtonProps) {
  const { armed, pending, click } = useConfirm(onConfirm);
  return (
    <Button {...rest} pending={pending} onClick={click} aria-live="polite" aria-label={armed ? armedAriaLabel : ariaLabel}>
      {armed ? confirmLabel : children}
    </Button>
  );
}

type FieldProps = { label: string; error?: string | null; hint?: string } & (
  | ({ textarea?: false } & InputHTMLAttributes<HTMLInputElement>)
  | ({ textarea: true } & TextareaHTMLAttributes<HTMLTextAreaElement>)
);

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {crossed && <path d="M4 4l16 16" />}
    </svg>
  );
}

export function Field({ label, error, hint, className = "", ...props }: FieldProps) {
  const { textarea, ...rest } = props;
  const id = useId();
  const [shown, setShown] = useState(false);
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  const control = `w-full rounded border bg-surface px-3 py-2.5 text-base text-ink placeholder:text-muted ${error ? "border-error" : "border-line"} ${className}`;
  const aria = { id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy };

  return (
    <div className="mb-5">
      <label htmlFor={id} className="mb-1.5 block text-base">
        {label}
      </label>
      {textarea ? (
        <textarea {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)} {...aria} className={`${control} min-h-28`} />
      ) : (rest as InputHTMLAttributes<HTMLInputElement>).type === "password" ? (
        <div className="relative">
          <input {...(rest as InputHTMLAttributes<HTMLInputElement>)} {...aria} type={shown ? "text" : "password"} className={`${control} min-h-11 pr-12`} />
          <button
            type="button"
            onClick={() => setShown(!shown)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded text-muted hover:text-gold"
          >
            <EyeIcon crossed={shown} />
            {/* testo e non aria-label: getByLabel("Password") deve trovare solo il campo */}
            <span className="sr-only">{shown ? "Nascondi la password" : "Mostra la password"}</span>
          </button>
        </div>
      ) : (
        <input {...(rest as InputHTMLAttributes<HTMLInputElement>)} {...aria} className={`${control} min-h-11`} />
      )}
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}

const TONES = {
  error: "border-error text-error",
  info: "border-line text-ink",
  success: "border-success text-success",
};

export function Notice({ tone = "info", children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`mb-5 border-l-2 py-1 pl-3 ${TONES[tone]}`}>
      {children}
    </div>
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="mb-4 font-serif text-3xl leading-tight">{children}</h1>;
}

/** Card di una sezione (globals.css, `.card`), con il titolo come etichetta. */
export function Section({ title, children, className = "", ...rest }: Omit<ComponentProps<"section">, "title"> & { title?: ReactNode }) {
  return (
    <section className={`card ${className}`} {...rest}>
      {title && <h2 className="eyebrow mb-2">{title}</h2>}
      {children}
    </section>
  );
}

const SIZES = { sm: "w-12", md: "w-20", lg: "w-full" };

/** Locandina 2:3. `movie` null = film non ancora svelato. */
export function Poster({ movie, size = "md" }: { movie: { title: string; posterUrl: string | null } | null; size?: keyof typeof SIZES }) {
  const box = `${SIZES[size]} aspect-[2/3] shrink-0 overflow-hidden rounded border border-line bg-surface shadow-[0_12px_24px_rgb(0_0_0/0.55)] outline-1 -outline-offset-2 outline-white/6 transition-transform duration-250 hover:-translate-y-[3px] hover:-rotate-[0.6deg]`;
  if (!movie) {
    return (
      <div className={`${box} flex items-center justify-center font-serif text-2xl text-gold`} role="img" aria-label="Film da svelare">
        ?
      </div>
    );
  }
  if (!movie.posterUrl) {
    return <div className={`${box} flex items-center justify-center p-1 text-center font-serif text-xs break-words`}>{movie.title}</div>;
  }
  // eslint-disable-next-line @next/next/no-img-element -- niente next/image: locandine TMDB già dimensionate
  return <img src={movie.posterUrl} alt={movie.title} loading="lazy" className={`${box} object-cover`} />;
}

const initials = (name: string) =>
  name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

/**
 * Foto tonda, oppure le iniziali su un cerchio con bordo oro (anche se la foto non si carica).
 * Decorativa (`alt` vuoto): si usa solo accanto al nome già scritto.
 */
export function Avatar({ name, url, size = 24 }: { name: string; url: string | null; size?: number }) {
  const [broken, setBroken] = useState<string | null>(null);
  const box = { width: size, height: size, fontSize: Math.round(size * 0.45) };
  if (url && broken !== url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL esterno arbitrario scelto dall'utente
      <img
        src={url}
        alt=""
        style={box}
        // un errore arrivato prima dell'idratazione non passa da onError: lo si legge dall'immagine
        ref={(img) => {
          if (img?.complete && img.naturalWidth === 0) setBroken(url);
        }}
        onError={() => setBroken(url)}
        className="inline-block shrink-0 rounded-full border border-line object-cover"
      />
    );
  }
  return (
    // iniziali da CSS: decorative, fuori dal testo della pagina ("proposto da carla" resta tale)
    <span
      aria-hidden="true"
      data-initials={initials(name)}
      style={box}
      className="inline-flex shrink-0 items-center justify-center rounded-full border border-gold/60 font-serif leading-none text-gold before:content-[attr(data-initials)]"
    />
  );
}
