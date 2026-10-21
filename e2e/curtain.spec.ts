import type { Page } from "@playwright/test";
import { expect, expectNoHorizontalScroll, loginAs, seed, test } from "./helpers";

/** Registra ogni `data-state` che il sipario attraversa da qui in poi (una nuova chiamata riparte da zero). */
async function recordCurtain(page: Page) {
  await page.evaluate(() => {
    const curtain = document.querySelector<HTMLElement>(".curtain")!;
    const w = window as unknown as { curtainStates?: string[] };
    const observed = !!w.curtainStates;
    w.curtainStates = [];
    if (observed) return;
    new MutationObserver(() => w.curtainStates!.push(curtain.dataset.state!)).observe(curtain, { attributeFilter: ["data-state"] });
  });
  return () => page.evaluate(() => (window as unknown as { curtainStates: string[] }).curtainStates);
}

const curtain = (page: Page) => page.locator(".curtain");

test.describe("sipario", () => {
  test.use({ reducedMotion: "no-preference" });

  test("da I miei cineforum al cineforum si chiude e si riapre; indietro si riapre sulla pagina", async ({ page }) => {
    seed("base");
    await loginAs(page, "anna");
    await page.goto("/cineforums");
    const states = await recordCurtain(page);
    await page.getByRole("link", { name: /Cinofili del giovedì/ }).click();
    await expect(curtain(page)).toHaveAttribute("data-state", /closing|closed/);
    await expect(page).toHaveURL("/cineforums/1");
    await expect(curtain(page)).toHaveAttribute("data-state", "open");
    expect(await states()).toEqual(["closing", "closed", "opening", "open"]);

    const back = await recordCurtain(page);
    await page.goBack();
    await expect(page).toHaveURL("/cineforums");
    await expect(curtain(page)).toHaveAttribute("data-state", "open");
    expect(await back()).toEqual(["closed", "opening", "open"]);
  });

  test("il cambio di sezione del cineforum non lo cala", async ({ page }) => {
    seed("base");
    await loginAs(page, "anna");
    await page.goto("/cineforums/1");
    const states = await recordCurtain(page);
    await page.getByRole("navigation", { name: "Sezioni del cineforum" }).getByRole("link", { name: "Membri" }).click();
    await expect(page).toHaveURL("/cineforums/1/members");
    await expect(page.getByRole("heading", { name: /^Membri · / })).toBeVisible();
    await page.waitForTimeout(500);
    expect(await states()).toEqual([]);
  });
});

test("con prefers-reduced-motion il sipario non compare", async ({ page }) => {
  seed("base");
  await loginAs(page, "anna");
  await page.goto("/cineforums");
  const states = await recordCurtain(page);
  await page.getByRole("link", { name: /Cinofili del giovedì/ }).click();
  await expect(page).toHaveURL("/cineforums/1");
  await expect(curtain(page)).toBeHidden();
  expect(await states()).toEqual([]);
});

test.describe("occhio di bue, desktop con il mouse", () => {
  test.use({ reducedMotion: "no-preference", viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });

  test("si accende sul lato e si spegne sulla colonna", async ({ page }) => {
    await page.goto("/login");
    const light = page.locator(".spotlight");
    // il primo movimento può arrivare prima dell'idratazione: si muove finché la luce non si accende
    let x = 80;
    await expect(async () => {
      await page.mouse.move(x++, 400);
      await expect(light).toHaveCSS("opacity", "1", { timeout: 1000 });
    }).toPass();
    await page.mouse.move(640, 400);
    await expect(light).toHaveCSS("opacity", "0");
  });
});

test.describe("occhio di bue su iPhone", () => {
  test.use({ reducedMotion: "no-preference", viewport: { width: 1024, height: 800 } });

  test("non si vede, neanche fuori dalla colonna", async ({ page }) => {
    await page.goto("/login");
    await page.mouse.move(40, 400);
    await page.waitForTimeout(500);
    await expect(page.locator(".spotlight")).toHaveCSS("opacity", "0");
  });
});

test("a 375px niente scroll orizzontale con colonna e luce", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  seed("base");
  await loginAs(page, "anna");
  for (const path of ["/", "/cineforums", "/cineforums/1", "/cineforums/1/members"]) {
    await page.goto(path);
    await expectNoHorizontalScroll(page);
  }
});
