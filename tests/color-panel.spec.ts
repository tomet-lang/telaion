import { expect, test, type Page } from "@playwright/test";

// The playground's colour panel: template schemes and pickers, as overrides of the tokens on the root.

test.use({ colorScheme: "light" });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Colors" }).click();
});

const rootToken = (page: Page, name: string) =>
  page.evaluate((property) => document.documentElement.style.getPropertyValue(property), name);

const primaryBackground = (page: Page) =>
  page
    .locator('.tln-btn[data-variant="primary"]')
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundColor);

test("by default it overrides nothing: the tokens are the design", async ({ page }) => {
  await expect(page.getByLabel("Template")).toHaveValue("default");
  expect(await rootToken(page, "--tln-accent")).toBe("");
  expect(await rootToken(page, "--tln-depth-dark")).toBe("");
});

test("a template sets both ends of the depth scale and the accent, for both themes", async ({ page }) => {
  await page.getByLabel("Template").selectOption("lavender");
  expect(await rootToken(page, "--tln-accent")).toBe("light-dark(#6d4fd1, #a78bfa)");
  expect(await rootToken(page, "--tln-depth-dark")).toContain("#d8d2ec");
  expect(await rootToken(page, "--tln-depth-bright")).toContain("#4a4560");
  // The page follows: a primary button is the accent of the scheme (after its colour has moved there).
  await expect.poll(() => primaryBackground(page)).toBe("rgb(109, 79, 209)");
});

test("the hover shade and the ink on the accent follow the accent", async ({ page }) => {
  await page.getByLabel("Template").selectOption("cream");
  expect(await rootToken(page, "--tln-accent-hover")).toMatch(/^light-dark\(#[0-9a-f]{6}, #[0-9a-f]{6}\)$/);
  // White on a dark amber, near-black on a light one.
  expect(await rootToken(page, "--tln-accent-fg")).toBe("light-dark(#ffffff, #09090b)");
});

test("a picker makes the scheme custom and sets the token", async ({ page }) => {
  await page.getByLabel("Accent, light theme").fill("#ff0066");
  await expect(page.getByLabel("Template")).toHaveValue("custom");
  expect(await rootToken(page, "--tln-accent")).toContain("#ff0066");
  await expect.poll(() => primaryBackground(page)).toBe("rgb(255, 0, 102)");
});

test("Reset gives the design back", async ({ page }) => {
  await page.getByLabel("Template").selectOption("mint");
  expect(await rootToken(page, "--tln-accent")).not.toBe("");
  await page.getByRole("dialog", { name: "Colors" }).getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Template")).toHaveValue("default");
  expect(await rootToken(page, "--tln-accent")).toBe("");
});

test("the panel says whether the text on the accent and the muted text can be read", async ({ page }) => {
  const readings = page.locator(".panel output");
  await expect(readings).toHaveCount(4);
  for (const text of await readings.allTextContents()) expect(text).toMatch(/^\d+\.\d [✓⚠]$/);
  // A pick that cannot be read is marked.
  await page.getByLabel("Darkest end, light theme").fill("#101010");
  await page.getByLabel("Brightest end, light theme").fill("#202020");
  await expect(readings.nth(2)).toContainText("⚠");
});
