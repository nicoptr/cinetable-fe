import { test, expect } from "@playwright/test";
import { expectNoHorizontalScroll, seed } from "./helpers";

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
