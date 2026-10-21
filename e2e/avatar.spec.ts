import { expect, loginAs, seed, test } from "./helpers";

const AVATAR = "https://img.e2e.test/anna.png";
// PNG 1×1 trasparente
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

test("avatar: immagine nel menu e tra i membri, iniziali per chi non ce l'ha", async ({ page }) => {
  seed("base");
  await page.route(AVATAR, (r) => r.fulfill({ contentType: "image/png", body: PNG }));
  await loginAs(page, "anna");
  expect((await page.request.patch("/api/users/me", { data: { avatarUrl: AVATAR } })).ok()).toBe(true);
  await page.goto("/cineforums/1/members");
  await expect(page.getByRole("button", { name: "Menu" }).locator(`img[src="${AVATAR}"]`)).toBeVisible();
  const anna = page.getByRole("listitem").filter({ hasText: "anna" });
  await expect(anna.locator(`img[src="${AVATAR}"]`)).toHaveAttribute("alt", "");
  await expect(page.getByRole("listitem").filter({ hasText: "bruno" }).locator('[data-initials="B"]')).toBeVisible();
});

test("avatar che non si carica → iniziali", async ({ page }) => {
  seed("base");
  await page.route(AVATAR, (r) => r.fulfill({ status: 404, body: "" }));
  await loginAs(page, "anna");
  await page.request.patch("/api/users/me", { data: { avatarUrl: AVATAR } });
  await page.goto("/cineforums/1/members");
  const anna = page.getByRole("listitem").filter({ hasText: "anna" });
  await expect(anna.locator('[data-initials="A"]')).toBeVisible();
  await expect(anna.locator("img")).toHaveCount(0);
});

test("avatar accanto a 'proposto da' e tra i partecipanti della scheda", async ({ page }) => {
  seed("done");
  await loginAs(page, "anna");
  await page.goto("/cineforums/1/seasons/1/summary");
  const film = page.getByRole("list", { name: "I film" }).getByRole("listitem").first();
  await expect(film.locator('[data-initials="A"]')).toBeVisible();
  await expect(page.getByRole("region", { name: "Partecipanti" }).locator('[data-initials="D"]')).toBeVisible();
});
