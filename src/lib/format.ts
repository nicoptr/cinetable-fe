const date = new Intl.DateTimeFormat("it-IT", {
  timeZone: "Europe/Rome",
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});
const dateTime = new Intl.DateTimeFormat("it-IT", {
  timeZone: "Europe/Rome",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** "ven 14 nov 2026" */
export const formatDate = (iso: string) => date.format(new Date(iso));

/** "ven 14 nov, 21:00" */
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));

const romeParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Rome",
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function romeFields(ms: number) {
  const p = Object.fromEntries(romeParts.formatToParts(ms).map((x) => [x.type, x.value]));
  return p as Record<"year" | "month" | "day" | "hour" | "minute" | "second", string>;
}

/** Scarto di Roma da UTC (ms) all'istante `ms`: 1 h d'inverno, 2 h d'estate. */
function romeOffset(ms: number) {
  const p = romeFields(ms);
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(ms / 1000) * 1000;
}

/** Valore di `<input type="datetime-local">` ("2026-07-15T21:00"), letto come ora di Roma → ISO UTC. */
export function romeLocalToIso(local: string) {
  const [y, mo, d, h, mi] = local.split(/[-T:]/).map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  // due passi: il secondo corregge il caso in cui l'ora cada a cavallo del cambio ora legale
  return new Date(guess - romeOffset(guess - romeOffset(guess))).toISOString();
}

/** ISO → valore per `<input type="datetime-local">` in ora di Roma. */
export function isoToRomeLocal(iso: string) {
  const p = romeFields(new Date(iso).getTime());
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
