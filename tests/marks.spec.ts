import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

const checkbox = (page: Page, name: string) => page.getByRole("checkbox", { name, exact: true });
const radio = (page: Page, name: string) => page.getByRole("radio", { name, exact: true });
const toggle = (page: Page, name: string) => page.getByRole("switch", { name, exact: true });
const slider = (page: Page, name: string) => page.getByRole("slider", { name, exact: true });

/** The well drawn right after the native input: what is seen of a Checkbox, a Radio or a Switch. */
const drawn = (control: ReturnType<typeof checkbox>) => control.locator("xpath=following-sibling::span[1]");

test.describe("Checkbox", () => {
  test("a click and the Space key toggle it", async ({ page }) => {
    const box = checkbox(page, "Unchecked");
    await expect(box).not.toBeChecked();
    await box.click();
    await expect(box).toBeChecked();
    await box.focus();
    await page.keyboard.press("Space");
    await expect(box).not.toBeChecked();
  });

  test("a checked one shows a tick, an indeterminate one a dash, and an unchecked one nothing", async ({ page }) => {
    // The marks are always there and the native input shows one of them: what is seen is that one.
    await expect(drawn(checkbox(page, "Checked")).locator('[data-for="checked"]')).toBeVisible();
    await expect(drawn(checkbox(page, "Checked")).locator('[data-for="indeterminate"]')).toBeHidden();
    await expect(drawn(checkbox(page, "Unchecked")).locator('[data-for="checked"]')).toBeHidden();
    await expect(drawn(checkbox(page, "Some of three")).locator('[data-for="indeterminate"]')).toBeVisible();
    await expect(drawn(checkbox(page, "Some of three")).locator('[data-for="checked"]')).toBeHidden();
  });

  test("a tick shows when the box is checked and goes when it is not", async ({ page }) => {
    const tick = drawn(checkbox(page, "Unchecked")).locator('[data-for="checked"]');
    await expect(tick).toBeHidden();
    await checkbox(page, "Unchecked").click();
    await expect(tick).toBeVisible();
    await checkbox(page, "Unchecked").click();
    await expect(tick).toBeHidden();
  });

  test("indeterminate follows the parts, and a click on it chooses all of them", async ({ page }) => {
    const all = checkbox(page, "Some of three");
    await expect(all).toHaveJSProperty("indeterminate", true);
    await expect(page.getByText("state = some")).toBeVisible();
    await all.click();
    await expect(all).toBeChecked();
    await expect(all).toHaveJSProperty("indeterminate", false);
    await expect(page.getByText("state = all")).toBeVisible();
    await checkbox(page, "Part 2").click();
    await expect(all).toHaveJSProperty("indeterminate", true);
    await expect(all).not.toBeChecked();
  });

  test("a disabled one cannot be toggled", async ({ page }) => {
    await expect(checkbox(page, "Disabled")).toBeDisabled();
    await expect(checkbox(page, "Disabled, checked")).toBeDisabled();
    await expect(checkbox(page, "Disabled, checked")).toBeChecked();
  });

  test("an invalid one says so", async ({ page }) => {
    await expect(checkbox(page, "Invalid")).toHaveAttribute("aria-invalid", "true");
  });

  test("inside a Field it takes the id, the error and the hint from it", async ({ page }) => {
    const box = page.getByRole("checkbox", { name: /Confirmation/ });
    await expect(box).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("alert").filter({ hasText: "Confirm to continue." })).toBeVisible();
    await expect(box).toHaveAccessibleDescription("Confirm to continue.");
    await box.click();
    await expect(page.getByText("Confirm to continue.")).toHaveCount(0);
    await expect(page.getByText("Both are needed.")).toBeVisible();
  });
});

test.describe("Radio", () => {
  test("is one choice among those of its name; a click chooses it", async ({ page }) => {
    await expect(radio(page, "Monthly")).toBeChecked();
    await radio(page, "Yearly").click();
    await expect(radio(page, "Yearly")).toBeChecked();
    await expect(radio(page, "Monthly")).not.toBeChecked();
    await expect(page.getByText("plan = yearly")).toBeVisible();
  });

  test("the arrow keys move the choice and skip a disabled one", async ({ page }) => {
    await radio(page, "Monthly").focus();
    await page.keyboard.press("ArrowRight");
    await expect(radio(page, "Yearly")).toBeFocused();
    await expect(radio(page, "Yearly")).toBeChecked();
    await page.keyboard.press("ArrowRight");
    await expect(radio(page, "Monthly")).toBeFocused();
    await expect(radio(page, "Never")).toBeDisabled();
  });

  test("the chosen one shows a dot", async ({ page }) => {
    await expect(drawn(radio(page, "Monthly")).locator(".tln-radio-dot")).toBeVisible();
    await expect(drawn(radio(page, "Yearly")).locator(".tln-radio-dot")).toBeHidden();
  });
});

