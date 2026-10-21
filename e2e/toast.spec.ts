import { expect, loginAs, seed, test } from "./helpers";

const SEASON = "/cineforums/1/seasons/1";

test("azione senza errore in pagina: un 500 mostra l'avviso, che si chiude col tocco", async ({ page }) => {
  seed("open");
  await page.route("**/api/cineforums/1/seasons/1/participants/**", (r) => r.fulfill({ status: 500, json: { error: "Internal", code: "500", message: "boom" } }));
  await loginAs(page, "anna");
  await page.goto(SEASON);
  const row = page.getByRole("listitem").filter({ hasText: "dario" });
  await row.getByRole("button", { name: "Togli dall'edizione" }).click();
  await row.getByRole("button", { name: /Tocca di nuovo/ }).click();
  const toasts = page.getByRole("status", { name: "Avvisi" }).getByRole("listitem");
  await expect(toasts).toHaveCount(1);
  await expect(toasts).toHaveText("Servizio non disponibile, riprova tra poco");
  await expect(page.locator("main [role=alert]")).toHaveCount(0);
  await toasts.first().click();
  await expect(toasts).toHaveCount(0);
});

test("un 400 senza errore in pagina mostra il messaggio del backend; al massimo 3 avvisi", async ({ page }) => {
  seed("open");
  await page.route("**/api/cineforums/1/seasons/1/participants/**", (r) => r.fulfill({ status: 400, json: { error: "HttpError", code: "400", message: "Non si può togliere" } }));
  await loginAs(page, "anna");
  await page.goto(SEASON);
  const toasts = page.getByRole("status", { name: "Avvisi" }).getByRole("listitem");
  for (let i = 0; i < 4; i++) {
    const row = page.getByRole("listitem").filter({ hasText: "dario" });
    await row.getByRole("button", { name: "Togli dall'edizione" }).click();
    await row.getByRole("button", { name: /Tocca di nuovo/ }).click();
    await expect(toasts).toHaveCount(Math.min(i + 1, 3));
  }
  await expect(toasts.first()).toHaveText("Non si può togliere");
});
