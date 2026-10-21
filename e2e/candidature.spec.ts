import type { Page } from "@playwright/test";
import { expect, loginAs, seed, test, type Player } from "./helpers";

const FILMS = [
  { tmdbId: 1091, title: "La cosa", originalTitle: "The Thing", year: 1982, posterPath: null, posterUrl: null },
  { tmdbId: 550, title: "Fight Club", originalTitle: "Fight Club", year: 1999, posterPath: null, posterUrl: null },
  { tmdbId: 620, title: "Ghostbusters", originalTitle: "Ghostbusters", year: 1984, posterPath: null, posterUrl: null },
  { tmdbId: 11216, title: "Nuovo Cinema Paradiso", originalTitle: "Nuovo Cinema Paradiso", year: 1988, posterPath: null, posterUrl: null },
];
const SEASON = "/cineforums/1/seasons/1";

async function mockSearch(page: Page) {
  await page.route("**/api/movies/search**", (r) => r.fulfill({ json: { results: FILMS, totalPages: 1 } }));
}

/** Candida dall'API con la sessione corrente (per preparare lo scenario). */
async function pickViaApi(page: Page, tmdbId: number) {
  const res = await page.request.put(`/api/cineforums/1/seasons/1/candidature`, { data: { tmdbId } });
  expect(res.ok()).toBe(true);
}

async function switchTo(page: Page, who: Player) {
  await page.context().clearCookies();
  await loginAs(page, who);
}

async function pickViaUi(page: Page, title: string) {
  await page.getByLabel("Cerca un film").fill(title.slice(0, 4));
  await page.getByRole("button", { name: new RegExp(title) }).click();
  await page.getByRole("button", { name: "Sì, candida" }).click();
}

test("bruno cerca e candida un film: vede la locandina e lo stato valido", async ({ page }) => {
  seed("open");
  await mockSearch(page);
  await loginAs(page, "bruno");
  await page.goto(SEASON);
  await expect(page.getByText("Chiusura candidature:")).toBeVisible();
  await expect(page.getByText("La tua categoria")).toBeVisible();
  await expect(page.getByText("Commedia italiana")).toBeVisible();
  await expect(page.getByText("Tienila segreta")).toBeVisible();
  await expect(page.getByText("0 film su 4")).toBeVisible();
  await pickViaUi(page, "Ghostbusters");
  await expect(page.getByRole("button", { name: "Cambia film" })).toBeVisible();
  await expect(page.getByText("Ghostbusters")).toBeVisible();
  await expect(page.getByText("1984")).toBeVisible();
  await expect(page.getByText("1 film su 4")).toBeVisible();
});

test("carla sceglie lo stesso film di bruno: avviso duplicato; bruno ricarica e vede l'avviso", async ({ page }) => {
  seed("open");
  await mockSearch(page);
  await loginAs(page, "bruno");
  await pickViaApi(page, 620);
  await switchTo(page, "carla");
  await page.goto(SEASON);
  await pickViaUi(page, "Ghostbusters");
  await expect(page.getByText("Anche un altro partecipante ha scelto questo film: scegline un altro")).toBeVisible();
  await switchTo(page, "bruno");
  await page.goto(SEASON);
  await expect(page.getByText("Anche un altro partecipante ha scelto questo film: scegline un altro")).toBeVisible();
});

test("film escluso → messaggio del backend sopra la griglia", async ({ page }) => {
  seed("open");
  await mockSearch(page);
  await loginAs(page, "bruno");
  await pickViaApi(page, 620);
  await switchTo(page, "carla");
  await pickViaApi(page, 620);
  await switchTo(page, "dario");
  await page.goto(SEASON);
  await pickViaUi(page, "Ghostbusters");
  await expect(page.locator("main [role=alert]")).toHaveText("Film non disponibile per questa rassegna");
});

test("ricerca con TMDB giù (route → 502) → messaggio 'Servizio film non disponibile, riprova'", async ({ page }) => {
  seed("open");
  await page.route("**/api/movies/search**", (r) => r.fulfill({ status: 502, json: { error: "Bad Gateway", code: "502", message: "x" } }));
  await loginAs(page, "bruno");
  await page.goto(SEASON);
  await page.getByLabel("Cerca un film").fill("ghost");
  await expect(page.locator("main [role=alert]")).toHaveText("Servizio film non disponibile, riprova");
});

test("anna (presidente) vede chi manca ma mai i film degli altri", async ({ page }) => {
  seed("open");
  await loginAs(page, "bruno");
  await pickViaApi(page, 620);
  await switchTo(page, "anna");
  await page.goto(SEASON);
  await expect(page.getByText("Chi manca")).toBeVisible();
  await expect(page.getByText("carla")).toBeVisible();
  await expect(page.getByText("bruno")).toHaveCount(0);
  await expect(page.getByText("1 film su 4")).toBeVisible();
  await expect(page.getByText("Ghostbusters")).toHaveCount(0);
  await expect(page.getByText("Sposta la scadenza")).toBeVisible();
});

test("anna toglie dalla rassegna chi non ha un film valido", async ({ page }) => {
  seed("open");
  await loginAs(page, "anna");
  await page.goto(SEASON);
  const row = page.getByRole("listitem").filter({ hasText: "dario" });
  await row.getByRole("button", { name: "Togli dalla rassegna" }).click();
  await row.getByRole("button", { name: /Tocca di nuovo/ }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "dario" })).toHaveCount(0);
  await expect(page.getByText("0 film su 3")).toBeVisible();
});

test("risposta lenta di una vecchia ricerca non sovrascrive la nuova", async ({ page }) => {
  seed("open");
  await page.route("**/api/movies/search**", async (r) => {
    const q = new URL(r.request().url()).searchParams.get("q");
    if (q === "ghos") {
      await new Promise((res) => setTimeout(res, 2500));
      return r.fulfill({ json: { results: [FILMS[2]], totalPages: 1 } });
    }
    return r.fulfill({ json: { results: [FILMS[1]], totalPages: 1 } });
  });
  await loginAs(page, "bruno");
  await page.goto(SEASON);
  const box = page.getByLabel("Cerca un film");
  await box.fill("ghos");
  await page.waitForTimeout(600); // la prima richiesta è partita
  await box.fill("fight");
  await expect(page.getByRole("button", { name: /Fight Club/ })).toBeVisible();
  await page.waitForTimeout(3000);
  await expect(page.getByRole("button", { name: /Fight Club/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Ghostbusters/ })).toHaveCount(0);
});

test("Altri risultati aggiunge la pagina 2 dello stesso termine", async ({ page }) => {
  seed("open");
  await page.route("**/api/movies/search**", (r) => {
    const u = new URL(r.request().url());
    const p = u.searchParams.get("page");
    return r.fulfill({ json: { results: p === "2" ? [FILMS[3]] : [FILMS[0]], totalPages: 2 } });
  });
  await loginAs(page, "bruno");
  await page.goto(SEASON);
  const box = page.getByLabel("Cerca un film");
  await box.fill("film");
  await expect(page.getByRole("button", { name: /La cosa/ })).toBeVisible();
  await page.getByRole("button", { name: "Altri risultati" }).click();
  await expect(page.getByRole("button", { name: /Nuovo Cinema Paradiso/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /La cosa/ })).toBeVisible();
});
