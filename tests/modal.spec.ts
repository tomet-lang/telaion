import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("it opens as a named dialog and focuses the autofocus control", async ({ page }) => {
  await page.getByRole("button", { name: "Open modal" }).click();
  const dialog = page.getByRole("dialog", { name: "New page" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Path")).toBeFocused();
});

test("Escape closes it and returns the focus to the opener", async ({ page }) => {
  const opener = page.getByRole("button", { name: "Open modal" });
  await opener.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(opener).toBeFocused();
});

test("Tab and Shift+Tab never leave the dialog", async ({ page }) => {
  await page.getByRole("button", { name: "Open modal" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const insideDialog = () => page.evaluate(() => document.activeElement?.closest("dialog") !== null);

  // More presses than the dialog has focusable elements, so the focus must wrap around.
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    expect(await insideDialog()).toBe(true);
  }
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Shift+Tab");
    expect(await insideDialog()).toBe(true);
  }
});

test("the page behind an open modal cannot be clicked", async ({ page }) => {
  await page.getByRole("button", { name: "Open modal" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  // The top bar is behind the backdrop, so a click there lands on the backdrop and closes the modal
  // instead of reaching the theme switch.
  await page.getByRole("button", { name: "dark" }).click({ force: true });
  await expect(page.locator("html")).not.toHaveAttribute("data-theme");
});

test("clicking the backdrop closes it; clicking inside does not", async ({ page }) => {
  await page.getByRole("button", { name: "Open modal" }).click();
  const dialog = page.getByRole("dialog", { name: "New page" });
  await dialog.getByText("Relative to the vault root.").click();
  await expect(dialog).toBeVisible();
  await page.mouse.click(4, 4);
  await expect(dialog).toBeHidden();
});

test("the close button, Cancel and Create each close it and report once", async ({ page }) => {
  const opener = page.getByRole("button", { name: "Open modal" });
  const dialog = page.getByRole("dialog", { name: "New page" });
  const closeCount = (n: number) => expect(page.getByText(`closed ${n} times`)).toBeVisible();

  await opener.click();
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toBeHidden();
  await closeCount(1);

  await opener.click();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  await closeCount(2);

  await opener.click();
  await dialog.getByRole("button", { name: "Create" }).click();
  await expect(dialog).toBeHidden();
  await closeCount(3);
});

test("it can be reopened after closing", async ({ page }) => {
  const opener = page.getByRole("button", { name: "Open modal" });
  await opener.click();
  await page.keyboard.press("Escape");
  await opener.click();
  await expect(page.getByRole("dialog", { name: "New page" })).toBeVisible();
});

test("the full size covers the whole viewport", async ({ page }) => {
  await page.getByRole("button", { name: "Open full-screen" }).click();
  const dialog = page.getByRole("dialog", { name: "Editor" });
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  const viewport = page.viewportSize()!;
  expect(box).toMatchObject({ x: 0, y: 0, width: viewport.width, height: viewport.height });
});

test("it stays centered when a CSS reset removes every margin", async ({ page }) => {
  // What Tailwind's preflight does to every element. The dialog's own margin: auto is lost with it.
  await page.addStyleTag({
    content: "*, ::before, ::after { box-sizing: border-box; margin: 0; padding: 0; border: 0 solid; }",
  });
  await page.getByRole("button", { name: "Open modal" }).click();
  const dialog = page.getByRole("dialog", { name: "New page" });
  await expect(dialog).toBeVisible();
  const box = (await dialog.boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(box.x + box.width / 2).toBeCloseTo(viewport.width / 2, 0);
  expect(box.y + box.height / 2).toBeCloseTo(viewport.height / 2, 0);
});
