import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  // Every test starts from a loaded document. Without this wait, a test that changes the stored
  // document can do so before the first load finishes, and the load then simply reads the new version.
  await expect(page.getByRole("textbox", { name: "Document source" })).toContainText("A first line.");
});

const editor = (page: Page) => page.getByRole("textbox", { name: "Document source" });
const status = (page: Page, text: string) =>
  page.locator(".tln-editor .tln-badge").filter({ hasText: text });
const save = (page: Page) => page.locator(".tln-editor").getByRole("button", { name: "Save", exact: true });
const saves = (page: Page) => page.getByLabel("saves");
const storedText = (page: Page) => page.getByLabel("stored text");

/** Put the cursor at the end of the document and type. */
async function typeAtEnd(page: Page, text: string) {
  await editor(page).click();
  await page.keyboard.press("Control+End");
  await page.keyboard.type(text);
}

test("it loads the document and starts clean", async ({ page }) => {
  await expect(editor(page)).toContainText("A first line.");
  await expect(status(page, "Saved")).toBeVisible();
  await expect(save(page)).toBeDisabled();
});

test("typing makes it unsaved and enables Save", async ({ page }) => {
  await typeAtEnd(page, "more");
  await expect(status(page, "Unsaved")).toBeVisible();
  await expect(save(page)).toBeEnabled();
});

test("undoing back to the loaded text makes it clean again", async ({ page }) => {
  await typeAtEnd(page, "more");
  await expect(status(page, "Unsaved")).toBeVisible();
  await page.keyboard.press("Control+z");
  await expect(status(page, "Saved")).toBeVisible();
});

test("the Save button writes what was typed", async ({ page }) => {
  await typeAtEnd(page, "from the button");
  await save(page).click();
  await expect(status(page, "Saved")).toBeVisible();
  await expect(saves(page)).toHaveText("1");
  await expect(storedText(page)).toContainText("from the button");
});

test("Ctrl+S saves from inside the editor, once", async ({ page }) => {
  await typeAtEnd(page, "from the keyboard");
  await page.keyboard.press("Control+s");
  await expect(status(page, "Saved")).toBeVisible();
  await expect(saves(page)).toHaveText("1");
  await expect(storedText(page)).toContainText("from the keyboard");
  // Nothing changed since, so saving again does nothing.
  await page.keyboard.press("Control+s");
  await page.waitForTimeout(400);
  await expect(saves(page)).toHaveText("1");
});

test("text typed while a save is running stays unsaved and is not lost", async ({ page }) => {
  await typeAtEnd(page, "first");
  await page.keyboard.press("Control+s");
  await expect(status(page, "Saving")).toBeVisible();
  await page.keyboard.type(" and second");
  await expect(status(page, "Unsaved")).toBeVisible();
  await expect(storedText(page)).toContainText("first");
  await expect(storedText(page)).not.toContainText("second");
  await expect(editor(page)).toContainText("first and second");
});

test("a newer stored version is a conflict: the edit is kept and nothing is overwritten", async ({ page }) => {
  await page.getByRole("button", { name: "Simulate a remote change" }).click();
  await typeAtEnd(page, "my edit");
  await save(page).click();
  await expect(status(page, "Conflict")).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "stored version changed" })).toBeVisible();
  await expect(saves(page)).toHaveText("0");
  await expect(editor(page)).toContainText("my edit");
});

test("a failed save shows the error, keeps the edit, and can be retried", async ({ page }) => {
  await page.getByRole("button", { name: "Fail the next save" }).click();
  await typeAtEnd(page, "needs a retry");
  await save(page).click();
  const alert = page.getByRole("alert").filter({ hasText: "Could not save the document: the network is down" });
  await expect(alert).toBeVisible();
  await expect(status(page, "Unsaved")).toBeVisible();

  await alert.getByRole("button", { name: "Dismiss" }).click();
  await expect(alert).toHaveCount(0);

  await save(page).click();
  await expect(status(page, "Saved")).toBeVisible();
  await expect(storedText(page)).toContainText("needs a retry");
});

test("read-only blocks typing and saving", async ({ page }) => {
  await page.getByRole("button", { name: "Make read-only" }).click();
  await editor(page).click();
  await page.keyboard.press("Control+End");
  await page.keyboard.type("blocked");
  await expect(editor(page)).not.toContainText("blocked");
  await expect(status(page, "Saved")).toBeVisible();
  await expect(save(page)).toBeDisabled();
});

for (const scheme of ["light", "dark"] as const) {
  test(`the editor follows the ${scheme} theme through the tokens`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    const [editorBackground, tokenBackground] = await Promise.all([
      page.locator(".cm-editor").evaluate((el) => getComputedStyle(el).backgroundColor),
      page.evaluate(() => {
        const probe = document.createElement("i");
        probe.style.color = "var(--tln-bg)";
        document.body.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      }),
    ]);
    expect(editorBackground).toBe(tokenBackground);
  });
}
