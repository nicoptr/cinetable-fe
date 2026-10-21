import type { Page } from "@playwright/test";
import { expect, expectNoHorizontalScroll, loginAs, seed, test } from "./helpers";

const SECTIONS = [
  { name: "Edizioni", path: "/cineforums/1" },
  { name: "Membri", path: "/cineforums/1/members" },
  { name: "Categorie", path: "/cineforums/1/categories" },
  { name: "Premi", path: "/cineforums/1/awards" },
];

async function expectNoEditing(page: Page) {
  for (const name of [/Nuov[ao]/, /Modifica/, /Elimina/]) await expect(page.getByRole("button", { name })).toHaveCount(0);
}

test("membro: Categorie e Premi in sola lettura", async ({ page }) => {
  seed("base");
  await loginAs(page, "bruno");
  await page.goto("/cineforums/1/categories");
  await expect(page.getByRole("heading", { name: "Categorie · 2" })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "Horror anni '80" })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "Commedia italiana" })).toBeVisible();
  await expectNoEditing(page);
  await page.goto("/cineforums/1/awards");
  await expect(page.getByRole("heading", { name: "Premi · 2" })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "Miglior regia" })).toBeVisible();
  await expectNoEditing(page);
});

test("presidente: Categorie e Premi modificabili", async ({ page }) => {
  seed("base");
  await loginAs(page, "anna");
  await page.goto("/cineforums/1/categories");
  await expect(page.getByRole("button", { name: "+ Nuova categoria" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Modifica Horror anni '80" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Elimina Horror anni '80" })).toBeVisible();
  await page.goto("/cineforums/1/awards");
  await expect(page.getByRole("button", { name: "+ Nuovo premio" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Modifica Miglior film" })).toBeVisible();
});

test("navigazione tra le sezioni: il link attivo ha aria-current", async ({ page }) => {
  seed("base");
  await loginAs(page, "bruno");
  await page.goto("/cineforums/1");
  const nav = page.getByRole("navigation", { name: "Sezioni del cineforum" });
  for (const s of [...SECTIONS.slice(1), SECTIONS[0]]) {
    await nav.getByRole("link", { name: s.name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${s.path}$`));
    await expect(nav.getByRole("link", { name: s.name, exact: true })).toHaveAttribute("aria-current", "page");
    await expect(nav.locator("[aria-current]")).toHaveCount(1);
  }
  await page.getByRole("link", { name: "I miei cineforum" }).click();
  await expect(page).toHaveURL(/\/cineforums$/);
});

test("Edizioni con done: solo la card Concluse, che porta alla scheda", async ({ page }) => {
  seed("done");
  await loginAs(page, "anna");
  await page.goto("/cineforums/1");
  await expect(page.getByRole("heading", { name: "Concluse" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "In corso" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Stagione 1/ })).toHaveAttribute("href", "/cineforums/1/seasons/1/summary");
});

test("Edizioni con open: solo la card In corso", async ({ page }) => {
  seed("open");
  await loginAs(page, "bruno");
  await page.goto("/cineforums/1");
  await expect(page.getByRole("heading", { name: "In corso" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Concluse" })).toHaveCount(0);
});

test("Edizioni senza edizioni: nessuna card, solo il messaggio", async ({ page }) => {
  seed("base");
  await loginAs(page, "anna");
  await page.goto("/cineforums/1");
  await expect(page.getByText("Nessuna edizione.")).toBeVisible();
  await expect(page.locator("main .card")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "+ Nuova edizione" })).toBeVisible();
});

test.describe("375px", () => {
  test.use({ viewport: { width: 375, height: 800 } });
  test("nessuno scroll orizzontale nelle quattro sezioni", async ({ page }) => {
    seed("open");
    await loginAs(page, "anna");
    for (const s of SECTIONS) {
      await page.goto(s.path);
      await expect(page.getByRole("navigation", { name: "Sezioni del cineforum" })).toBeVisible();
      await expectNoHorizontalScroll(page);
    }
  });
});

test.describe("1280px", () => {
  test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false });
  test("la navigazione sta in colonna a sinistra del contenuto", async ({ page }) => {
    seed("base");
    await loginAs(page, "anna");
    await page.goto("/cineforums/1/members");
    const nav = await page.getByRole("navigation", { name: "Sezioni del cineforum" }).boundingBox();
    const content = await page.getByRole("heading", { name: /^Membri · / }).boundingBox();
    expect(nav && content).toBeTruthy();
    expect(nav!.x + nav!.width).toBeLessThanOrEqual(content!.x);
    expect(nav!.height).toBeGreaterThan(nav!.width / 2);
  });
});
