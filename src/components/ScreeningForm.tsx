"use client";

import type { ReactNode } from "react";
import { Button, Field } from "@/components/ui";
import { isoToRomeLocal, romeLocalToIso } from "@/lib/format";

type Props = {
  screeningAt: string | null;
  location: string | null;
  busy: boolean;
  /** errore del backend, mostrato sotto la data: riguarda quasi sempre l'orario */
  error: string | null;
  submitLabel: string;
  onSubmit: (body: { screeningAt: string; location: string }) => void;
  children?: ReactNode;
};

/** Data e luogo di una proiezione, in ora di Roma. */
export function ScreeningForm({ screeningAt, location, busy, error, submitLabel, onSubmit, children }: Props) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        onSubmit({ screeningAt: romeLocalToIso(String(f.get("at"))), location: String(f.get("location")) });
      }}
    >
      <Field label="Data e ora" name="at" type="datetime-local" defaultValue={screeningAt ? isoToRomeLocal(screeningAt) : ""} error={error} required />
      <Field
        label="Dove"
        name="location"
        defaultValue={location ?? ""}
        placeholder="Es. Casa di Anna, via Roma 12"
        hint="Comparirà così nell'email, sotto «Dove»: basta il posto, senza «a» o «da» davanti."
        maxLength={200}
        required
      />
      <Button type="submit" pending={busy} pendingLabel="Salvataggio…" className="w-full">
        {submitLabel}
      </Button>
      {children}
    </form>
  );
}
