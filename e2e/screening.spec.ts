import type { Page } from "@playwright/test";
import { expect, loginAs, scheduleAndReveal, scheduleNext, seed, test, type Player } from "./helpers";

// la busta si prova con l'animazione completa
test.use({ reducedMotion: "no-preference" });

const SEASON = "/cineforums/1/seasons/1";
const API = `/api${SEASON}`;
// chi ha candidato cosa nel seed (cinetable-be/scripts/e2e-seed.js)
const PROPOSER: Record<number, Player> = { 1091: "anna", 620: "bruno", 550: "carla", 11216: "dario" };
const TITLES = /La cosa|Ghostbusters|Fight Club|Nuovo Cinema Paradiso/;

type Item = { order: number; movie: { tmdbId: number; title: string } };

async function program(page: Page): Promise<Item[]> {
  const res = await page.request.get(API);
  expect(res.ok()).toBe(true);
  return (await res.json()).program;
}

async function switchTo(page: Page, who: Player) {
  await page.context().clearCookies();
  await loginAs(page, who);
}

/** Il contenuto svelato deve arrivare davvero a opacità 1: un'animazione bloccata a 0 fallisce. */
async function expectContentVisible(page: Page, timeout = 5000) {
  await expect.poll(() => page.locator(".env-content").evaluate((e) => getComputedStyle(e).opacity), { timeout }).toBe("1");
}

const envelope = (page: Page, n: number) => page.getByRole("button", { name: new RegExp(`Film n\\. ${n}`) });
const skip = (page: Page) => page.getByRole("button", { name: "Salta il conto alla rovescia" }).click();

test("senza proiezione programmata la busta non c'è", async ({ page }) => {
  seed("screening");
  await loginAs(page, "anna");
  await page.goto(SEASON);
  await expect(page.getByText("Fissa data e luogo della serata: poi potrai aprire la busta del film.")).toBeVisible();
  await expect(envelope(page, 1)).toHaveCount(0);
});

test("conto alla rovescia da 5 a 1, poi il film; richiusa, la busta lo rimostra senza svelarne un altro", async ({ page }) => {
  seed("screening");
  await loginAs(page, "anna");
  await scheduleNext(page, API);
  await page.goto(SEASON);
  let reveals = 0;
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().endsWith("/reveal-next")) reveals++;
  });
  await envelope(page, 1).click();
  await envelope(page, 1).click();
  const reveal = page.getByRole("region", { name: "Film n. 1" });
  const number = reveal.locator(".leader-num");
  for (const n of ["5", "4", "3", "2", "1"]) await expect(number).toHaveText(n, { timeout: 4000 });
  await expect(reveal.getByRole("heading", { name: TITLES })).toBeVisible({ timeout: 3000 });
  await expect(number).toHaveCount(0);
  await expectContentVisible(page);
  const title = await reveal.getByRole("heading").textContent();

  await page.getByRole("button", { name: "Richiudi la busta" }).click();
  await expect(envelope(page, 1)).toBeFocused();
  await envelope(page, 1).click();
  await envelope(page, 1).click();
  await expect(number).toHaveText("5");
  await skip(page);
  await expect(reveal.getByRole("heading")).toHaveText(title!);
  // saltato, il conto alla rovescia non riparte
  await page.waitForTimeout(6000);
  await expect(number).toHaveCount(0);
  expect(reveals).toBe(1);
  expect(await program(page)).toHaveLength(1);
});

test("anna svela il primo film con la busta e lo vede nel programma", async ({ page }) => {
  seed("screening");
  await loginAs(page, "anna");
  await scheduleNext(page, API);
  await page.goto(SEASON);
  await envelope(page, 1).click();
  await expect(envelope(page, 1)).toContainText("Tocca di nuovo per aprire");
  await envelope(page, 1).click();
  await skip(page);
  const reveal = page.getByRole("region", { name: "Film n. 1" });
  await expect(reveal.getByRole("heading", { name: TITLES })).toBeVisible();
  const [first] = await program(page);
  expect(first.order).toBe(1);
  await expect(reveal.getByRole("heading")).toHaveText(first.movie.title);
  await expectContentVisible(page);
  await expect(page.locator(".env-content")).toBeFocused();
  const list = page.getByRole("list", { name: "Programma" });
  await expect(list.getByRole("link")).toHaveCount(1);
  await expect(list.getByRole("link")).toContainText(first.movie.title);
  await expect(list.getByLabel("Film da svelare")).toHaveCount(3);
  // il prossimo si svela solo dopo la proiezione
  await expect(page.getByText("In proiezione")).toBeVisible();
});

test("doppio tocco sulla busta non svela due film", async ({ page }) => {
  seed("screening");
  await loginAs(page, "anna");
  await scheduleNext(page, API);
  await page.goto(SEASON);
  let reveals = 0;
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().endsWith("/reveal-next")) reveals++;
  });
  await envelope(page, 1).click(); // arma
  // due tocchi nello stesso tick, prima che React ridisegni: solo il ref `busy` li separa
  await envelope(page, 1).evaluate((b: HTMLButtonElement) => {
    b.click();
    b.click();
  });
  await skip(page);
  await expect(page.getByRole("region", { name: "Film n. 1" }).getByRole("heading", { name: TITLES })).toBeVisible();
  expect(reveals).toBe(1);
  expect(await program(page)).toHaveLength(1);
  await expect(page.getByRole("list", { name: "Programma" }).getByRole("link")).toHaveCount(1);
});

