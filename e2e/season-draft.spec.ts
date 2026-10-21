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
  await page.getByRole("button", { name: "Avvia l'edizione" }).click();
  await page.getByRole("button", { name: /Tocca di nuovo/  }).click();
  await expect(page.getByText("Candidature aperte", { exact: true })).toBeVisible();
});

test("avvio con un solo tocco non parte (serve la conferma)", async ({ page }) => {
  seed("base");
  await loginAs(page, "anna");
  await fillDraft(page, "Inverno");
  await page.getByRole("button", { name: "Crea la bozza" }).click();
  await page.getByRole("button", { name: "Avvia l'edizione" }).click();
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
  await expect(page.getByText("Nessuna edizione")).toBeVisible();
});

test("bozza incompleta: si salva, l'avvio elenca i problemi accanto al bottone, completata si avvia", async ({ page }) => {
  seed("base");
  await loginAs(page, "anna");
  await fillDraft(page, "Estate");
  for (const l of ["bruno", "carla", "dario"]) await page.getByLabel(l).uncheck();
  await page.getByRole("button", { name: "Crea la bozza" }).click();
  await expect(page).toHaveURL(/\/seasons\/\d+$/);
  await expect(page.getByText("Bozza", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Avvia l'edizione" }).click();
  await page.getByRole("button", { name: /Tocca di nuovo/ }).click();
  const problems = page.getByRole("alert").filter({ hasText: "Per avviare l'edizione:" });
  await expect(problems).toContainText("aggiungi almeno 2 partecipanti");
  await expect(problems).toContainText("il numero dei partecipanti deve essere un multiplo di quello delle categorie");
  await expect(page.getByText("Bozza", { exact: true })).toBeVisible();
  await expect(page.getByRole("status", { name: "Avvisi" }).getByRole("listitem")).toHaveCount(0);

  await page.getByRole("button", { name: "Modifica" }).click();
  for (const l of ["bruno", "carla", "dario"]) await page.getByLabel(l).check();
  await page.getByRole("button", { name: "Salva" }).click();
  await expect(page.getByRole("button", { name: "Modifica" })).toBeVisible();
  await expect(problems).toHaveCount(0);
  await page.getByRole("button", { name: "Avvia l'edizione" }).click();
  await page.getByRole("button", { name: /Tocca di nuovo/ }).click();
  await expect(page.getByText("Candidature aperte", { exact: true })).toBeVisible();
});

test("errore del backend sul form: accanto al form e nessun avviso doppio", async ({ page }) => {
  seed("base");
  await loginAs(page, "anna");
  await page.route("**/api/cineforums/1/seasons", (r) =>
    r.request().method() === "POST" ? r.fulfill({ status: 400, json: { error: "HttpError", code: "400", message: "Nome già usato" } }) : r.fallback(),
  );
  await fillDraft(page, "Estate");
  await page.getByRole("button", { name: "Crea la bozza" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Nome già usato" })).toBeVisible();
  await expect(page).toHaveURL(/seasons\/new$/);
  await expect(page.getByRole("status", { name: "Avvisi" }).getByRole("listitem")).toHaveCount(0);
});

test("un membro vede 'L'edizione sta per iniziare' e nessun comando", async ({ page }) => {
  seed("base");
  await loginAs(page, "anna");
  await fillDraft(page, "Autunno");
  await page.getByRole("button", { name: "Crea la bozza" }).click();
  await expect(page).toHaveURL(/seasons\/\d+$/);
  const url = page.url();
  await page.context().clearCookies();
  await loginAs(page, "bruno");
  await page.goto(url);
  await expect(page.getByText("L'edizione sta per iniziare")).toBeVisible();
  await expect(page.getByRole("button", { name: "Avvia l'edizione" })).toHaveCount(0);
});
