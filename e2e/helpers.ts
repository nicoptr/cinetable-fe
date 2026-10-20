import { execFileSync } from "node:child_process";
import { expect, type Page } from "@playwright/test";

/** Token in chiaro fissi del seed (cinofili-be/scripts/e2e-seed.js): nel DB c'è solo l'hash. */
export const INVITE_TOKEN_NEW = "e2e0000000000000000000000000000000000000000000000000000000000001"; // ospite@e2e.it → Cinofili del giovedì
export const INVITE_TOKEN_CARLA = "e2e0000000000000000000000000000000000000000000000000000000000002"; // carla@e2e.it → Cineclub di Dario
export const VERIFY_TOKEN = "e2e0000000000000000000000000000000000000000000000000000000000003"; // nuovo@e2e.it
export const PASSWORD = "password-e2e";

export type Scenario = "base" | "open" | "screening" | "final" | "done";
export type Player = "anna" | "bruno" | "carla" | "dario";

/** Svuota il DB e2e e lo ricrea nello scenario dato (id e ordine sempre uguali). */
export function seed(scenario: Scenario) {
  execFileSync("node", ["../cinofili-be/scripts/e2e-seed.js", scenario], { stdio: "pipe" });
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
