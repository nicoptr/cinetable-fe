import type { Page } from "@playwright/test";
import { expect, expectNoHorizontalScroll, loginAs, seed, test } from "./helpers";

const SEASON = "/cineforums/1/seasons/1";
const SUMMARY = `${SEASON}/summary`;

// voti fissi del seed (cinofili-be/scripts/e2e-seed.js): medie arrotondate a una cifra
const FILMS = [
  { title: "La cosa", proposer: "anna", film: "68,3", direction: "90,0" },
  { title: "Ghostbusters", proposer: "bruno", film: "55,0", direction: "45,0" },
  { title: "Fight Club", proposer: "carla", film: "90,0", direction: "68,3" },
  { title: "Nuovo Cinema Paradiso", proposer: "dario", film: "71,7", direction: "60,0" },
];

const envelope = (page: Page, award: string) => page.getByRole("button", { name: new RegExp(`^${award}\\.`) });

async function open(page: Page, award: string) {
  await envelope(page, award).click();
  await expect(envelope(page, award)).toContainText("Tocca di nuovo per aprire");
  await envelope(page, award).click();
}

test("anna apre le due buste; all'ultima la rassegna è conclusa", async ({ page }) => {
  seed("final");
  await loginAs(page, "anna");
  await page.goto(SEASON);
  await expect(page.getByText("Serata finale", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Le buste" })).toBeVisible();

  await open(page, "Miglior film");
  const film = page.getByRole("region", { name: "Miglior film" });
  await expect(film.getByRole("heading", { name: "Fight Club" })).toBeVisible();
  await expect(film).toContainText("proposto da carla");
  await expect(film).toContainText("90,0");
  await expect(film).toContainText("3 voti");
  await expect(page.locator(".env-content")).toBeFocused();

  await open(page, "Miglior regia");
  const direction = page.getByRole("region", { name: "Miglior regia" });
  await expect(direction.getByRole("heading", { name: "La cosa" })).toBeVisible();
  await expect(direction).toContainText("proposto da anna");

  await page.reload();
  await expect(page.getByText("Rassegna conclusa")).toBeVisible();
  await page.getByRole("link", { name: "Scheda della rassegna" }).click();
  await expect(page).toHaveURL(SUMMARY);
  await expectNoHorizontalScroll(page);
});

test("una busta alla volta: mentre una si apre l'altra è disabilitata", async ({ page }) => {
  seed("final");
  await loginAs(page, "anna");
  await page.goto(SEASON);
  let release!: () => void;
  const held = new Promise<void>((r) => (release = r));
  await page.route("**/awards/*/open", async (route) => {
    await held;
    await route.continue();
  });
  await open(page, "Miglior film");
  await expect(envelope(page, "Miglior film")).toBeDisabled();
  await expect(envelope(page, "Miglior regia")).toBeDisabled();
  release();
  const film = page.getByRole("region", { name: "Miglior film" });
  await expect(film.getByRole("heading", { level: 3, name: "Miglior film" })).toBeVisible();
  await expect(film.getByRole("heading", { level: 4, name: "Fight Club" })).toBeVisible();
  // anche durante l'animazione
  await expect(envelope(page, "Miglior regia")).toBeDisabled();
  await expect(envelope(page, "Miglior regia")).toBeEnabled({ timeout: 5000 });
});

test("prima di aprire il voto su tutti i film la busta mostra l'errore e resta chiusa", async ({ page }) => {
  seed("final");
  await loginAs(page, "anna");
  await page.goto(SEASON);
  await page.route("**/awards/*/open", (route) =>
    route.fulfill({ status: 400, json: { error: "Bad Request", code: "BAD_REQUEST", message: "Apri il voto su tutti i film prima della serata finale" } }),
  );
  await open(page, "Miglior film");
  await expect(page.getByRole("alert").filter({ hasText: "Apri il voto su tutti i film prima della serata finale" })).toBeVisible();
  await expect(envelope(page, "Miglior film")).toBeEnabled();
  await expect(envelope(page, "Miglior regia")).toBeEnabled();
});

test("bruno vede i risultati solo delle buste aperte", async ({ page }) => {
  seed("final");
  await loginAs(page, "bruno");
  await page.goto(SEASON);
  // in SCREENING solo il presidente vede la serata finale
  await expect(page.getByRole("heading", { name: "Le buste" })).toHaveCount(0);
  await expect(page.getByText("Serata finale", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Miglior/ })).toHaveCount(0);

  const res = await page.request.post(`/api${SEASON}/awards/1/open`);
  expect(res.status()).toBe(403);

  // anna apre "Miglior film" dall'API
  await page.context().clearCookies();
  await loginAs(page, "anna");
  expect((await page.request.post(`/api${SEASON}/awards/1/open`)).ok()).toBe(true);
  await page.context().clearCookies();
  await loginAs(page, "bruno");

  await page.goto(SEASON);
  const results = page.getByRole("region", { name: "Risultati" });
  await expect(results.getByRole("heading", { name: "Miglior film" })).toBeVisible();
  await expect(results).toContainText("Fight Club");
  await expect(results).toContainText("proposto da carla");
  await expect(results.getByRole("heading", { name: "Miglior regia" })).toHaveCount(0);
  // il vincitore della regia e gli altri proponenti restano segreti
  await expect(page.getByText(/proposto da (anna|bruno|dario)/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Miglior/ })).toHaveCount(0);
});

