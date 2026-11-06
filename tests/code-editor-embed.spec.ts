import { expect, test, type Page } from "@playwright/test";

const section = (page: Page) =>
  page.locator("section").filter({ has: page.getByRole("heading", { name: "CodeEditor: field and pane" }) });
const field = (page: Page) => section(page).getByRole("textbox", { name: "Field editor" });
const bare = (page: Page) => section(page).getByRole("textbox", { name: "Bare editor" });
const fieldHost = (page: Page) => section(page).locator('.tln-code-editor[data-variant="field"]');
const bareHost = (page: Page) => section(page).locator('.tln-code-editor[data-variant="bare"]');
const count = (page: Page, label: string) => section(page).getByLabel(label);

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

const style = (host: ReturnType<typeof fieldHost>, property: string) =>
  host.evaluate((el, prop) => getComputedStyle(el).getPropertyValue(prop), property);

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(field(page)).toBeVisible();
  await expect(bare(page)).toBeVisible();
});

test.describe("the field (default)", () => {
  test("is a well: the well tone, a radius, an inward shadow", async ({ page }) => {
    expect(await style(fieldHost(page), "background-color")).toBe(await token(page, "--tln-well"));
    expect(await style(fieldHost(page), "border-radius")).not.toBe("0px");
    expect(await style(fieldHost(page), "box-shadow")).not.toBe("none");
  });

  test("shows a focus ring while it is in use, and none otherwise", async ({ page }) => {
    await expect(fieldHost(page)).toHaveCSS("outline-style", "none");
    await field(page).click();
    await expect(fieldHost(page)).toHaveCSS("outline-style", "solid");
    await expect(fieldHost(page)).toHaveCSS("outline-width", "2px");
    await page.keyboard.press("Tab");
    await expect(fieldHost(page)).toHaveCSS("outline-style", "none");
  });
});

