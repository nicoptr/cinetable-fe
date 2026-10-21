import type { ReactNode } from "react";

/** Si rimonta a ogni cambio di sezione: il contenuto entra con una dissolvenza (globals.css, `.pane`). */
export default function SectionTemplate({ children }: { children: ReactNode }) {
  return <div className="pane">{children}</div>;
}
