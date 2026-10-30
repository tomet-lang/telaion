import { expect, test, type Page } from "@playwright/test";

const section = (page: Page) =>
  page.locator("section").filter({ has: page.getByRole("heading", { name: "CodeEditor extensions" }) });
const editor = (page: Page) => section(page).getByRole("textbox", { name: "Source with extensions" });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(editor(page)).toBeVisible();
});

async function typeAtEnd(page: Page, text: string) {
  await editor(page).click();
  await page.keyboard.press("Control+End");
  await page.keyboard.type(text);
}

test("without extensions, the editor stays minimal: no closing bracket, no fold gutter", async ({ page }) => {
  await typeAtEnd(page, "(");
  await expect(editor(page)).toContainText("(");
  await expect(editor(page)).not.toContainText("()");
  await expect(section(page).locator(".cm-foldGutter")).toHaveCount(0);
});

test("extensions the application passes are in effect: brackets close, folding appears", async ({ page }) => {
  await section(page).getByLabel("Extensions the application adds").selectOption({ label: "Folding, bracket matching, closing brackets" });
  await expect(section(page).locator(".cm-foldGutter")).toHaveCount(1);
  await typeAtEnd(page, "(");
  await expect(editor(page)).toContainText("()");
});

test("taking the extensions away again restores the minimal editor", async ({ page }) => {
  const choose = (label: string) => section(page).getByLabel("Extensions the application adds").selectOption({ label });
  await choose("Folding, bracket matching, closing brackets");
  await expect(section(page).locator(".cm-foldGutter")).toHaveCount(1);
  await choose("No extensions");
  await expect(section(page).locator(".cm-foldGutter")).toHaveCount(0);
});