test("la scheda mostra albo d'oro, film in ordine con medie, nessun voto singolo", async ({ page }) => {
  seed("done");
  await loginAs(page, "bruno");
  await page.goto(SEASON);
  await expect(page.getByText("Rassegna conclusa")).toBeVisible();
  const results = page.getByRole("region", { name: "Risultati" });
  await expect(results.getByRole("heading", { level: 3 })).toHaveText(["Miglior film", "Miglior regia"]);

  await page.goto(SUMMARY);
  await expect(page.getByRole("heading", { level: 1, name: "Stagione 1" })).toBeVisible();

  const gold = page.getByRole("region", { name: "Albo d'oro" });
  await expect(gold.getByRole("heading", { level: 3 })).toHaveText(["Miglior film", "Miglior regia"]);
  const bestFilm = gold.getByRole("region", { name: "Miglior film" });
  const bestDirection = gold.getByRole("region", { name: "Miglior regia" });
  await expect(bestFilm).toContainText("Fight Club");
  await expect(bestFilm).toContainText("proposto da carla");
  await expect(bestDirection).toContainText("La cosa");
  await expect(bestDirection).toContainText("proposto da anna");

  const films = page.getByRole("list", { name: "I film" }).getByRole("listitem");
  await expect(films.getByRole("heading")).toHaveText(FILMS.map((f) => f.title));
  for (const [i, f] of FILMS.entries()) {
    const row = films.nth(i);
    await expect(row).toContainText(`proposto da ${f.proposer}`);
    await expect(row.getByText(/^Miglior film/)).toContainText(`media ${f.film} · 3 voti`);
    await expect(row.getByText(/^Miglior regia/)).toContainText(`media ${f.direction} · 3 voti`);
  }
  await expect(films.nth(2).getByLabel("Premio vinto")).toHaveCount(1);
  await expect(films.nth(0).getByLabel("Premio vinto")).toHaveCount(1);
  await expect(films.nth(1).getByLabel("Premio vinto")).toHaveCount(0);
  // nessun voto singolo (es. 95 di dario a Fight Club, di bruno alla regia de La cosa)
  await expect(page.getByRole("list", { name: "I film" })).not.toContainText(/\b(95|85|40)\b/);

  await expect(page.getByRole("region", { name: "Partecipanti" })).toContainText(/anna[\s\S]*bruno[\s\S]*carla[\s\S]*dario/);
  await expectNoHorizontalScroll(page);

  await expect(page.locator("header")).toBeVisible();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("header")).toBeHidden();
  const colors = await page.evaluate(() => [getComputedStyle(document.body).backgroundColor, getComputedStyle(document.body).color]);
  expect(colors).toEqual(["rgb(255, 255, 255)", "rgb(0, 0, 0)"]);
});

test("scheda prima della fine → Non trovato", async ({ page }) => {
  seed("final");
  await loginAs(page, "bruno");
  await page.goto(SUMMARY);
  await expect(page.getByRole("heading", { name: "Non trovato" })).toBeVisible();
  await page.goto(`/cineforums/1/seasons/abc/summary`);
  await expect(page.getByRole("heading", { name: "Non trovato" })).toBeVisible();
});
