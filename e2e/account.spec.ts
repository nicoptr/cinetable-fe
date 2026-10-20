import { expect, expectNoHorizontalScroll, INVITE_TOKEN_NEW, loginAs, PASSWORD, seed, test, VERIFY_TOKEN } from "./helpers";

test("login e ritorno alla pagina richiesta", async ({ page }) => {
  seed("base");
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login\?next=%2Fprofile/);
  await page.getByLabel("Email o nome utente").fill("anna@e2e.it");
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Accedi" }).click();
  await page.waitForURL("**/profile");
  await expect(page.getByRole("heading", { name: "Profilo" })).toBeVisible();
  await expect(page.getByLabel("Nome utente")).toHaveValue("anna");
  await expectNoHorizontalScroll(page);
});

test("password sbagliata → messaggio del backend", async ({ page }) => {
  seed("base");
  await page.goto("/login");
  await page.getByLabel("Email o nome utente").fill("anna@e2e.it");
  await page.getByLabel("Password").fill("sbagliata-123");
  await page.getByRole("button", { name: "Accedi" }).click();
  await expect(page.getByText("Username o password non validi!")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
  await expectNoHorizontalScroll(page);
});

test("email non verificata → avviso e reinvio", async ({ page }) => {
  seed("base");
  await page.goto("/login");
  await page.getByLabel("Email o nome utente").fill("nuovo@e2e.it");
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Accedi" }).click();
  await expect(page.getByText("Conferma la tua email prima di accedere")).toBeVisible();
  await page.getByRole("button", { name: "Rimanda l'email di conferma" }).click();
  await expect(page.getByText("email di conferma è stata rimandata")).toBeVisible();
});

test("registrazione → schermata 'Controlla la tua email'", async ({ page }) => {
  seed("base");
  await page.goto("/signup");
  await expect(page.getByText("lettere, numeri, punto, trattino, trattino basso")).toBeVisible();
  await page.getByLabel("Email", { exact: true }).fill("nuova@e2e.it");
  await page.getByLabel("Nome utente").fill("nuova.utente");
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Crea l'account" }).click();
  await expect(page.getByRole("heading", { name: "Controlla la tua email" })).toBeVisible();
  await expectNoHorizontalScroll(page);
});

test("registrazione da invito: email bloccata e si entra nel cineforum", async ({ page }) => {
  seed("base");
  await page.goto(`/signup?invite=${INVITE_TOKEN_NEW}&email=ospite@e2e.it`);
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue("ospite@e2e.it");
  await expect(page.getByLabel("Email", { exact: true })).toHaveAttribute("readonly", "");
  await page.getByLabel("Nome utente").fill("ospite");
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Crea l'account" }).click();
  await page.waitForURL(/\/cineforums\/1$/);
  await expect(page.getByRole("heading", { name: "Cinofili del giovedì" })).toBeVisible();
});

test("verifica email con il token del seed → dentro l'app", async ({ page }) => {
  seed("base");
  await page.goto(`/verify-email?token=${VERIFY_TOKEN}`);
  await expect(page.getByRole("heading", { name: "Email confermata" })).toBeVisible();
  await page.waitForURL("**/cineforums");
  await expect(page.getByRole("heading", { name: "I miei cineforum" })).toBeVisible();
});

test("verifica email con token non valido → errore", async ({ page }) => {
  seed("base");
  await page.goto("/verify-email?token=sbagliato");
  await expect(page.getByText("Link non valido o scaduto")).toBeVisible();
  await expectNoHorizontalScroll(page);
});

test("password dimenticata e reimpostazione", async ({ page }) => {
  seed("base");
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill("nessuno@e2e.it");
  await page.getByRole("button", { name: "Invia il link" }).click();
  await expect(page.getByText("Se l'indirizzo è registrato, ti abbiamo scritto")).toBeVisible();

  await page.goto("/reset-password?token=sbagliato");
  await page.getByLabel("Nuova password", { exact: true }).fill("nuova-password-1");
  await page.getByLabel("Ripeti la nuova password").fill("diversa-password-2");
  await page.getByRole("button", { name: "Aggiorna la password" }).click();
  await expect(page.getByText("Le password non coincidono")).toBeVisible();
  await page.getByLabel("Ripeti la nuova password").fill("nuova-password-1");
  await page.getByRole("button", { name: "Aggiorna la password" }).click();
  await expect(page.getByText("Link non valido o scaduto")).toBeVisible();
  await expectNoHorizontalScroll(page);
});

test("sessione revocata → redirect ad accedi con next", async ({ page, context }) => {
  seed("base");
  await loginAs(page, "anna");
  await context.clearCookies();
  await page.goto("/cineforums");
  await expect(page).toHaveURL(/\/login\?next=%2Fcineforums/);
});

test("la home ha i metadata SEO e le altre pagine sono noindex", async ({ page, request }) => {
  seed("base");
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Cinofili" })).toBeVisible();
  await expect(page.getByText("Il cineforum tra amici, con la suspense degli Oscar")).toBeVisible();
  await expect(page.getByRole("link", { name: "Crea il tuo cineforum" })).toHaveAttribute("href", "/signup");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /Cinofili/);
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  expect(await page.locator('meta[name="robots"]').count() === 0 || !(await page.locator('meta[name="robots"]').getAttribute("content"))?.includes("noindex")).toBe(true);
  await expectNoHorizontalScroll(page);

  await page.goto("/login");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Allow: /");
  expect(robots).toContain("Disallow: /login");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap.match(/<loc>/g)).toHaveLength(1);
});

test("con la sessione la home offre 'Vai ai tuoi cineforum'", async ({ page }) => {
  seed("base");
  await loginAs(page, "anna");
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Vai ai tuoi cineforum" })).toHaveAttribute("href", "/cineforums");
  await page.getByRole("link", { name: "Vai ai tuoi cineforum" }).click();
  await expect(page.getByRole("heading", { name: "I miei cineforum" })).toBeVisible();
});
