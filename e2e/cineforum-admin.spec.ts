import { expect, expectNoHorizontalScroll, loginAs, seed, test } from "./helpers";

test("presidente invita due email, le vede In attesa, ne revoca una", async ({ page }) => {
  seed("base");
  await loginAs(page, "anna");
  await page.goto("/cineforums/1/members");
  await page.getByLabel("Invita per email").fill("uno@e2e.it, due@e2e.it");
  await page.getByRole("button", { name: "Invita" }).click();
  const uno = page.getByRole("listitem").filter({ hasText: "uno@e2e.it" });
  await expect(uno).toContainText("In attesa");
  await expect(page.getByRole("listitem").filter({ hasText: "due@e2e.it" })).toContainText("In attesa");
  await uno.getByRole("button", { name: "Revoca" }).click();
  await uno.getByRole("button", { name: "Tocca di nuovo per confermare" }).click();
  await expect(uno).toContainText("Revocato");
  await expectNoHorizontalScroll(page);
});

test("membro non vede Impostazioni né il form inviti", async ({ page }) => {
  seed("base");
  await loginAs(page, "bruno");
  await page.goto("/cineforums/1");
  await expect(page.getByRole("link", { name: "Membri" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Impostazioni" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Nuova rassegna" })).toHaveCount(0);
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
  await page.getByRole("link", { name: "Impostazioni" }).click();
  await expect(page.getByText("Miglior regia")).toBeVisible();
  await page.getByLabel("Nome del premio").fill("Miglior colonna sonora");
  await page.getByLabel("Domanda di voto").fill("Quanto ti è piaciuta la musica?");
  await page.getByRole("button", { name: "Aggiungi premio" }).click();
  await expect(page.getByText("Miglior colonna sonora")).toBeVisible();
  await expect(page.getByText("Quanto ti è piaciuta la musica?")).toBeVisible();
  await expectNoHorizontalScroll(page);
});

test("cineforum di cui non faccio parte → pagina Non trovato", async ({ page }) => {
  seed("base");
  await loginAs(page, "bruno");
  await page.goto("/cineforums/2");
  await expect(page.getByRole("heading", { name: "Non trovato" })).toBeVisible();
});
