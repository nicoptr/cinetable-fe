import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { E2E_ORIGIN_SECRET } from "../playwright.prod.config";
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

test("ORIGIN_SECRET resta lato server: non compare nei file statici del client", async () => {
  const dir = path.resolve(__dirname, "../.next/static");
  const files = readdirSync(dir, { recursive: true, withFileTypes: true }).filter((f) => f.isFile());
  expect(files.length).toBeGreaterThan(0);
  for (const f of files) expect(readFileSync(path.join(f.parentPath, f.name), "utf8"), f.name).not.toContain(E2E_ORIGIN_SECRET);
});
