import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test.describe("Tabs", () => {
  const tab = (page: Page, name: string | RegExp) => page.getByRole("tab", { name });

  test("clicking a tab selects it", async ({ page }) => {
    await expect(tab(page, /readme\.tmt/)).toHaveAttribute("aria-selected", "true");
    await tab(page, "config.tmt").click();
    await expect(tab(page, "config.tmt")).toHaveAttribute("aria-selected", "true");
    await expect(tab(page, /readme\.tmt/)).toHaveAttribute("aria-selected", "false");
    await expect(page.getByText("selected = config")).toBeVisible();
  });

  test("only the selected tab is in the Tab order", async ({ page }) => {
    await expect(tab(page, /readme\.tmt/)).toHaveAttribute("tabindex", "0");
    await expect(tab(page, "idea.tmt")).toHaveAttribute("tabindex", "-1");
    await expect(tab(page, "config.tmt")).toHaveAttribute("tabindex", "-1");
  });

  test("the arrow keys, Home and End move the selection and the focus, wrapping around", async ({ page }) => {
    await tab(page, /readme\.tmt/).focus();
    await page.keyboard.press("ArrowRight");
    await expect(tab(page, "idea.tmt")).toBeFocused();
    await expect(tab(page, "idea.tmt")).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("End");
    await expect(tab(page, "config.tmt")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(tab(page, /readme\.tmt/)).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(tab(page, "config.tmt")).toBeFocused();
    await page.keyboard.press("Home");
    await expect(tab(page, /readme\.tmt/)).toBeFocused();
  });

  test("an unsaved tab says so to assistive technology", async ({ page }) => {
    await expect(tab(page, /readme\.tmt/).getByRole("img", { name: "unsaved changes" })).toBeVisible();
    await expect(tab(page, "idea.tmt").getByRole("img")).toHaveCount(0);
  });

  test("the close button and the Delete key close a closable tab; a plain tab cannot be closed", async ({ page }) => {
    await page.getByRole("button", { name: "Close idea.tmt" }).click();
    await expect(tab(page, "idea.tmt")).toHaveCount(0);
    await expect(page.getByText("last closed = idea")).toBeVisible();

    await tab(page, /readme\.tmt/).focus();
    await page.keyboard.press("Delete");
    await expect(tab(page, /readme\.tmt/)).toHaveCount(0);
    await expect(page.getByText("last closed = readme")).toBeVisible();
    // The selected tab was closed, so the selection falls back to the first remaining one.
    await expect(tab(page, "config.tmt")).toHaveAttribute("aria-selected", "true");

    await tab(page, "config.tmt").focus();
    await page.keyboard.press("Delete");
    await expect(tab(page, "config.tmt")).toBeVisible();
  });
});

test.describe("Select", () => {
  test("is labelled by its Field and changes the bound value", async ({ page }) => {
    const select = page.getByLabel("Language");
    await expect(select).toHaveValue("en");
    await select.selectOption("ja");
    await expect(select).toHaveValue("ja");
    await expect(page.getByText("language = ja")).toBeVisible();
  });
});

test.describe("Alert", () => {
  test("warn and danger interrupt assistive technology; ok and info do not", async ({ page }) => {
    await expect(page.getByRole("alert").filter({ hasText: "remote changed" })).toBeVisible();
    await expect(page.getByRole("alert").filter({ hasText: "no write permission" })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "Saved to the repository" })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "Telaion is a frame" })).toBeVisible();
  });

  test("the dismiss button removes the alert", async ({ page }) => {
    const alert = page.getByRole("alert").filter({ hasText: "no write permission" });
    await alert.getByRole("button", { name: "Dismiss" }).click();
    await expect(alert).toHaveCount(0);
    await page.getByRole("button", { name: "Show the dismissed alert again" }).click();
    await expect(alert).toBeVisible();
  });

  test("only the alert given onDismiss has a dismiss button", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Dismiss" })).toHaveCount(1);
  });
});

test.describe("Spinner", () => {
  test("is a status with an accessible name", async ({ page }) => {
    await expect(page.getByRole("status", { name: "Loading", exact: true })).toBeVisible();
  });

  test("stops turning when the person prefers reduced motion", async ({ page }) => {
    const animationName = () =>
      page.getByRole("status", { name: "Loading", exact: true }).evaluate((el) => getComputedStyle(el).animationName);
    // Svelte scopes keyframe names, so check that it runs rather than what it is called.
    expect(await animationName()).not.toBe("none");
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await animationName()).toBe("none");
  });
});

test.describe("Badge", () => {
  test("renders its text in every tone", async ({ page }) => {
    for (const text of ["neutral", "draft", "saved", "conflict", "failed"]) {
      await expect(page.getByText(text, { exact: true }).first()).toBeVisible();
    }
  });
});
