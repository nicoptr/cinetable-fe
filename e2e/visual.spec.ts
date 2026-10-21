import type { Page } from "@playwright/test";
import { expect, expectNoHorizontalScroll, loginAs, seed, test, type Player, type Scenario } from "./helpers";
import { isoToRomeLocal } from "../src/lib/format";

const SEASON = "/cineforums/1/seasons/1";

type Shot = { name: string; scenario: Scenario; as?: Player; path: string; setup?: (page: Page) => Promise<void>; instant?: boolean };

async function createDraft(page: Page) {
  await page.goto("/cineforums/1/seasons/new");
  await page.getByLabel("Nome", { exact: true }).fill("Autunno");
  await page.getByLabel("Chiusura candidature").fill(isoToRomeLocal(new Date(Date.now() + 7 * 86400000).toISOString()));
  for (const l of ["Horror anni '80", "Commedia italiana", "Miglior film", "Miglior regia"]) await page.getByLabel(l).check();
  await page.getByRole("button", { name: "Crea la bozza" }).click();
  await expect(page).toHaveURL(/\/seasons\/\d+$/);
}

async function openEnvelope(page: Page, name: RegExp) {
  const button = page.getByRole("button", { name });
  await button.click();
  await button.click();
  await expect(page.locator(".env-content")).toBeVisible();
}

async function opened(page: Page, name: RegExp) {
  await openEnvelope(page, name);
  const caption = page.locator(".env-content .envelope-caption").last();
  await expect.poll(() => caption.evaluate((e) => getComputedStyle(e).opacity), { timeout: 5000 }).toBe("1");
}

/** A metà apertura: lembo aperto, busta che scende, locandina che sale. */
async function midway(page: Page, name: RegExp) {
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await openEnvelope(page, name);
  await page.waitForTimeout(1000);
}

/** Locandine lazy caricate e indicatore di sviluppo di Next nascosto, così lo screenshot mostra la pagina vera. */
async function settle(page: Page) {
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  for (const img of await page.locator("img").all()) {
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete)).toBe(true);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}

const SHOTS: Shot[] = [
  { name: "home", scenario: "base", path: "/" },
  { name: "login", scenario: "base", path: "/login" },
  { name: "signup", scenario: "base", path: "/signup" },
  { name: "signup-invite", scenario: "base", path: "/signup?invite=x&email=ospite@e2e.it" },
  { name: "forgot-password", scenario: "base", path: "/forgot-password" },
  { name: "not-found", scenario: "base", as: "anna", path: "/nope" },
  { name: "cineforums", scenario: "base", as: "anna", path: "/cineforums" },
  { name: "menu", scenario: "base", as: "carla", path: "/cineforums", setup: (p) => p.getByRole("button", { name: "Menu" }).click() },
  { name: "cineforum", scenario: "base", as: "anna", path: "/cineforums/1" },
  { name: "cineforum-member", scenario: "open", as: "bruno", path: "/cineforums/1" },
  { name: "members", scenario: "base", as: "anna", path: "/cineforums/1/members" },
  { name: "settings", scenario: "base", as: "anna", path: "/cineforums/1/settings" },
  { name: "season-new", scenario: "base", as: "anna", path: "/cineforums/1/seasons/new" },
  { name: "season-draft", scenario: "base", as: "anna", path: "", setup: createDraft },
  { name: "invitations", scenario: "base", as: "carla", path: "/invitations" },
  { name: "invitations-empty", scenario: "base", as: "anna", path: "/invitations" },
  { name: "profile", scenario: "base", as: "anna", path: "/profile" },
  { name: "season-open", scenario: "open", as: "anna", path: SEASON },
  { name: "season-screening", scenario: "screening", as: "anna", path: SEASON },
  { name: "season-screening-opened", scenario: "screening", as: "anna", path: SEASON, setup: (p) => opened(p, /Film n\. 1/) },
  { name: "season-screening-midway", scenario: "screening", as: "anna", path: SEASON, setup: (p) => midway(p, /Film n\. 1/), instant: true },
  { name: "season-final", scenario: "final", as: "anna", path: SEASON },
  { name: "season-final-opened", scenario: "final", as: "anna", path: SEASON, setup: (p) => opened(p, /^Miglior film\./) },
  { name: "season-final-midway", scenario: "final", as: "anna", path: SEASON, setup: (p) => midway(p, /^Miglior film\./), instant: true },
  { name: "film-vote", scenario: "final", as: "anna", path: `${SEASON}/films/2` },
  { name: "film-own", scenario: "final", as: "anna", path: `${SEASON}/films/1` },
  { name: "season-done", scenario: "done", as: "anna", path: SEASON },
  { name: "summary", scenario: "done", as: "anna", path: `${SEASON}/summary` },
];

for (const width of [360, 1280]) {
  test.describe(`${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, deviceScaleFactor: width < 640 ? 2 : 1, locale: "it-IT" });

    for (const shot of SHOTS) {
      test(shot.name, async ({ page }) => {
        seed(shot.scenario);
        if (shot.as) await loginAs(page, shot.as);
        if (shot.path) await page.goto(shot.path);
        await shot.setup?.(page);
        await expectNoHorizontalScroll(page);
        if (!shot.instant) await settle(page);
        await page.screenshot({ path: `e2e/screenshots/${width}/${shot.name}.png`, fullPage: true });
      });
    }
  });
}
