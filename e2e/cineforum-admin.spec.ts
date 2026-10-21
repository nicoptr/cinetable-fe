import { expect, expectNoHorizontalScroll, loginAs, seed, test } from "./helpers";

test("presidente invita due email, le vede In attesa, ne revoca una", async ({ page }) => {
  seed("base");
  await loginAs(page, "anna");
  await page.goto("/cineforums/1/members");
  await page.getByLabel("Invita per email").fill("uno@e2e.it, due@e2e.it");
  await page.getByRole("button", { name: "Invita" }).click();
  await expect(page.getByText("Inviti inviati: 2")).toBeVisible();
  const uno = page.getByRole("listitem").filter({ hasText: "uno@e2e.it" });
  await expect(uno).toContainText("In attesa");
  await expect(page.getByRole("listitem").filter({ hasText: "due@e2e.it" })).toContainText("In attesa");
  await uno.getByRole("button", { name: "Revoca" }).click();
  await uno.getByRole("button", { name: "Tocca di nuovo per confermare" }).click();
  await expect(uno).toContainText("Revocato");
  await expectNoHorizontalScroll(page);
});

test("membro non vede Nuova edizione né il form inviti; settings non esiste più", async ({ page }) => {
  seed("base");
  await loginAs(page, "bruno");
  await page.goto("/cineforums/1");
  await expect(page.getByRole("link", { name: "Membri" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Nuova edizione" })).toHaveCount(0);
  await page.goto("/cineforums/1/members");
  await expect(page.getByText("anna")).toBeVisible();
  await expect(page.getByLabel("Invita per email")).toHaveCount(0);
  await page.goto("/cineforums/1/settings");
  await expect(page.getByRole("heading", { name: "Non trovato" })).toBeVisible();
});

test("aggiungo un premio con la sua domanda", async ({ page }) => {
  seed("base");
  await loginAs(page, "anna");
  await page.goto("/cineforums/1");
  await page.getByRole("link", { name: "Premi", exact: true }).click();
  await expect(page).toHaveURL(/\/cineforums\/1\/awards$/);
  await expect(page.getByText("Miglior regia")).toBeVisible();
  await expect(page.getByLabel("Nome del premio")).toHaveCount(0);
  await page.getByRole("button", { name: "+ Nuovo premio" }).click();
  await expect(page.getByRole("heading", { name: "Nuovo premio" })).toBeVisible();
  await page.getByLabel("Nome del premio").fill("Miglior colonna sonora");
  await page.getByLabel("Domanda di voto").fill("Quanto ti è piaciuta la musica?");
  await page.getByRole("button", { name: "Salva" }).click();
  await expect(page.getByText("Premio aggiunto")).toBeVisible();
  await expect(page.getByLabel("Nome del premio")).toHaveCount(0);
  await expect(page.getByRole("listitem").filter({ hasText: "Miglior colonna sonora" })).toContainText("Quanto ti è piaciuta la musica?");
  await expectNoHorizontalScroll(page);
});

test("nuova categoria: Annulla chiude il form, Salva la aggiunge con la conferma", async ({ page }) => {
  seed("base");
  await loginAs(page, "anna");
  await page.goto("/cineforums/1/categories");
  await page.getByRole("button", { name: "+ Nuova categoria" }).click();
  await expect(page.getByRole("heading", { name: "Nuova categoria" })).toBeVisible();
  await expect(page.getByLabel("Nome della categoria")).toBeFocused();
  await page.getByRole("button", { name: "Annulla" }).click();
  await expect(page.getByRole("heading", { name: "Nuova categoria" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "+ Nuova categoria" })).toBeFocused();
  await page.getByRole("button", { name: "+ Nuova categoria" }).click();
  await page.getByLabel("Nome della categoria").fill("Western");
  await page.getByRole("button", { name: "Salva" }).click();
  await expect(page.getByText("Categoria aggiunta")).toBeVisible();
  await expect(page.getByRole("button", { name: "+ Nuova categoria" })).toBeFocused();
  await expect(page.getByRole("heading", { name: "Nuova categoria" })).toHaveCount(0);
  await expect(page.getByRole("listitem").filter({ hasText: "Western" })).toBeVisible();
});

test("modifica in linea con Salva e Annulla", async ({ page }) => {
  seed("base");
  await loginAs(page, "anna");
  await page.goto("/cineforums/1/awards");
  await page.getByRole("button", { name: "Modifica Miglior regia" }).click();
  await page.getByLabel("Nome del premio").fill("Miglior regista");
  await page.getByRole("button", { name: "Salva" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Miglior regista" })).toBeVisible();
  await expect(page.getByLabel("Nome del premio")).toHaveCount(0);
});

test("cineforum di cui non faccio parte → pagina Non trovato", async ({ page }) => {
  seed("base");
  await loginAs(page, "bruno");
  await page.goto("/cineforums/2");
  await expect(page.getByRole("heading", { name: "Non trovato" })).toBeVisible();
});

test("Rimanda mostra l'esito nella riga, Revoca la segna Revocato", async ({ page }) => {
  seed("base");
  await loginAs(page, "anna");
  await page.goto("/cineforums/1/members");
  const row = page.getByRole("listitem").filter({ hasText: "ospite@e2e.it" });
  await row.getByRole("button", { name: "Rimanda" }).click();
  await expect(row.getByText("Invito rimandato")).toBeVisible();
  await row.getByRole("button", { name: "Revoca" }).click();
  await row.getByRole("button", { name: "Tocca di nuovo per confermare" }).click();
  await expect(row).toContainText("Revocato");
});

test("categoria usata in un'edizione: il 409 compare nella sua riga", async ({ page }) => {
  seed("open");
  await loginAs(page, "anna");
  await page.goto("/cineforums/1/categories");
  const row = page.getByRole("listitem").filter({ hasText: "Horror anni '80" });
  await row.getByRole("button", { name: "Elimina" }).click();
  await row.getByRole("button", { name: "Tocca di nuovo per confermare" }).click();
  await expect(row.getByRole("alert")).toContainText("Categoria usata in un'edizione");
});
