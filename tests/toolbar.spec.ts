import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

const bar = (page: Page, name = "Formatting") => page.getByRole("toolbar", { name, exact: true });
const control = (page: Page, name: string) => bar(page).getByRole("button", { name, exact: true });

test.describe("Toolbar", () => {
  test("is a named toolbar with an orientation", async ({ page }) => {
    await expect(bar(page)).toHaveAttribute("aria-orientation", "horizontal");
    await expect(bar(page, "Formatting, vertical")).toHaveAttribute("aria-orientation", "vertical");
  });

  test("is one stop in the Tab order: only one button has tabindex 0", async ({ page }) => {
    await expect(control(page, "Bold")).toHaveAttribute("tabindex", "0");
    await expect(control(page, "Italic")).toHaveAttribute("tabindex", "-1");
    await expect(control(page, "Link")).toHaveAttribute("tabindex", "-1");
  });

  test("the arrow keys move between the controls, wrapping; Home and End jump; disabled ones are skipped", async ({ page }) => {
    await control(page, "Bold").focus();
    await page.keyboard.press("ArrowRight");
    await expect(control(page, "Italic")).toBeFocused();
    await page.keyboard.press("End");
    // "Save all" is disabled, so the last control is Save.
    await expect(control(page, "Save")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(control(page, "Bold")).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(control(page, "Save")).toBeFocused();
    await page.keyboard.press("Home");
    await expect(control(page, "Bold")).toBeFocused();
  });

  test("the control that had the focus is the stop when the person comes back", async ({ page }) => {
    await control(page, "Link").focus();
    await expect(control(page, "Link")).toHaveAttribute("tabindex", "0");
    await expect(control(page, "Bold")).toHaveAttribute("tabindex", "-1");
  });

  test("a text field and a segmented control inside keep their keys and their own Tab stop", async ({ page }) => {
    const mode = bar(page).getByRole("radiogroup", { name: "Toolbar mode" });
    await control(page, "Link").focus();
    await page.keyboard.press("Tab");
    await expect(mode.getByRole("radio", { name: "Source" })).toBeFocused();
    // The arrow key is the segmented control's: it moves the choice, not the toolbar's focus.
    await page.keyboard.press("ArrowRight");
    await expect(mode.getByRole("radio", { name: "Hybrid" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(bar(page).getByRole("searchbox")).toBeFocused();
    await page.keyboard.type("abc");
    await page.keyboard.press("ArrowLeft");
    await expect(bar(page).getByRole("searchbox")).toBeFocused();
    await expect(bar(page).getByRole("searchbox")).toHaveValue("abc");
  });

  test("in a vertical toolbar the up and down arrows move, the left and right ones do not", async ({ page }) => {
    const vertical = bar(page, "Formatting, vertical");
    await vertical.getByRole("button", { name: "Vertical bold" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(vertical.getByRole("button", { name: "Vertical bold" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(vertical.getByRole("button", { name: "Vertical italic" })).toBeFocused();
  });

  test("the bar does not restyle its controls: a button keeps its own shadow", async ({ page }) => {
    const shadow = await control(page, "Share").evaluate((el) => getComputedStyle(el).boxShadow);
    expect(shadow).not.toBe("none");
  });
});

test.describe("Input in the ControlsDemo", () => {
  test("the mono option uses the monospace token and the compact one is smaller", async ({ page }) => {
    const plain = page.getByLabel("Plain", { exact: true });
    const mono = page.getByLabel("Path, monospace");
    const compact = page.getByLabel("Compact", { exact: true });
    const [plainFont, monoFont] = await Promise.all([
      plain.evaluate((el) => getComputedStyle(el).fontFamily),
      mono.evaluate((el) => getComputedStyle(el).fontFamily),
    ]);
    expect(monoFont).not.toBe(plainFont);
    const [h1, h2] = await Promise.all([plain.boundingBox(), compact.boundingBox()]);
    expect(h2!.height).toBeLessThan(h1!.height);
  });

  test("onkeydown reaches the input, so Enter can be handled", async ({ page }) => {
    await page.getByLabel("Slug, entered with Enter").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Enter pressed 1 times")).toBeVisible();
  });
});
