import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  // Allow transitions / layout to settle
  await page.waitForTimeout(200);
});

test.describe("SplitPane", () => {
  test("separator has appropriate ARIA attributes", async ({ page }) => {
    const section = page.getByTestId("split-pane-section");
    const horizontalSeparator = section.getByRole("separator").first();

    await expect(horizontalSeparator).toHaveAttribute("aria-orientation", "vertical");
    await expect(horizontalSeparator).toHaveAttribute("aria-valuenow", "40");
    await expect(horizontalSeparator).toHaveAttribute("aria-valuemin", "15");
    await expect(horizontalSeparator).toHaveAttribute("aria-valuemax", "85");
    await expect(horizontalSeparator).toHaveAttribute("tabindex", "0");

    const verticalSeparator = section.getByRole("separator").nth(1);
    await expect(verticalSeparator).toHaveAttribute("aria-orientation", "horizontal");
    await expect(verticalSeparator).toHaveAttribute("aria-valuenow", "50");
    await expect(verticalSeparator).toHaveAttribute("aria-valuemin", "20");
    await expect(verticalSeparator).toHaveAttribute("aria-valuemax", "80");
  });

  test("keyboard navigation resizes horizontal pane", async ({ page }) => {
    const section = page.getByTestId("split-pane-section");
    const resizer = section.getByRole("separator").first();

    await resizer.focus();
    await expect(resizer).toBeFocused();

    // ArrowRight increases primary ratio
    await page.keyboard.press("ArrowRight");
    await expect(resizer).toHaveAttribute("aria-valuenow", "42");
    await expect(page.getByTestId("split-horizontal-primary")).toHaveText("Left (42%)");

    // ArrowLeft decreases primary ratio
    await page.keyboard.press("ArrowLeft");
    await expect(resizer).toHaveAttribute("aria-valuenow", "40");

    // Home jumps to min
    await page.keyboard.press("Home");
    await expect(resizer).toHaveAttribute("aria-valuenow", "15");
    await expect(page.getByTestId("split-horizontal-primary")).toHaveText("Left (15%)");

    // End jumps to max
    await page.keyboard.press("End");
    await expect(resizer).toHaveAttribute("aria-valuenow", "85");
    await expect(page.getByTestId("split-horizontal-primary")).toHaveText("Left (85%)");

    // ArrowRight when at max stays at max
    await page.keyboard.press("ArrowRight");
    await expect(resizer).toHaveAttribute("aria-valuenow", "85");
  });

  test("keyboard navigation resizes vertical pane", async ({ page }) => {
    const section = page.getByTestId("split-pane-section");
    const resizer = section.getByRole("separator").nth(1);

    await resizer.focus();
    await expect(resizer).toBeFocused();

    // ArrowDown increases primary ratio
    await page.keyboard.press("ArrowDown");
    await expect(resizer).toHaveAttribute("aria-valuenow", "52");
    await expect(page.getByTestId("split-vertical-primary")).toHaveText("Top (52%)");

    // ArrowUp decreases primary ratio
    await page.keyboard.press("ArrowUp");
    await expect(resizer).toHaveAttribute("aria-valuenow", "50");

    // Shift+ArrowDown increases by 10%
    await page.keyboard.press("Shift+ArrowDown");
    await expect(resizer).toHaveAttribute("aria-valuenow", "60");
  });

  test("pointer drag resizes the pane", async ({ page }) => {
    const section = page.getByTestId("split-pane-section");
    const resizer = section.getByRole("separator").first();

    await resizer.scrollIntoViewIfNeeded();
    const box = await resizer.boundingBox();
    expect(box).not.toBeNull();

    const startX = box!.x + box!.width / 2;
    const startY = box!.y + box!.height / 2;

    // Drag to the right by ~100px
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 100, startY);
    await page.mouse.up();

    // Value should have increased from initial 40
    const valStr = await resizer.getAttribute("aria-valuenow");
    const val = Number(valStr);
    expect(val).toBeGreaterThan(40);
  });
});
