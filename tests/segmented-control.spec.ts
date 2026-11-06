import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

const group = (page: Page, name = "Editing mode") => page.getByRole("radiogroup", { name, exact: true });
const radio = (page: Page, item: string, name?: string) => group(page, name).getByRole("radio", { name: item });

test.describe("SegmentedControl", () => {
  test("is a named radio group with exactly one checked item", async ({ page }) => {
    await expect(group(page).getByRole("radio")).toHaveCount(4);
    await expect(radio(page, "Hybrid")).toHaveAttribute("aria-checked", "true");
    await expect(group(page).locator('[aria-checked="true"]')).toHaveCount(1);
  });

  test("a click chooses, updates the value and calls onchange", async ({ page }) => {
    await radio(page, "Kanban").click();
    await expect(radio(page, "Kanban")).toHaveAttribute("aria-checked", "true");
    await expect(radio(page, "Hybrid")).toHaveAttribute("aria-checked", "false");
    await expect(page.getByText("value = kanban · changed = kanban")).toBeVisible();
  });

  test("only the checked item is in the Tab order", async ({ page }) => {
    const stops = await group(page).getByRole("radio").evaluateAll((els) => els.map((el) => (el as HTMLElement).tabIndex));
    expect(stops).toEqual([-1, 0, -1, -1]);
  });

  test("the arrow keys move the choice and the focus, wrapping around; Home and End jump", async ({ page }) => {
    await radio(page, "Hybrid").focus();
    await page.keyboard.press("ArrowRight");
    await expect(radio(page, "Full")).toBeFocused();
    await expect(radio(page, "Full")).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("ArrowDown");
    await expect(radio(page, "Kanban")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(radio(page, "Source")).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(radio(page, "Kanban")).toBeFocused();
    await page.keyboard.press("Home");
    await expect(radio(page, "Source")).toBeFocused();
    await page.keyboard.press("End");
    await expect(radio(page, "Kanban")).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(radio(page, "Full")).toBeFocused();
  });

  test("a disabled item cannot be chosen and the arrow keys skip it", async ({ page }) => {
    const name = "Editing mode, one unavailable";
    await expect(radio(page, "Hybrid", name)).toBeDisabled();
    await radio(page, "Source", name).focus();
    await page.keyboard.press("ArrowRight");
    await expect(radio(page, "Full", name)).toBeFocused();
    await expect(radio(page, "Hybrid", name)).toHaveAttribute("aria-checked", "false");
  });

  test("a disabled group has nothing to choose", async ({ page }) => {
    const name = "Editing mode, disabled";
    for (const item of ["Source", "Hybrid", "Full", "Kanban"]) await expect(radio(page, item, name)).toBeDisabled();
    await expect(radio(page, "Hybrid", name)).toHaveAttribute("aria-checked", "true");
  });

  test("icon only: the label is the accessible name and the tooltip", async ({ page }) => {
    const name = "Editing mode, icons";
    const source = radio(page, "Source", name);
    await expect(source).toHaveAttribute("title", "Source");
    await expect(source).toHaveText("");
  });

  test("the chosen item is raised: it casts a shadow and the others do not", async ({ page }) => {
    const [chosen, other] = await Promise.all([
      radio(page, "Hybrid").evaluate((el) => getComputedStyle(el).boxShadow),
      radio(page, "Full").evaluate((el) => getComputedStyle(el).boxShadow),
    ]);
    expect(chosen).not.toBe("none");
    expect(other).toBe("none");
  });
});
