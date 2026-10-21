import { expect, expectNoHorizontalScroll, loginAs, seed, test } from "./helpers";

test("da non loggato: titolo, cinque passi e i link per entrare", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Ognuno porta un film\.\s*Nessuno sa di chi è\./);
  await expect(page.locator("#come ol > li")).toHaveCount(5);
  await expect(page.getByRole("heading", { name: "La serata degli Oscar" })).toBeVisible();
  for (const link of await page.getByRole("link", { name: "Crea il tuo cineforum" }).all()) await expect(link).toHaveAttribute("href", "/signup");
  await expect(page.getByRole("link", { name: "Accedi" })).toHaveAttribute("href", "/login");
  await expect(page.getByRole("link", { name: "Ho già un account" })).toHaveAttribute("href", "/login");
  await page.getByRole("link", { name: "Accedi" }).click();
  await expect(page).toHaveURL("/login");
});

test("da loggato i link portano ai propri cineforum", async ({ page }) => {
  seed("base");
  await loginAs(page, "anna");
  await page.goto("/");
  const links = page.getByRole("link", { name: "Vai ai tuoi cineforum" });
  await expect(links).toHaveCount(3);
  for (const link of await links.all()) await expect(link).toHaveAttribute("href", "/cineforums");
  await expect(page.getByRole("link", { name: /Accedi|Crea il tuo cineforum|Ho già un account/ })).toHaveCount(0);
});

test("Provala: la busta si apre e si richiude", async ({ page }) => {
  await page.goto("/");
  const winner = page.getByText("Cars - Motori ruggenti", { exact: true });
  await expect(winner).toBeHidden();
  await page.getByRole("button", { name: "Apri la busta" }).click();
  await expect(winner).toBeVisible();
  await expect(page.getByText("proposto da Nicola · media 99")).toBeVisible();
  await expect(page.getByRole("img", { name: "Locandina di Cars - Motori ruggenti" })).toBeVisible();
  await page.getByRole("button", { name: "Richiudi" }).click();
  await expect(winner).toBeHidden();
  await expect(page.getByRole("button", { name: "Apri la busta" })).toBeVisible();
});

test("una domanda frequente si apre", async ({ page }) => {
  await page.goto("/");
  const answer = page.getByText("Niente. Cinetable è un progetto tra amici");
  await expect(answer).toBeHidden();
  await page.getByText("Quanto costa?").click();
  await expect(answer).toBeVisible();
});

test("a 375px niente scroll orizzontale, e senza movimento ridotto le sezioni compaiono", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");
  await expectNoHorizontalScroll(page);
  const last = page.getByRole("heading", { name: "Il prossimo giovedì, chi porta il film?" });
  await last.scrollIntoViewIfNeeded();
  await expect.poll(() => last.evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
  await expectNoHorizontalScroll(page);
});
