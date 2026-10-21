"use client";

import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "border border-gold px-5 text-gold hover:bg-gold/10",
  secondary: "px-1 text-ink underline underline-offset-4 hover:text-gold",
  danger: "border border-error px-5 text-error hover:bg-error/10",
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
export function ConfirmButton({ onConfirm, confirmLabel = "Tocca di nuovo per confermare", children, ...rest }: ConfirmButtonProps) {
  const { armed, pending, click } = useConfirm(onConfirm);
  return (
    <Button {...rest} pending={pending} onClick={click} aria-live="polite">
      {armed ? confirmLabel : children}
    </Button>
  );
}

type FieldProps = { label: string; error?: string | null; hint?: string } & (
  | ({ textarea?: false } & InputHTMLAttributes<HTMLInputElement>)
  | ({ textarea: true } & TextareaHTMLAttributes<HTMLTextAreaElement>)
);

export function Field({ label, error, hint, className = "", ...props }: FieldProps) {
  const { textarea, ...rest } = props;
  const id = useId();
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

const SIZES = { sm: "w-12", md: "w-20", lg: "w-full" };

/** Locandina 2:3. `movie` null = film non ancora svelato. */
export function Poster({ movie, size = "md" }: { movie: { title: string; posterUrl: string | null } | null; size?: keyof typeof SIZES }) {
  const box = `${SIZES[size]} aspect-[2/3] shrink-0 overflow-hidden rounded border border-line bg-surface`;
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
