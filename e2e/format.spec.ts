import { expect, test } from "@playwright/test";
import { formatLongDateTime, isoToRomeLocal, romeLocalToIso } from "../src/lib/format";

test("datetime-local ora di Roma → ISO, inverno (CET) ed estate (CEST)", () => {
  expect(romeLocalToIso("2026-01-15T21:00")).toBe("2026-01-15T20:00:00.000Z");
  expect(romeLocalToIso("2026-07-15T21:00")).toBe("2026-07-15T19:00:00.000Z");
  expect(isoToRomeLocal("2026-01-15T20:00:00.000Z")).toBe("2026-01-15T21:00");
  expect(isoToRomeLocal("2026-07-15T19:00:00.000Z")).toBe("2026-07-15T21:00");
});

test("data lunga della prossima proiezione, in ora di Roma", () => {
  expect(formatLongDateTime("2030-03-15T19:30:00.000Z")).toBe("venerdì 15 marzo alle 20:30");
  expect(formatLongDateTime("2030-07-05T19:30:00.000Z")).toBe("venerdì 5 luglio alle 21:30");
});
