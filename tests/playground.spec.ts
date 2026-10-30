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

test("the Tailwind project really runs under Tailwind's reset and wide letter spacing", async ({ page }, testInfo) => {
  await page.goto("/");
  const underReset = testInfo.project.name === "chromium-tailwind";
  // The reset is loaded inside @layer base, as Tailwind itself loads it.
  await expect(page.locator("style#playground-reset")).toHaveCount(underReset ? 1 : 0);
  if (underReset) await expect(page.locator("html")).toHaveAttribute("data-spaced", "");
  else await expect(page.locator("html")).not.toHaveAttribute("data-spaced");
  const spacing = await page.getByRole("heading", { name: "Telaion playground" }).evaluate((el) => getComputedStyle(el).letterSpacing);
  expect(spacing !== "normal").toBe(underReset);
});
