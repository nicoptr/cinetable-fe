import { execFileSync } from "node:child_process";
import { randomInt } from "node:crypto";
import path from "node:path";
import { test as base, expect, type Page } from "@playwright/test";

export { expect };

/**
 * `test` di tutti gli spec: ogni test manda un `X-Forwarded-For` suo (il backend e2e ha TRUST_PROXY=1 e Next lo inoltra così com'è),
 * così i rate limit per IP del backend (es. 10 login/min) non si sommano tra un test e l'altro.
 */
export const test = base.extend({
  extraHTTPHeaders: async ({ extraHTTPHeaders }, provide) => {
    await provide({ ...extraHTTPHeaders, "x-forwarded-for": `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}` });
  },
});

/** Token in chiaro fissi del seed (cinofili-be/scripts/e2e-seed.js): nel DB c'è solo l'hash. */
export const INVITE_TOKEN_NEW = "e2e0000000000000000000000000000000000000000000000000000000000001"; // ospite@e2e.it → Cinofili del giovedì
export const INVITE_TOKEN_CARLA = "e2e0000000000000000000000000000000000000000000000000000000000002"; // carla@e2e.it → Cineclub di Dario
export const VERIFY_TOKEN = "e2e0000000000000000000000000000000000000000000000000000000000003"; // nuovo@e2e.it
export const PASSWORD = "password-e2e";

export type Scenario = "base" | "open" | "late" | "screening" | "final" | "done";
export type Player = "anna" | "bruno" | "carla" | "dario";

/** Svuota il DB e2e e lo ricrea nello scenario dato (id e ordine sempre uguali). */
export function seed(scenario: Scenario) {
  execFileSync("node", [path.resolve(__dirname, "../../cinofili-be/scripts/e2e-seed.js"), scenario], { stdio: "pipe" });
}

/** Login dalla UI di `/login`. */
export async function loginAs(page: Page, who: Player) {
  await page.goto("/login");
  await page.getByLabel("Email o nome utente").fill(`${who}@e2e.it`);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Accedi" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

export async function expectNoHorizontalScroll(page: Page) {
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(fits, "la pagina scorre in orizzontale").toBe(true);
}
