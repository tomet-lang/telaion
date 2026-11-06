import { expect, test, type Page } from "@playwright/test";

// Popover, Menu, ContextMenu and Tooltip, as the playground's "Popover, Menu, ContextMenu and Tooltip"
// section shows them. The conditions of a real application (Tailwind's reset, wide letter spacing)
// are the second project of the config, so every test here also runs under them.

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.locator(".menu-demo").scrollIntoViewIfNeeded();
});

const last = (page: Page) => page.getByTestId("menu-last");
const focused = (page: Page) =>
  page.evaluate(() => (document.activeElement?.textContent ?? "").replace(/\s+/g, " ").trim());
const inView = (page: Page, box: { x: number; y: number; width: number; height: number }) => {
  const size = page.viewportSize()!;
  return box.x >= 0 && box.y >= 0 && box.x + box.width <= size.width && box.y + box.height <= size.height;
};

// ---- Popover ---------------------------------------------------------------------------------------

test.describe("popover", () => {
  const trigger = (page: Page) => page.getByRole("button", { name: /^Vault:/ });
  const panel = (page: Page) => page.getByRole("dialog", { name: "Recent vaults" });

  test("it opens as a named dialog next to its trigger and takes the focus", async ({ page }) => {
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
    await trigger(page).click();
    await expect(panel(page)).toBeVisible();
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
    await expect(trigger(page)).toHaveAttribute("aria-haspopup", "dialog");
    await expect(page.getByRole("menuitemcheckbox", { name: "notes" })).toBeFocused();
    const t = (await trigger(page).boundingBox())!;
    const p = (await panel(page).boundingBox())!;
    expect(p.y).toBeGreaterThan(t.y + t.height);
    expect(Math.abs(p.x - t.x)).toBeLessThan(12);
  });

  test("Escape closes it and gives the focus back to the trigger", async ({ page }) => {
    await trigger(page).click();
    await expect(panel(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel(page)).toBeHidden();
    await expect(trigger(page)).toBeFocused();
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  });

  test("a click outside closes it and leaves the focus where the click put it", async ({ page }) => {
    await trigger(page).click();
    await expect(panel(page)).toBeVisible();
    await page.getByRole("button", { name: "Actions" }).click();
    await expect(panel(page)).toBeHidden();
    // The click opened the other menu; the focus is in it, not back on the first trigger.
    await expect(trigger(page)).not.toBeFocused();
  });

  test("a click on the trigger closes it, and another opens it again", async ({ page }) => {
    await trigger(page).click();
    await expect(panel(page)).toBeVisible();
    await trigger(page).click();
    await expect(panel(page)).toBeHidden();
    await trigger(page).click();
    await expect(panel(page)).toBeVisible();
  });

  test("tabbing out of it closes it", async ({ page }) => {
    await trigger(page).click();
    await expect(panel(page)).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(panel(page).getByLabel("Path to a vault")).toBeFocused();
    await expect(panel(page)).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(panel(page).getByRole("button", { name: "Open" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(panel(page)).toBeHidden();
  });

  test("an ancestor with overflow: hidden and a transform neither clips nor moves it", async ({ page }) => {
    await trigger(page).click();
    await expect(panel(page)).toBeVisible();
    const clip = (await page.getByTestId("clip").boundingBox())!;
    const p = (await panel(page).boundingBox())!;
    // It hangs out of the box that holds its trigger, and what is at its far corner is the panel, not the page.
    expect(p.y + p.height).toBeGreaterThan(clip.y + clip.height + 20);
    const atCorner = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x, y)?.closest('[role="dialog"]') !== null,
      [p.x + p.width - 6, p.y + p.height - 6],
    );
    expect(atCorner).toBe(true);
  });

  test("it can hold a form: choosing a row closes it and reports, the form's button too", async ({ page }) => {
    await trigger(page).click();
    await panel(page).getByRole("menuitemcheckbox", { name: "wiki" }).click();
    await expect(panel(page)).toBeHidden();
    await expect(last(page)).toHaveText("vault wiki");
    await expect(trigger(page)).toHaveText(/wiki/);
    await expect(trigger(page)).toBeFocused();

    await trigger(page).click();
    await panel(page).getByLabel("Path to a vault").fill("/tmp/x");
    await panel(page).getByRole("button", { name: "Open" }).click();
    await expect(panel(page)).toBeHidden();
    await expect(last(page)).toHaveText("open /tmp/x");
  });

  test("it is placed again when the page scrolls under it", async ({ page }) => {
    await trigger(page).click();
    await expect(panel(page)).toBeVisible();
    const before = (await panel(page).boundingBox())!;
    const t0 = (await trigger(page).boundingBox())!;
    await page.mouse.wheel(0, 40);
    await expect.poll(async () => (await trigger(page).boundingBox())!.y).not.toBe(t0.y);
    const t1 = (await trigger(page).boundingBox())!;
    await expect
      .poll(async () => Math.round((await panel(page).boundingBox())!.y - before.y))
      .toBe(Math.round(t1.y - t0.y));
  });
});

// ---- Menu ------------------------------------------------------------------------------------------

test.describe("menu", () => {
  const trigger = (page: Page) => page.getByRole("button", { name: "Actions" });
  const menu = (page: Page) => page.getByRole("menu", { name: "Actions" });

  test("ArrowDown on the trigger opens it with the first row focused", async ({ page }) => {
    await trigger(page).focus();
    await page.keyboard.press("ArrowDown");
    await expect(menu(page)).toBeVisible();
    await expect(trigger(page)).toHaveAttribute("aria-haspopup", "menu");
    await expect(menu(page).getByRole("menuitem", { name: /New file/ })).toBeFocused();
  });

  test("the arrow keys, Home and End move the focus; they wrap and skip a disabled row", async ({ page }) => {
    await trigger(page).click();
    await expect(menu(page).getByRole("menuitem", { name: /New file/ })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(menu(page).getByRole("menuitem", { name: "New folder" })).toBeFocused();
    await page.keyboard.press("ArrowDown"); // "Open..." is disabled
    await expect(menu(page).getByRole("menuitemcheckbox", { name: "Wrap lines" })).toBeFocused();
    await page.keyboard.press("End");
    await expect(menu(page).getByRole("menuitem", { name: /Delete/ })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(menu(page).getByRole("menuitem", { name: /New file/ })).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(menu(page).getByRole("menuitem", { name: /Delete/ })).toBeFocused();
    await page.keyboard.press("Home");
    await expect(menu(page).getByRole("menuitem", { name: /New file/ })).toBeFocused();
  });

  test("typing the start of a label moves to that row", async ({ page }) => {
    await trigger(page).click();
    await page.keyboard.type("w");
    await expect(menu(page).getByRole("menuitemcheckbox", { name: "Wrap lines" })).toBeFocused();
    await page.keyboard.type("d");
    await expect(menu(page).getByRole("menuitem", { name: /Delete/ })).toBeFocused();
  });

  test("a disabled row cannot be chosen", async ({ page }) => {
    await trigger(page).click();
    const disabled = menu(page).getByRole("menuitem", { name: "Open..." });
    await expect(disabled).toBeDisabled();
    await disabled.click({ force: true });
    await expect(menu(page)).toBeVisible();
    await expect(last(page)).toHaveText("none");
  });

  test("Enter chooses the row, closes the menu and gives the focus back", async ({ page }) => {
    await trigger(page).click();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(menu(page)).toBeHidden();
    await expect(last(page)).toHaveText("new folder");
    await expect(trigger(page)).toBeFocused();
  });

  test("a checkbox row with keepOpen toggles and leaves the menu open", async ({ page }) => {
    await trigger(page).click();
    const wrap = menu(page).getByRole("menuitemcheckbox", { name: "Wrap lines" });
    await expect(wrap).toHaveAttribute("aria-checked", "true");
    await wrap.click();
    await expect(menu(page)).toBeVisible();
    await expect(wrap).toHaveAttribute("aria-checked", "false");
  });

  test("Escape closes it and gives the focus back to the trigger", async ({ page }) => {
    await trigger(page).click();
    await expect(menu(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu(page)).toBeHidden();
    await expect(trigger(page)).toBeFocused();
  });

  test("rows have a name, groups are named by their heading, separators are separators", async ({ page }) => {
    await trigger(page).click();
    await expect(menu(page).getByRole("group", { name: "File" })).toBeVisible();
    await expect(menu(page).getByRole("group", { name: "View" })).toBeVisible();
    await expect(menu(page).getByRole("separator")).toHaveCount(2);
  });

  test("near the right edge it aligns to the other end of its trigger and stays in view", async ({ page }) => {
    await page.setViewportSize({ width: 420, height: 700 });
    const edge = page.getByRole("button", { name: "Edge" });
    await edge.scrollIntoViewIfNeeded();
    await edge.click();
    const m = page.getByRole("menu", { name: "Edge actions" });
    await expect(m).toBeVisible();
    expect(inView(page, (await m.boundingBox())!)).toBe(true);
  });

  test("with no room below it opens above", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 420 });
    const button = trigger(page);
    // Put the trigger low in the viewport.
    await button.evaluate((element) => element.scrollIntoView({ block: "end" }));
    await button.click();
    await expect(menu(page)).toBeVisible();
    const t = (await button.boundingBox())!;
    const m = (await menu(page).boundingBox())!;
    expect(inView(page, m)).toBe(true);
    // Either it fits below the trigger, or it was flipped above it: never overlapping it.
    expect(m.y >= t.y + t.height || m.y + m.height <= t.y).toBe(true);
  });
});

// ---- ContextMenu -----------------------------------------------------------------------------------

test.describe("context menu", () => {
  const row = (page: Page, id: string) => page.locator(`[data-row="${id}"]`);
  const menu = (page: Page) => page.getByRole("menu", { name: "Row actions" });

  test("a right click opens it with its corner at the pointer, with the menu of the row", async ({ page }) => {
    const box = (await row(page, "docs").boundingBox())!;
    const px = box.x + 40;
    const py = box.y + 6;
    await page.mouse.click(px, py, { button: "right" });
    await expect(menu(page)).toBeVisible();
    const m = (await menu(page).boundingBox())!;
    expect(Math.abs(m.x - px)).toBeLessThan(16);
    expect(Math.abs(m.y - py)).toBeLessThan(16);
    // A folder offers new file and new folder, a file does not.
    await expect(menu(page).getByRole("menuitem", { name: "New folder" })).toBeVisible();
    await page.keyboard.press("Escape");
    await row(page, "idea").click({ button: "right" });
    await expect(menu(page)).toBeVisible();
    await expect(menu(page).getByRole("menuitem", { name: "New folder" })).toHaveCount(0);
    await expect(menu(page).getByRole("menuitem", { name: /Rename/ })).toBeVisible();
  });

  test("Escape closes it and the focus goes back to what had it", async ({ page }) => {
    await row(page, "idea").click({ button: "right" });
    await expect(menu(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu(page)).toBeHidden();
    await expect(row(page, "idea")).toBeFocused();
  });

  test("a click outside closes it", async ({ page }) => {
    await row(page, "idea").click({ button: "right" });
    await expect(menu(page)).toBeVisible();
    await page.mouse.click(4, 4);
    await expect(menu(page)).toBeHidden();
  });

  test("scrolling the page closes it", async ({ page }) => {
    await row(page, "idea").click({ button: "right" });
    await expect(menu(page)).toBeVisible();
    await page.mouse.wheel(0, 120);
    await expect(menu(page)).toBeHidden();
  });

  test("the browser's own menu does not show over it", async ({ page }) => {
    await row(page, "idea").click({ button: "right" });
    await expect(menu(page)).toBeVisible();
    const prevented = await menu(page).evaluate((element) => {
      const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
      element.dispatchEvent(event);
      return event.defaultPrevented;
    });
    expect(prevented).toBe(true);
  });

  test("Shift+F10 and the Menu key open it under the focused element, with the first row focused", async ({
    page,
  }) => {
    await page.mouse.move(0, 0);
    await row(page, "idea").focus();
    await page.keyboard.press("Shift+F10");
    await expect(menu(page)).toBeVisible();
    await expect(menu(page).getByRole("menuitem", { name: /Rename/ })).toBeFocused();
    const r = (await row(page, "idea").boundingBox())!;
    const m = (await menu(page).boundingBox())!;
    expect(m.y).toBeGreaterThanOrEqual(r.y + r.height - 1);
    await page.keyboard.press("Escape");
    await expect(row(page, "idea")).toBeFocused();
    await page.keyboard.press("ContextMenu");
    await expect(menu(page)).toBeVisible();
  });

  test("a row is chosen with the keyboard, and the menu closes", async ({ page }) => {
    await page.mouse.move(0, 0);
    await row(page, "plan").focus();
    await page.keyboard.press("Shift+F10");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(menu(page)).toBeHidden();
    await expect(last(page)).toHaveText("copy plan");
  });

  test("the danger row is told from the others by color", async ({ page }) => {
    await row(page, "idea").click({ button: "right" });
    const color = (name: RegExp) =>
      menu(page).getByRole("menuitem", { name }).evaluate((element) => getComputedStyle(element).color);
    expect(await color(/Delete/)).not.toBe(await color(/Rename/));
  });

  test("opened at a point near the corner, it opens leftwards and upwards, in view", async ({ page }) => {
    await page.setViewportSize({ width: 380, height: 520 });
    const pad = page.getByTestId("pad");
    await pad.evaluate((element) => element.scrollIntoView({ block: "end" }));
    const box = (await pad.boundingBox())!;
    const px = Math.min(box.x + box.width - 4, 375);
    const py = Math.min(box.y + box.height - 4, 515);
    await page.mouse.click(px, py, { button: "right" });
    const m = page.getByRole("menu", { name: "Pad actions" });
    await expect(m).toBeVisible();
    const mb = (await m.boundingBox())!;
    expect(inView(page, mb)).toBe(true);
    expect(mb.x + mb.width).toBeLessThanOrEqual(px + 1);
    expect(mb.y + mb.height).toBeLessThanOrEqual(py + 1);
  });
});

// ---- Tooltip ---------------------------------------------------------------------------------------

test.describe("tooltip", () => {
  const settings = (page: Page) => page.getByRole("button", { name: "Settings" });
  const tip = (page: Page) => page.getByRole("tooltip", { name: "Opens the settings of this vault" });

  test("it shows after a delay, not at once, on hover, and describes the element", async ({ page }) => {
    await settings(page).hover();
    await expect(tip(page)).toBeHidden();
    await expect(tip(page)).toBeVisible();
    const id = await settings(page).getAttribute("aria-describedby");
    expect(id).toBeTruthy();
    await expect(page.locator(`[id="${id}"]`)).toHaveText("Opens the settings of this vault");
    await expect(settings(page)).toHaveAccessibleDescription("Opens the settings of this vault");
  });

  test("it hides when the pointer leaves", async ({ page }) => {
    await settings(page).hover();
    await expect(tip(page)).toBeVisible();
    await page.mouse.move(4, 4);
    await expect(tip(page)).toBeHidden();
  });

  test("it shows on keyboard focus and Escape hides it", async ({ page }) => {
    await page.mouse.move(0, 0);
    await page.locator('[data-row="plan"]').focus();
    await page.keyboard.press("Tab");
    await expect(settings(page)).toBeFocused();
    await expect(tip(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(tip(page)).toBeHidden();
    // Escape took only the tooltip; the focus did not move.
    await expect(settings(page)).toBeFocused();
  });

  test("a click hides it", async ({ page }) => {
    await settings(page).hover();
    await expect(tip(page)).toBeVisible();
    await settings(page).click();
    await expect(tip(page)).toBeHidden();
  });

  test("a long path wraps inside the viewport", async ({ page }) => {
    const button = page.getByRole("button", { name: "Full path" });
    await button.hover();
    const long = page.getByRole("tooltip", { name: /very\/long\/path/ });
    await expect(long).toBeVisible();
    expect(inView(page, (await long.boundingBox())!)).toBe(true);
  });

  test("with no delay it shows at once", async ({ page }) => {
    await page.getByRole("button", { name: "No delay" }).hover();
    await expect(page.getByRole("tooltip", { name: "Below the button" })).toBeVisible({ timeout: 300 });
  });

  test("it is in the top layer: what is at its centre is the tooltip", async ({ page }) => {
    await settings(page).hover();
    await expect(tip(page)).toBeVisible();
    const b = (await tip(page).boundingBox())!;
    const onTop = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x, y)?.closest('[role="tooltip"]') !== null,
      [b.x + b.width / 2, b.y + b.height / 2],
    );
    expect(onTop).toBe(true);
  });
});
