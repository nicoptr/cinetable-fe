import { expect, expectNoHorizontalScroll, PASSWORD, seed, test } from "./helpers";

test("la home si apre su telefono senza scorrimento orizzontale", async ({ page }) => {
  await seed("base");
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("This product uses the TMDB API")).toBeVisible();
  await expectNoHorizontalScroll(page);
});

test("pagina dell'app senza login → /login?next=", async ({ page }) => {
  await page.goto("/cineforums");
  await expect(page).toHaveURL(/\/login\?next=%2Fcineforums/);
});

test.describe("IP distinto per test", () => {
  test.beforeAll(() => seed("base"));
  // 11 login (> 10/min per IP): passano tutti solo se il backend vede un IP diverso per ogni test
  for (let i = 1; i <= 11; i++) {
    test(`login ${i} di 11 senza rate limit`, async ({ request }) => {
      const res = await request.post("/api/auth/login", { data: { usernameOrEmail: "anna@e2e.it", password: PASSWORD } });
      expect(res.status()).toBe(200);
    });
  }
});
