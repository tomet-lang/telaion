import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

const outcome = (page: Page) => page.getByLabel("dialog outcome");
const opener = (page: Page) => page.getByRole("button", { name: "Open the command palette", exact: true });
const palette = (page: Page) => page.getByRole("dialog", { name: "Quick open" });
const input = (page: Page) => palette(page).getByRole("combobox", { name: "Quick open" });
// Everything below is looked for inside the palette: the page has other lists and other fields.
const options = (page: Page) => palette(page).getByRole("option");
const active = (page: Page) => palette(page).locator("[role=option][aria-selected=true]");

test.beforeEach(async ({ page }) => {
  await opener(page).click();
  await expect(palette(page)).toBeVisible();
});

test("it is a named dialog with no heading, the field has the focus, and it hangs near the top", async ({ page }) => {
  await expect(palette(page).getByRole("heading")).toHaveCount(0);
  await expect(input(page)).toBeFocused();
  const box = (await palette(page).boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(box.y).toBeLessThan(viewport.height / 4);
  expect(box.x + box.width / 2).toBeCloseTo(viewport.width / 2, 0);
});

test("the field and the list are tied together for assistive technology", async ({ page }) => {
  const list = palette(page).getByRole("listbox", { name: "Quick open" });
  await expect(input(page)).toHaveAttribute("aria-controls", (await list.getAttribute("id"))!);
  await expect(input(page)).toHaveAttribute("aria-expanded", "true");
  await expect(options(page)).toHaveCount(31);
  // The first row is active, and the field says so by id.
  await expect(active(page)).toHaveCount(1);
  await expect(active(page)).toContainText("readme.tmt");
  await expect(input(page)).toHaveAttribute("aria-activedescendant", (await active(page).getAttribute("id"))!);
});

test("the arrow keys move the active row, step over a disabled one and wrap around", async ({ page }) => {
  await page.keyboard.press("ArrowDown");
  await expect(active(page)).toContainText("idea.tmt");
  await page.keyboard.press("ArrowDown");
  await expect(active(page)).toContainText("config.toml");
  // secrets.tmt is disabled.
  await page.keyboard.press("ArrowDown");
  await expect(active(page)).toContainText("Switch to dark theme");
  await page.keyboard.press("ArrowUp");
  await expect(active(page)).toContainText("config.toml");
  await expect(palette(page).getByRole("option", { name: /secrets/ })).toHaveAttribute("aria-disabled", "true");

  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await expect(active(page)).toContainText("note-24.tmt");
  await page.keyboard.press("ArrowDown");
  await expect(active(page)).toContainText("readme.tmt");
  // The caret is not what moved: the focus never left the field.
  await expect(input(page)).toBeFocused();
});

test("the active row is scrolled into view", async ({ page }) => {
  await page.keyboard.press("ArrowUp");
  await expect(active(page)).toContainText("note-24.tmt");
  const inside = await page.evaluate(() => {
    const dialog = document.querySelector("dialog[open]")!;
    const row = dialog.querySelector("[role=option][aria-selected=true]")!.getBoundingClientRect();
    const list = dialog.querySelector("[role=listbox]")!.getBoundingClientRect();
    return row.top >= list.top - 1 && row.bottom <= list.bottom + 1;
  });
  expect(inside).toBe(true);
});

test("Enter chooses the active row, reports it once and closes", async ({ page }) => {
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(palette(page)).toBeHidden();
  await expect(outcome(page)).toHaveText("selected idea");
  await expect(opener(page)).toBeFocused();
});

test("typing narrows the list, starts again at the top, and Enter chooses from the new list", async ({ page }) => {
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.type("note-0");
  await expect(options(page)).toHaveCount(9);
  await expect(active(page)).toContainText("note-01.tmt");
  await page.keyboard.press("Enter");
  await expect(outcome(page)).toHaveText("selected note-0");
});

test("nothing matching shows the empty text, and Enter then does nothing", async ({ page }) => {
  await page.keyboard.type("zzz");
  await expect(palette(page).getByRole("status")).toHaveText("Nothing matches");
  await expect(options(page)).toHaveCount(0);
  await expect(input(page)).toHaveAttribute("aria-expanded", "false");
  await expect(input(page)).not.toHaveAttribute("aria-activedescendant");
  await page.keyboard.press("Enter");
  await expect(palette(page)).toBeVisible();
  await expect(outcome(page)).toHaveText("none");
});

test("Enter while text is being composed (an input method) does not choose", async ({ page }) => {
  await input(page).evaluate((el) =>
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", isComposing: true, bubbles: true, cancelable: true })),
  );
  await expect(palette(page)).toBeVisible();
  await expect(outcome(page)).toHaveText("none");
});

test("the pointer sets the active row, and a click chooses it", async ({ page }) => {
  await palette(page).getByRole("option", { name: /config.toml/ }).hover();
  await expect(active(page)).toContainText("config.toml");
  // The keyboard continues from where the pointer left it.
  await page.keyboard.press("ArrowDown");
  await expect(active(page)).toContainText("Switch to dark theme");
  // The field keeps the focus through all of it.
  await expect(input(page)).toBeFocused();
  await palette(page).getByRole("option", { name: /idea.tmt/ }).click();
  await expect(outcome(page)).toHaveText("selected idea");
  await expect(palette(page)).toBeHidden();
});

test("a disabled row cannot be chosen or made active", async ({ page }) => {
  const locked = palette(page).getByRole("option", { name: /secrets/ });
  await locked.hover();
  await expect(active(page)).toContainText("readme.tmt");
  await locked.click();
  await expect(palette(page)).toBeVisible();
  await expect(outcome(page)).toHaveText("none");
});

test("Escape and the backdrop close it, return the focus, and clear the query", async ({ page }) => {
  await page.keyboard.type("note");
  await page.keyboard.press("Escape");
  await expect(palette(page)).toBeHidden();
  await expect(opener(page)).toBeFocused();
  await opener(page).click();
  await expect(input(page)).toHaveValue("");
  await expect(options(page)).toHaveCount(31);
  await page.mouse.click(4, 4);
  await expect(palette(page)).toBeHidden();
});

test("Tab and Shift+Tab keep the focus in the field", async ({ page }) => {
  await page.keyboard.press("Tab");
  await expect(input(page)).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(input(page)).toBeFocused();
});

test("the footer shows the hints and the list is only built while it is open", async ({ page }) => {
  await expect(palette(page)).toContainText("move");
  await expect(palette(page)).toContainText("31 items");
  await page.keyboard.press("Escape");
  // Not merely hidden: the rows are not in the document at all.
  await expect(page.locator(".tln-palette-option")).toHaveCount(0);
});

test("a long list scrolls inside the palette and the palette stays within the window", async ({ page }) => {
  const box = (await palette(page).boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  const scrolls = await palette(page).getByRole("listbox").evaluate((el) => el.scrollHeight > el.clientHeight);
  expect(scrolls).toBe(true);
});
