import { expect, expectNoHorizontalScroll, INVITE_TOKEN_NEW, loginAs, PASSWORD, seed, test } from "./helpers";

test("creo un cineforum e lo trovo nell'elenco come presidente", async ({ page }) => {
  seed("base");
  await loginAs(page, "bruno");
  await page.goto("/cineforums");
  await expect(page.getByRole("link", { name: /Cinofili del giovedì/ })).toContainText("Membro");
  await page.getByLabel("Nome").fill("Cineclub di Bruno");
  await page.getByLabel("Descrizione").fill("Il martedì sera");
  await page.getByRole("button", { name: "Crea il cineforum" }).click();
  await expect(page).toHaveURL(/\/cineforums\/\d+$/);
  await expect(page.getByRole("heading", { name: "Cineclub di Bruno" })).toBeVisible();
  await page.goto("/cineforums");
  await expect(page.getByRole("link", { name: /Cineclub di Bruno/ })).toContainText("Presidente");
  await expectNoHorizontalScroll(page);
});

test("invitato nuovo: dal link alla registrazione, poi dentro il cineforum", async ({ page }) => {
  seed("base");
  await page.goto(`/invite?token=${INVITE_TOKEN_NEW}`);
  await expect(page.getByText("anna ti invita in Cinofili del giovedì")).toBeVisible();
  await page.getByRole("link", { name: "Crea il tuo account" }).click();
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue("ospite@e2e.it");
  await expect(page.getByLabel("Email", { exact: true })).not.toBeEditable();
  await page.getByLabel("Nome utente").fill("ospite");
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Crea l'account" }).click();
  await page.waitForURL(/\/cineforums\/1$/);
  await expect(page.getByRole("heading", { name: "Cinofili del giovedì" })).toBeVisible();
});

test("invito con token non valido", async ({ page }) => {
  seed("base");
  await page.goto("/invite?token=sbagliato");
  await expect(page.getByText("Invito non valido o scaduto")).toBeVisible();
});

test("membro già registrato accetta dalla pagina Inviti", async ({ page }) => {
  seed("base");
  await loginAs(page, "carla");
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("link", { name: "Inviti (1)" }).click();
  await expect(page.getByText(/Ti invita dario/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cineclub di Dario" })).toBeVisible();
  await page.getByRole("button", { name: "Accetta" }).click();
  await expect(page).toHaveURL(/\/cineforums\/2$/);
  // il conteggio nel menu si aggiorna senza ricaricare la pagina
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.getByRole("link", { name: "Inviti", exact: true })).toBeVisible();
  await page.goto("/cineforums");
  await expect(page.getByRole("link", { name: /Cineclub di Dario/ })).toContainText("Membro");
});

test("profilo: cambio username", async ({ page }) => {
  seed("base");
  await loginAs(page, "bruno");
  await page.goto("/profile");
  await page.getByLabel("Nome utente").fill("bruno.nuovo");
  await page.getByRole("button", { name: "Salva il profilo" }).click();
  await expect(page.getByText("Profilo aggiornato")).toBeVisible();
});

test("logout dal menu → home", async ({ page }) => {
  seed("base");
  await loginAs(page, "anna");
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("button", { name: "Esci" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("link", { name: "Accedi" })).toBeVisible();
});

test("menu: Escape chiude e rida il focus al bottone; id non numerico → 404", async ({ page }) => {
  seed("base");
  await loginAs(page, "anna");
  const menu = page.getByRole("button", { name: "Menu" });
  await menu.click();
  await expect(page.getByRole("navigation", { name: "Menu principale" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "Menu principale" })).toBeHidden();
  await expect(menu).toBeFocused();
  const res = await page.goto("/cineforums/abc");
  expect(res?.status()).toBe(404);
});
