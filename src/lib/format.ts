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
