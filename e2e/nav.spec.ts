import { expect, test } from "@playwright/test";
import { safeNext } from "../src/lib/nav";

test("safeNext: solo percorsi interni", () => {
  for (const evil of ["//evil.com", "/\\evil.com", "/\t/evil.com", "/\n/evil.com", "https://evil.com", decodeURIComponent("/%09/evil.com")]) {
    expect(safeNext(evil), JSON.stringify(evil)).toBe("/cineforums");
  }
  expect(safeNext(null)).toBe("/cineforums");
  expect(safeNext("/cineforums/1?x=1#y")).toBe("/cineforums/1?x=1#y");
  expect(safeNext("/profile")).toBe("/profile");
});