test.describe("Switch", () => {
  test("a click and the Space key switch it", async ({ page }) => {
    const control = toggle(page, "Autosave");
    await expect(control).not.toBeChecked();
    await control.click();
    await expect(control).toBeChecked();
    await expect(page.getByText("autosave = true")).toBeVisible();
    await control.focus();
    await page.keyboard.press("Space");
    await expect(control).not.toBeChecked();
  });

  test("the thumb moves across when it is on", async ({ page }) => {
    const thumbX = (name: string) =>
      drawn(toggle(page, name)).locator(".tln-switch-thumb").evaluate((el) => el.getBoundingClientRect().left);
    const trackX = (name: string) => drawn(toggle(page, name)).evaluate((el) => el.getBoundingClientRect().left);
    const off = (await thumbX("Autosave")) - (await trackX("Autosave"));
    const on = (await thumbX("Notifications")) - (await trackX("Notifications"));
    expect(on).toBeGreaterThan(off + 10);
  });

  test("a disabled one cannot be switched", async ({ page }) => {
    await expect(toggle(page, "Disabled, on")).toBeDisabled();
    await expect(toggle(page, "Disabled, on")).toBeChecked();
    await expect(toggle(page, "Disabled, off")).toBeDisabled();
  });
});

test.describe("Slider", () => {
  test("is named by its label and shows its value", async ({ page }) => {
    await expect(slider(page, "Volume")).toHaveValue("40");
    await expect(page.locator("output").filter({ hasText: /^40$/ })).toBeVisible();
  });

  test("the arrow keys, Home and End change the value", async ({ page }) => {
    const volume = slider(page, "Volume");
    await volume.focus();
    await page.keyboard.press("ArrowRight");
    await expect(volume).toHaveValue("41");
    await expect(page.locator("output").filter({ hasText: /^41$/ })).toBeVisible();
    await page.keyboard.press("Home");
    await expect(volume).toHaveValue("0");
    await page.keyboard.press("End");
    await expect(volume).toHaveValue("100");
  });

  test("a click sets the value where the pointer is, and the thumb is drawn there", async ({ page }) => {
    const volume = slider(page, "Volume");
    const body = volume.locator("xpath=..");
    await body.scrollIntoViewIfNeeded();
    const rect = (await body.boundingBox())!;
    const x = rect.x + rect.width * 0.75;
    await page.mouse.click(x, rect.y + rect.height / 2);
    const value = Number(await volume.inputValue());
    expect(value).toBeGreaterThan(70);
    expect(value).toBeLessThan(85);
    const thumb = (await body.locator(".tln-slider-thumb").boundingBox())!;
    expect(Math.abs(thumb.x + thumb.width / 2 - x)).toBeLessThan(3);
  });

  test("a drag sets the value", async ({ page }) => {
    const volume = slider(page, "Volume");
    await volume.locator("xpath=..").scrollIntoViewIfNeeded();
    const rect = (await volume.locator("xpath=..").boundingBox())!;
    await page.mouse.move(rect.x + rect.width * 0.4, rect.y + rect.height / 2);
    await page.mouse.down();
    await page.mouse.move(rect.x + rect.width * 0.9, rect.y + rect.height / 2, { steps: 5 });
    await page.mouse.up();
    expect(Number(await volume.inputValue())).toBeGreaterThan(85);
  });

  test("a step of a fraction is written by `format`", async ({ page }) => {
    const opacity = slider(page, "Opacity");
    await opacity.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("output").filter({ hasText: /^0\.55$/ })).toBeVisible();
  });

  test("a disabled one cannot be set", async ({ page }) => {
    await expect(slider(page, "Disabled")).toBeDisabled();
  });
});

test.describe("the radius and the height", () => {
  const radiusOf = (control: ReturnType<typeof checkbox>) =>
    drawn(control).evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));

  test("a box follows the radius, up to half of its side", async ({ page }) => {
    const box = checkbox(page, "Unchecked");
    const set = (radius: number) =>
      page.evaluate((r) => document.documentElement.style.setProperty("--tln-radius", `${r}px`), radius);
    await set(0);
    expect(await radiusOf(box)).toBe(0);
    await set(4);
    expect(await radiusOf(box)).toBe(4);
    await set(24);
    const side = await drawn(box).evaluate((el) => el.getBoundingClientRect().width);
    expect(await radiusOf(box)).toBeCloseTo(side / 2, 0);
  });

  test("the thumb of a switch and of a slider are actions: they cast a shadow that --tln-height scales", async ({ page }) => {
    const shadowOf = () =>
      page
        .locator(".tln-slider-thumb")
        .first()
        .evaluate((el) => getComputedStyle(el).boxShadow);
    await page.evaluate(() => document.documentElement.style.setProperty("--tln-height", "0"));
    const low = await shadowOf();
    await page.evaluate(() => document.documentElement.style.setProperty("--tln-height", "3"));
    const high = await shadowOf();
    expect(high).not.toBe(low);
  });
});
