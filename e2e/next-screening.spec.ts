import type { Page } from "@playwright/test";
import { expect, expectNoHorizontalScroll, loginAs, scheduleAndReveal, seed, test, type Player } from "./helpers";
import { formatDateTime, formatLongDateTime, isoToRomeLocal, romeLocalToIso } from "../src/lib/format";

const SEASON = "/cineforums/1/seasons/1";
const API = `/api${SEASON}`;
const TITLES = /La cosa|Ghostbusters|Fight Club|Nuovo Cinema Paradiso/;
const CATEGORY = /categoria (Horror anni '80|Commedia italiana)/;
const DAY = 86400000;

/** Un datetime-local in ora di Roma fra `days` giorni, con il suo ISO. */
function future(days: number) {
  const local = isoToRomeLocal(new Date(Date.now() + days * DAY).toISOString());
  return { local, iso: romeLocalToIso(local) };
}

const card = (page: Page) => page.locator("section.card").filter({ has: page.getByRole("heading", { name: "Prossima proiezione" }) });

async function switchTo(page: Page, who: Player) {
  await page.context().clearCookies();
  await loginAs(page, who);
}

async function season(page: Page) {
  const res = await page.request.get(API);
  expect(res.ok()).toBe(true);
  return res.json();
}

test("anna programma la proiezione prima di svelare, la modifica, svela e il film tiene la data", async ({ page }) => {
  seed("screening");
  await loginAs(page, "anna");
  await page.goto(SEASON);
  const first = future(2);
  await card(page).getByLabel("Data e ora").fill(first.local);
  await card(page).getByLabel("Dove").fill("Casa di Carla");
  await card(page).getByRole("button", { name: "Programma" }).click();
  await expect(card(page)).toContainText(`${formatLongDateTime(first.iso)} · Casa di Carla`);
  await expect(card(page)).toContainText(CATEGORY);

  const second = future(3);
  await card(page).getByRole("button", { name: "Modifica" }).click();
  await expect(card(page).getByLabel("Dove")).toHaveValue("Casa di Carla");
  await card(page).getByLabel("Data e ora").fill(second.local);
  await card(page).getByLabel("Dove").fill("Casa di Anna");
  await card(page).getByRole("button", { name: "Programma" }).click();
  await expect(card(page)).toContainText(`${formatLongDateTime(second.iso)} · Casa di Anna`);
  expect((await season(page)).nextScreening).toMatchObject({ screeningAt: second.iso, location: "Casa di Anna" });

  const envelope = page.getByRole("button", { name: /Film n\. 1/ });
  await envelope.click();
  await envelope.click();
  await expect(page.getByRole("region", { name: "Film n. 1" }).getByRole("heading", { name: TITLES })).toBeVisible();
  const s = await season(page);
  expect(s.nextScreening).toBeNull();
  expect(s.program[0]).toMatchObject({ screeningAt: second.iso, location: "Casa di Anna" });
  await expect(page.getByRole("list", { name: "Programma" }).getByRole("link")).toContainText("Casa di Anna");
  await page.goto(`${SEASON}/films/1`);
  await expect(page.getByText(`Proiezione ${formatDateTime(second.iso)} · Casa di Anna`)).toBeVisible();
});

test("una data nel passato: l'errore resta sotto il campo", async ({ page }) => {
  seed("screening");
  await loginAs(page, "anna");
  await page.goto(SEASON);
  await card(page).getByLabel("Data e ora").fill(future(-1).local);
  await card(page).getByLabel("Dove").fill("Casa di Anna");
  await card(page).getByRole("button", { name: "Programma" }).click();
  await expect(card(page).getByText("La proiezione non può essere nel passato")).toBeVisible();
  await expect(card(page).getByLabel("Data e ora")).toHaveAttribute("aria-invalid", "true");
});

test("bruno vede data, luogo e categoria del prossimo film, mai il titolo", async ({ page }) => {
  seed("screening");
  await loginAs(page, "anna");
  const { iso } = future(2);
  expect((await page.request.post(`${API}/next-screening`, { data: { screeningAt: iso, location: "Casa di Anna" } })).ok()).toBe(true);
  await switchTo(page, "bruno");
  await page.goto(SEASON);
  await expect(card(page)).toContainText(`${formatLongDateTime(iso)} · Casa di Anna`);
  await expect(card(page)).toContainText(CATEGORY);
  await expect(card(page).getByRole("button")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(TITLES);
});

test("senza proiezione programmata il membro non vede la card", async ({ page }) => {
  seed("screening");
  await loginAs(page, "bruno");
  await page.goto(SEASON);
  await expect(page.getByRole("heading", { level: 1, name: "Stagione 1" })).toBeVisible();
  await expect(card(page)).toHaveCount(0);
});

test("Apri il voto compare da solo all'orario della proiezione", async ({ page }) => {
  seed("screening");
  await loginAs(page, "anna");
  const at = new Date(Date.now() + 2 * 60000);
  at.setSeconds(0, 0);
  expect((await page.request.post(`${API}/next-screening`, { data: { screeningAt: at.toISOString(), location: "Sala Verdi" } })).ok()).toBe(true);
  expect((await page.request.post(`${API}/reveal-next`)).ok()).toBe(true);
  await page.clock.install();
  await page.goto(`${SEASON}/films/1`);
  await expect(page.getByText(`Potrai aprire il voto dopo la proiezione del ${formatLongDateTime(at.toISOString())}`)).toBeVisible();
  await expect(page.getByRole("button", { name: "Apri il voto" })).toHaveCount(0);
  await page.clock.fastForward("03:00");
  await expect(page.getByRole("button", { name: "Apri il voto" })).toBeVisible();
});

test("la proiezione del film svelato non può andare oltre quella del prossimo: errore sotto la data", async ({ page }) => {
  seed("screening");
  await loginAs(page, "anna");
  await scheduleAndReveal(page, API);
  expect((await page.request.post(`${API}/next-screening`, { data: { screeningAt: future(4).iso, location: "Casa di Anna" } })).ok()).toBe(true);
  await page.goto(`${SEASON}/films/1`);
  await page.getByLabel("Data e ora").fill(future(5).local);
  await page.getByLabel("Dove").fill("Sala Verdi");
  await page.getByRole("button", { name: "Salva la proiezione" }).click();
  await expect(page.getByText("La proiezione deve essere prima di quella già programmata per il prossimo film")).toBeVisible();
  await expect(page.getByLabel("Data e ora")).toHaveAttribute("aria-invalid", "true");
});

test("chi manca: c'è a scadenza passata se manca qualcuno, sparisce a gioco iniziato", async ({ page }) => {
  seed("late");
  await loginAs(page, "anna");
  await page.goto(SEASON);
  const missing = page.locator("section.card").filter({ has: page.getByRole("heading", { name: "Chi manca" }) });
  await expect(missing).toBeVisible();
  await expect(missing.getByText("carla")).toBeVisible();
  await expect(missing.getByText("dario")).toBeVisible();
  await expect(missing.getByLabel("Sposta la scadenza")).toBeVisible();

  seed("screening");
  await page.goto(SEASON);
  await expect(card(page)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Chi manca" })).toHaveCount(0);
});

test("a 375px niente scroll orizzontale con la card della prossima proiezione", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  seed("screening");
  await loginAs(page, "anna");
  await page.goto(SEASON);
  await expect(card(page)).toBeVisible();
  await expectNoHorizontalScroll(page);
  expect((await page.request.post(`${API}/next-screening`, { data: { screeningAt: future(2).iso, location: "Casa di Anna, via dei Cinefili 12, interno 4" } })).ok()).toBe(true);
  await page.reload();
  await expect(card(page)).toContainText("via dei Cinefili");
  await expectNoHorizontalScroll(page);
});
