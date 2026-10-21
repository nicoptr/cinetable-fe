import { expect, loginAs, seed, test } from "../e2e/helpers";

test("home con gli header di sicurezza", async ({ page }) => {
  const res = await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const headers = res!.headers();
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["content-security-policy"]).toBe("frame-ancestors 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("/invite non manda il Referer", async ({ request }) => {
  const res = await request.get("/invite");
  expect(res.headers()["referrer-policy"]).toBe("no-referrer");
});

test("/api arriva al backend", async ({ request }) => {
  const res = await request.get("/api/auth/me");
  expect(res.status()).toBe(401);
  expect(await res.json()).toHaveProperty("code");
});

test("pagina dell'app senza login → /login?next=", async ({ page }) => {
  await page.goto("/cineforums");
  await expect(page).toHaveURL(/\/login\?next=%2Fcineforums/);
});

test("login, poi /login con la sessione porta a next (solo interno)", async ({ page }) => {
  seed("base");
  await loginAs(page, "anna");
  await page.goto("/login?next=%2Fprofile");
  await expect(page).toHaveURL(/\/profile$/);
  await page.goto("/login?next=%2F%09%2Fevil.com");
  await expect(page).toHaveURL(/localhost:3056\/cineforums$/);
  await page.goto("/login?next=%2F.%2F%2Fevil.com");
  await expect(page).toHaveURL(/localhost:3056\/cineforums$/);
});