test("programmo la proiezione e apro il voto; bruno vota con gli slider", async ({ page }) => {
  seed("screening");
  await loginAs(page, "anna");
  const item: Item = await scheduleAndReveal(page, API, 1500);
  await page.goto(`${SEASON}/films/1`);
  await expect(page.getByRole("heading", { name: item.movie.title, level: 1 })).toBeVisible();
  await expect(page.getByText("Sala Verdi")).toBeVisible();
  const open = page.getByRole("button", { name: "Apri il voto" });
  await open.click();
  await page.getByRole("button", { name: "Tocca di nuovo per confermare" }).click();
  await expect(page.getByText("Mancano 3 voti")).toBeVisible();

  const voter: Player = PROPOSER[item.movie.tmdbId] === "bruno" ? "carla" : "bruno";
  await switchTo(page, voter);
  await page.goto(SEASON);
  await expect(page.getByRole("list", { name: "Programma" }).getByText("Voto aperto")).toBeVisible();
  await page.getByRole("list", { name: "Programma" }).getByRole("link").click();
  await expect(page).toHaveURL(new RegExp(`${SEASON}/films/1$`));

  const film = page.getByRole("slider", { name: /Miglior film/ });
  await expect(film).toHaveAccessibleName(/Quanto ti è piaciuto\?/);
  const send = page.getByRole("button", { name: "Invia i voti" });
  await expect(send).toBeDisabled();
  await expect(page.getByText("Muovi tutti i cursori per votare")).toBeVisible();
  await expect(page.locator("output")).toHaveText(["–", "–"]);
  await film.fill("80");
  await film.press("ArrowRight");
  await expect(page.getByRole("status").filter({ hasText: "81" })).toBeVisible();
  await expect(send).toBeDisabled(); // manca ancora la regia
  await page.getByRole("slider", { name: /Miglior regia/ }).fill("40");
  await expect(page.getByText("Muovi tutti i cursori per votare")).toHaveCount(0);
  await expect(page.getByText("I voti non si possono modificare")).toBeVisible();
  await expect(send).toBeEnabled();
  await send.click();
  const posted = page.waitForRequest((r) => r.method() === "POST" && r.url().endsWith("/program/1/votes"));
  await page.getByRole("button", { name: "Tocca di nuovo per confermare" }).click();
  const votes: { awardId: number; value: number }[] = (await posted).postDataJSON().votes;
  expect(votes.sort((a, b) => a.awardId - b.awardId)).toEqual([
    { awardId: 1, value: 81 },
    { awardId: 2, value: 40 },
  ]);
  await expect(page.getByText("I tuoi voti")).toBeVisible();
  await expect(page.getByRole("slider")).toHaveCount(0);
  await expect(page.getByText("Miglior film: 81")).toBeVisible();
  await expect(page.getByText("Miglior regia: 40")).toBeVisible();

  await page.goto(SEASON);
  await expect(page.getByRole("list", { name: "Programma" }).getByText("Hai votato")).toBeVisible();
  await switchTo(page, "anna");
  await page.goto(`${SEASON}/films/1`);
  await expect(page.getByText("Mancano 2 voti")).toBeVisible();
  await page.getByRole("button", { name: "Sollecita" }).click();
  await expect(page.getByText("Sollecito inviato a 2 persone")).toBeVisible();
});

test("un tocco sul cursore a riposo (50) conta come voto", async ({ page }) => {
  seed("screening");
  await loginAs(page, "anna");
  const item: Item = await scheduleAndReveal(page, API, 1500);
  expect((await page.request.post(`${API}/program/1/open-voting`)).ok()).toBe(true);
  await switchTo(page, PROPOSER[item.movie.tmdbId] === "bruno" ? "carla" : "bruno");
  await page.goto(`${SEASON}/films/1`);

  const send = page.getByRole("button", { name: "Invia i voti" });
  const outputs = page.locator("output");
  await page.getByRole("slider", { name: /Miglior film/ }).click(); // al centro: il valore resta 50, nessun `input`
  await expect(outputs).toHaveText(["50", "–"]);
  await expect(send).toBeDisabled();
  await page.getByRole("slider", { name: /Miglior regia/ }).click();
  await expect(outputs).toHaveText(["50", "50"]);
  await expect(send).toBeEnabled();
  await expect(page.getByText("Muovi tutti i cursori per votare")).toHaveCount(0);
});

test("il proponente vede 'Questo è il tuo film'", async ({ page }) => {
  seed("final"); // ordine fisso: 2 = Ghostbusters di bruno
  await loginAs(page, "bruno");
  await page.goto(SEASON);
  await expect(page.getByRole("list", { name: "Programma" }).getByRole("link", { name: /Ghostbusters/ })).toContainText("Il tuo film");
  await page.goto(`${SEASON}/films/2`);
  await expect(page.getByText("Questo è il tuo film: non puoi votarlo")).toBeVisible();
  await expect(page.getByRole("slider")).toHaveCount(0);
});

test("film inesistente: 404", async ({ page }) => {
  seed("final");
  await loginAs(page, "bruno");
  const res = await page.goto(`${SEASON}/films/9`);
  expect(res?.status()).toBe(404);
});

test("con prefers-reduced-motion la busta si apre comunque", async ({ page }) => {
  seed("screening");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await loginAs(page, "anna");
  await scheduleNext(page, API);
  await page.goto(SEASON);
  await envelope(page, 1).click();
  await envelope(page, 1).click();
  const reveal = page.getByRole("region", { name: "Film n. 1" });
  await expect(reveal.getByRole("heading", { name: TITLES })).toBeVisible();
  const [first] = await program(page);
  await expect(reveal.getByRole("heading")).toHaveText(first.movie.title);
  expect(await page.locator(".env-content").evaluate((e) => getComputedStyle(e).animationDuration)).toBe("0.3s");
  await expectContentVisible(page, 1000);
  await expect(page.getByRole("button", { name: "Salta il conto alla rovescia" })).toHaveCount(0);
});
