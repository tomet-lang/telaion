import { expect, test } from "@playwright/test";

test("the playground opens and shows the components", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Telaion playground" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save" }).first()).toBeEnabled();
});

test("the theme switch overrides the operating system", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "system" }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme");
});
