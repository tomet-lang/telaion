import { expect, test, type Page } from "@playwright/test";

const EXTRAS = "Folding, bracket matching, closing brackets, search";

const section = (page: Page) =>
  page.locator("section").filter({ has: page.getByRole("heading", { name: "CodeEditor extensions" }) });
const editor = (page: Page) => section(page).getByRole("textbox", { name: "Source with extensions" });
const choose = (page: Page, label: string) =>
  section(page).getByLabel("Extensions the application adds").selectOption({ label });

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
  await choose(page, EXTRAS);
  await expect(section(page).locator(".cm-foldGutter")).toHaveCount(1);
  await typeAtEnd(page, "(");
  await expect(editor(page)).toContainText("()");
});

test("taking the extensions away again restores the minimal editor", async ({ page }) => {
  await choose(page, EXTRAS);
  await expect(section(page).locator(".cm-foldGutter")).toHaveCount(1);
  await choose(page, "No extensions");
  await expect(section(page).locator(".cm-foldGutter")).toHaveCount(0);
});

for (const scheme of ["light", "dark"] as const) {
  test.describe(`the search panel, in the ${scheme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await choose(page, EXTRAS);
      await editor(page).click();
      await page.keyboard.press("Control+f");
      await expect(section(page).locator(".cm-search")).toBeVisible();
      // The pointer rests where the editor was clicked, which can be under a button of the new
      // panel. A hovered button has another color, so move the pointer out of the way.
      await page.mouse.move(0, 0);
    });

    // What a token resolves to, as the browser computes it.
    const token = (page: Page, name: string) =>
      page.evaluate((variable) => {
        const probe = document.createElement("i");
        probe.style.color = `var(${variable})`;
        document.body.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      }, name);
    const style = (page: Page, selector: string, property: string) =>
      section(page)
        .locator(selector)
        .first()
        .evaluate((el, prop) => getComputedStyle(el).getPropertyValue(prop), property);

    test("the panel and its fields use the tokens, not the light colors CodeMirror brings", async ({ page }) => {
      expect(await style(page, ".cm-panels", "background-color")).toBe(await token(page, "--tln-bg-subtle"));
      expect(await style(page, ".cm-search .cm-textfield", "background-color")).toBe(await token(page, "--tln-bg"));
      expect(await style(page, ".cm-search .cm-textfield", "color")).toBe(await token(page, "--tln-fg"));
      expect(await style(page, ".cm-search .cm-button", "background-color")).toBe(await token(page, "--tln-bg-subtle"));
    });

    test("the buttons carry no gradient", async ({ page }) => {
      expect(await style(page, ".cm-search .cm-button", "background-image")).toBe("none");
    });
  });
}
