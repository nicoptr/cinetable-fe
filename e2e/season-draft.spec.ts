import { expect, loginAs, seed, test } from "./helpers";
import { isoToRomeLocal } from "../src/lib/format";
import type { Page } from "@playwright/test";

const inDays = (n: number) => isoToRomeLocal(new Date(Date.now() + n * 86400000).toISOString());

async function fillDraft(page: Page, name: string) {
  await page.goto("/cineforums/1/seasons/new");
  await page.getByLabel("Nome", { exact: true }).fill(name);
  await page.getByLabel("Chiusura candidature").fill(inDays(7));
  for (const l of ["Horror anni '80", "Commedia italiana", "Miglior film", "Miglior regia"]) await page.getByLabel(l).check();
}

test("creo una bozza con due categorie e due premi e la avvio", async ({ page }) => {
  seed("base");
  await loginAs(page, "anna");
  await fillDraft(page, "Autunno");
  await expect(page.getByLabel("anna")).toBeChecked();
  await page.getByRole("button", { name: "Crea la bozza" }).click();
  await expect(page).toHaveURL(/\/cineforums\/1\/seasons\/\d+$/);
  await expect(page.getByRole("heading", { name: "Autunno" })).toBeVisible();
  await expect(page.getByText("Bozza", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Avvia la rassegna" }).click();
  await page.getByRole("button", { name: /Tocca di nuovo/  }).click();
  await expect(page.getByText("Candidature aperte", { exact: true })).toBeVisible();
});

test("avvio con un solo tocco non parte (serve la conferma)", async ({ page }) => {
  seed("base");
  await loginAs(page, "anna");
  await fillDraft(page, "Inverno");
  await page.getByRole("button", { name: "Crea la bozza" }).click();
  await page.getByRole("button", { name: "Avvia la rassegna" }).click();
  await expect(page.getByRole("button", { name: /Tocca di nuovo/  })).toBeVisible();
  await expect(page.getByText("Bozza", { exact: true })).toBeVisible();
  await expect(page.getByText("Candidature aperte", { exact: true })).toHaveCount(0);
});

test("modifico il nome di una bozza ed elimino la bozza", async ({ page }) => {
  seed("base");
  await loginAs(page, "anna");
  await fillDraft(page, "Primavera");
  await page.getByRole("button", { name: "Crea la bozza" }).click();
  await page.getByRole("button", { name: "Modifica" }).click();
  await page.getByLabel("Nome", { exact: true }).fill("Primavera 2");
  await page.getByRole("button", { name: "Salva" }).click();
  await expect(page.getByRole("heading", { name: "Primavera 2" })).toBeVisible();
  await page.getByRole("button", { name: "Elimina bozza" }).click();
  await page.getByRole("button", { name: /Tocca di nuovo/  }).click();
  await expect(page).toHaveURL(/\/cineforums\/1$/);
  await expect(page.getByText("Nessuna rassegna")).toBeVisible();
});

test("errore del backend sul form mostrato accanto al form", async ({ page }) => {
  seed("base");
  await loginAs(page, "anna");
  await page.request.post("/api/cineforums/1/categories", { data: { name: "Western" } });
  await fillDraft(page, "Estate");
  await page.getByLabel("Western").check();
  for (const l of ["carla", "dario"]) await page.getByLabel(l).uncheck();
  await page.getByRole("button", { name: "Crea la bozza" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "più categorie che partecipanti" })).toBeVisible();
  await expect(page).toHaveURL(/seasons\/new$/);
});

test("un membro vede 'La rassegna sta per iniziare' e nessun comando", async ({ page }) => {
  seed("base");
  await loginAs(page, "anna");
  await fillDraft(page, "Autunno");
  await page.getByRole("button", { name: "Crea la bozza" }).click();
  await expect(page).toHaveURL(/seasons\/\d+$/);
  const url = page.url();
  await page.context().clearCookies();
  await loginAs(page, "bruno");
  await page.goto(url);
  await expect(page.getByText("La rassegna sta per iniziare")).toBeVisible();
  await expect(page.getByRole("button", { name: "Avvia la rassegna" })).toHaveCount(0);
});
