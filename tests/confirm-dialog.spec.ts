import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

const outcome = (page: Page) => page.getByLabel("dialog outcome");
const open = (page: Page, name: string) => page.getByRole("button", { name, exact: true }).click();
const dialog = (page: Page, name: string) => page.getByRole("alertdialog", { name });

test.describe("a plain confirmation", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "Confirm: info");
  });

  test("is an alert dialog with a name and a description, and has no close button", async ({ page }) => {
    const d = dialog(page, "Reload the page?");
    await expect(d).toBeVisible();
    await expect(d).toHaveAccessibleDescription(/changed on disk/);
    await expect(d.getByRole("button", { name: "Close", exact: true })).toHaveCount(0);
  });

  test("the focus starts on the confirm action, so Enter confirms", async ({ page }) => {
    await expect(dialog(page, "Reload the page?").getByRole("button", { name: "Reload" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(outcome(page)).toHaveText("reloaded");
  });

  test("Cancel, Escape and the backdrop each cancel and close", async ({ page }) => {
    const d = dialog(page, "Reload the page?");
    await d.getByRole("button", { name: "Cancel" }).click();
    await expect(d).toBeHidden();
    await expect(outcome(page)).toHaveText("reload cancelled");

    for (const dismiss of [() => page.keyboard.press("Escape"), () => page.mouse.click(4, 4)]) {
      await open(page, "Confirm: info");
      await expect(d).toBeVisible();
      await dismiss();
      await expect(d).toBeHidden();
      await expect(outcome(page)).toHaveText("reload cancelled");
    }
  });

  test("the focus returns to the opener", async ({ page }) => {
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Confirm: info", exact: true })).toBeFocused();
  });

  test("Tab never leaves the dialog", async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => document.activeElement?.closest("dialog") !== null)).toBe(true);
    }
  });
});

test.describe("tones", () => {
  for (const [button, title, tone] of [
    ["Confirm: ok", "Publish", "ok"],
    ["Confirm: warn", "Leave without saving?", "warn"],
    ["Confirm: info", "Reload the page?", "info"],
    ["Confirm: destructive", "Delete file", "danger"],
  ]) {
    test(`${tone} shows its own icon color, with no frame around it`, async ({ page }) => {
      await open(page, button);
      const d = dialog(page, title);
      const icon = d.locator(".tln-confirm-icon");
      const [color, expected, border] = await icon.evaluate((el, tone) => {
        const probe = document.createElement("i");
        probe.style.color = `var(--tln-${tone === "info" ? "accent" : tone})`;
        document.body.append(probe);
        const expected = getComputedStyle(probe).color;
        probe.remove();
        return [getComputedStyle(el).color, expected, getComputedStyle(el).borderTopWidth];
      }, tone);
      expect(color).toBe(expected);
      expect(border).toBe("0px");
    });
  }
});

test.describe("a destructive confirmation", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "Confirm: destructive");
  });

  test("the focus starts on Cancel, so a hasty Enter does the safe thing", async ({ page }) => {
    await expect(dialog(page, "Delete file").getByRole("button", { name: "Cancel" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(outcome(page)).toHaveText("delete cancelled");
  });

  test("the confirm action is the filled danger button and confirms", async ({ page }) => {
    const button = dialog(page, "Delete file").getByRole("button", { name: "Delete" });
    await expect(button).toHaveAttribute("data-variant", "danger-fill");
    await button.click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(outcome(page)).toHaveText("deleted");
    await expect(page.getByLabel("delete cancels")).toHaveText("0");
  });

  test("every way of dismissing it reports a cancel exactly once", async ({ page }) => {
    const cancels = page.getByLabel("delete cancels");
    await page.keyboard.press("Escape");
    await expect(cancels).toHaveText("1");
    await open(page, "Confirm: destructive");
    await page.mouse.click(4, 4);
    await expect(cancels).toHaveText("2");
    await open(page, "Confirm: destructive");
    await dialog(page, "Delete file").getByRole("button", { name: "Cancel" }).click();
    await expect(cancels).toHaveText("3");
    // Enter on Cancel is a click on Cancel: also once.
    await open(page, "Confirm: destructive");
    await page.keyboard.press("Enter");
    await expect(cancels).toHaveText("4");
  });
});

test("a snippet message can carry richer content", async ({ page }) => {
  await open(page, "Confirm: snippet message");
  const d = dialog(page, "Delete folder");
  await expect(d.locator("code")).toHaveText("drafts");
  await expect(d).toHaveAccessibleDescription(/Delete drafts and everything in it/);
  await d.getByRole("button", { name: "Delete folder" }).click();
  await expect(outcome(page)).toHaveText("folder deleted");
});

test.describe("three answers", () => {
  const d = (page: Page) => dialog(page, "Unsaved changes");

  test("they are ordered cancel, alternative, confirm; the focus starts on the confirm", async ({ page }) => {
    await open(page, "Confirm: three answers");
    const names = await d(page).getByRole("button").allTextContents();
    expect(names.map((n) => n.trim())).toEqual(["Cancel", "Don't save", "Save"]);
    await expect(d(page).getByRole("button", { name: "Save" })).toBeFocused();
    await expect(d(page).getByRole("button", { name: "Don't save" })).toHaveAttribute("data-variant", "danger");
  });

  test("each answer does its own thing, and Escape is a cancel, never the alternative", async ({ page }) => {
    for (const [action, expected] of [
      [() => d(page).getByRole("button", { name: "Save" }).click(), "saved"],
      [() => d(page).getByRole("button", { name: "Don't save" }).click(), "discarded"],
      [() => d(page).getByRole("button", { name: "Cancel" }).click(), "close cancelled"],
      [() => page.keyboard.press("Escape"), "close cancelled"],
    ] as const) {
      await open(page, "Confirm: three answers");
      await action();
      await expect(page.getByRole("alertdialog")).toHaveCount(0);
      await expect(outcome(page)).toHaveText(expected);
      await page.reload();
    }
  });
});

test.describe("a narrow window and a name with no place to break", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test("the message and the answers stay inside the dialog", async ({ page }) => {
    await open(page, "Confirm: long name");
    const d = dialog(page, "Delete file");
    const frame = (await d.boundingBox())!;
    const message = (await d.locator(".tln-confirm-message").boundingBox())!;
    expect(message.x + message.width).toBeLessThanOrEqual(frame.x + frame.width);
    for (const name of ["Cancel", "Delete"]) {
      const box = (await d.getByRole("button", { name }).boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(frame.x);
      expect(box.x + box.width).toBeLessThanOrEqual(frame.x + frame.width);
    }
    const overflow = await d.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(overflow).toBe(false);
  });
});