test.describe("the bare editor", () => {
  test("draws no surface, radius, shadow or ring: it is text on the pane", async ({ page }) => {
    expect(await style(bareHost(page), "background-color")).toBe("rgba(0, 0, 0, 0)");
    expect(await style(bareHost(page), "border-radius")).toBe("0px");
    expect(await style(bareHost(page), "box-shadow")).toBe("none");
    await bare(page).click();
    await expect(bareHost(page)).toHaveCSS("outline-style", "none");
  });

  test("not even CodeMirror's own outline shows, so an application needs no override", async ({ page }) => {
    await bare(page).click();
    const view = section(page).locator(".cm-editor.cm-focused");
    await expect(view).toHaveCount(1);
    await expect(view).toHaveCSS("outline-style", "none");
    // The same for the field: its ring is on the host, not on the CodeMirror element.
    await field(page).click();
    await expect(section(page).locator(".cm-editor.cm-focused")).toHaveCSS("outline-style", "none");
  });

  test("fills the height of its parent, and scrolls itself", async ({ page }) => {
    const pane = await section(page).getByRole("group", { name: "Pane" }).boundingBox();
    const view = await section(page).getByRole("group", { name: "Pane" }).locator(".cm-editor").boundingBox();
    expect(Math.round(view!.height)).toBe(Math.round(pane!.height));
    await bare(page).click();
    await page.keyboard.type("\n".repeat(40));
    const scroller = section(page).getByRole("group", { name: "Pane" }).locator(".cm-scroller");
    expect(await scroller.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    const after = await section(page).getByRole("group", { name: "Pane" }).boundingBox();
    expect(Math.round(after!.height)).toBe(Math.round(pane!.height));
  });

  test("shows focus in the active line number, and only while it is in use", async ({ page }) => {
    const gutter = section(page).getByRole("group", { name: "Pane" }).locator(".cm-lineNumbers .cm-activeLineGutter");
    await expect(gutter).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await bare(page).click();
    await expect(gutter).toHaveCSS("background-color", await token(page, "--tln-tint"));
    await section(page).getByRole("heading").click();
    await expect(gutter).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  });

  test("the pane can see that focus is inside it", async ({ page }) => {
    await expect(section(page).getByText("pane focus-within: no")).toBeVisible();
    await bare(page).click();
    await expect(section(page).getByText("pane focus-within: yes")).toBeVisible();
  });
});

test.describe("what both do the same", () => {
  test("typing reports a change, and Mod-s asks to save", async ({ page }) => {
    await bare(page).click();
    await page.keyboard.press("Control+End");
    await page.keyboard.type("x");
    await expect(count(page, "pane changes")).toHaveText("1");
    await page.keyboard.press("Control+s");
    await expect(count(page, "pane saves")).toHaveText("1");
    await field(page).click();
    await page.keyboard.press("Control+End");
    await page.keyboard.type("y");
    await expect(count(page, "field changes")).toHaveText("1");
    await expect(count(page, "pane changes")).toHaveText("1");
  });

  test("a selection on a line stays visible: nothing is painted over it", async ({ page }) => {
    await bare(page).getByText("Field versus pane").dblclick();
    const selection = section(page).getByRole("group", { name: "Pane" }).locator(".cm-selectionBackground");
    await expect(selection).toHaveCount(1);
    await expect(selection).toHaveCSS("background-color", await token(page, "--tln-accent-soft"));
    await expect(section(page).locator(".cm-activeLine")).toHaveCount(0);
  });

  test("an unfocused selection is a tint, not the accent", async ({ page }) => {
    await bare(page).getByText("Field versus pane").dblclick();
    await field(page).click();
    const selection = section(page).getByRole("group", { name: "Pane" }).locator(".cm-selectionBackground");
    await expect(selection).toHaveCSS("background-color", await token(page, "--tln-tint"));
  });
});

test.describe("the sourceEditingExtensions preset", () => {
  test("closes brackets, and Backspace between a pair removes both", async ({ page }) => {
    await bare(page).click();
    await page.keyboard.press("Control+End");
    await page.keyboard.type("[");
    await expect(bare(page)).toContainText("[]");
    await page.keyboard.press("Backspace");
    await expect(bare(page)).not.toContainText("[]");
    await expect(bare(page)).not.toContainText("[");
  });

  test("has a fold gutter, and folding a block hides its lines", async ({ page }) => {
    await expect(bareHost(page).locator(".cm-foldGutter")).toHaveCount(1);
    await bare(page).click();
    await page.keyboard.press("Control+Home");
    await page.keyboard.press("Control+Shift+BracketLeft");
    await expect(bareHost(page).locator(".cm-foldPlaceholder")).toHaveCount(1);
    await expect(bare(page)).not.toContainText("Field versus pane");
  });

  test("Mod-f opens the search panel", async ({ page }) => {
    await bare(page).click();
    await page.keyboard.press("Control+f");
    await expect(bareHost(page).locator(".cm-search")).toBeVisible();
  });
});

for (const scheme of ["light", "dark"] as const) {
  test.describe(`popups, in the ${scheme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
    });

    test("the completion list is a float on tokens, and its selected item is marked as a selection", async ({ page }) => {
      await bare(page).click();
      await page.keyboard.press("Control+End");
      await page.keyboard.type("ti");
      const tooltip = section(page).locator(".cm-tooltip-autocomplete");
      await expect(tooltip).toBeVisible();
      expect(await tooltip.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(await token(page, "--tln-content"));
      expect(await tooltip.evaluate((el) => getComputedStyle(el).color)).toBe(await token(page, "--tln-fg"));
      const selected = tooltip.locator("li[aria-selected]");
      expect(await selected.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(await token(page, "--tln-accent-soft"));
    });

    test("the fold gutter and the matches of the selection use tokens", async ({ page }) => {
      await bare(page).getByText("A line of text to select.").first().dblclick();
      const match = section(page).locator(".cm-selectionMatch").first();
      await expect(match).toBeVisible();
      expect(await match.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(await token(page, "--tln-tint"));
      const gutters = bareHost(page).locator(".cm-gutters");
      expect(await gutters.evaluate((el) => getComputedStyle(el).color)).toBe(await token(page, "--tln-fg-muted"));
    });
  });
}
