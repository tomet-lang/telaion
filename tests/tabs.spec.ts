import { expect, test, type Page } from "@playwright/test";

// The document tabs of the ControlsDemo. The basics (select, arrows, Delete) are in components.spec.ts;
// here are the parts that a document tab strip adds: icon, tooltip, dirty dot, close button, middle click.

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

const strip = (page: Page) => page.getByRole("tablist", { name: "Open documents", exact: true });
const tab = (page: Page, name: string) => strip(page).getByRole("tab", { name });
const status = (page: Page, label: string) => page.getByText(new RegExp(`${label} = `)).filter({ hasText: "picked" });

test.describe("Tabs, as a document strip", () => {
  test("a tab shows its full path as the tooltip", async ({ page }) => {
    await expect(tab(page, "alpha.tmt")).toHaveAttribute("title", "notes/projects/alpha.tmt");
  });

  test("onselect is called for a person's choice, with the id", async ({ page }) => {
    await tab(page, "beta.tmt").click();
    await expect(status(page, "picked")).toContainText("picked = beta");
    await page.keyboard.press("ArrowRight");
    await expect(status(page, "picked")).toContainText("picked = gamma");
  });

  test("the dirty dot is replaced by the close button under the pointer", async ({ page }) => {
    const dirtyTab = tab(page, "alpha.tmt");
    const dot = dirtyTab.getByRole("img", { name: "unsaved changes" });
    const close = strip(page).getByRole("button", { name: "Close alpha.tmt" });
    await expect(dot).toHaveCSS("opacity", "1");
    await expect(close).toHaveCSS("opacity", "0");
    await dirtyTab.hover();
    await expect(dot).toHaveCSS("opacity", "0");
    await expect(close).toHaveCSS("opacity", "1");
  });

  test("hovering does not change the size of a tab", async ({ page }) => {
    const dirtyTab = tab(page, "alpha.tmt");
    const before = await dirtyTab.boundingBox();
    await dirtyTab.hover();
    expect(await dirtyTab.boundingBox()).toEqual(before);
  });

  test("the close button of the selected tab is reached with Tab, and shows itself", async ({ page }) => {
    await tab(page, "alpha.tmt").focus();
    await page.keyboard.press("Tab");
    const close = strip(page).getByRole("button", { name: "Close alpha.tmt" });
    await expect(close).toBeFocused();
    await expect(close).toHaveCSS("opacity", "1");
    // The close buttons of the other tabs are not in the Tab order: one stop per tab strip is enough.
    await expect(strip(page).getByRole("button", { name: "Close beta.tmt" })).toHaveAttribute("tabindex", "-1");
  });

  test("Enter on the focused close button closes the tab and the focus stays in the strip", async ({ page }) => {
    await tab(page, "alpha.tmt").focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(tab(page, "alpha.tmt")).toHaveCount(0);
    await expect(page.getByText("closed = alpha")).toBeVisible();
    const inStrip = await page.evaluate(
      () => document.activeElement?.closest('[role="tablist"]')?.getAttribute("aria-label") === "Open documents",
    );
    expect(inStrip).toBe(true);
  });

  test("Delete closes the focused tab, and the focus does not fall to the page", async ({ page }) => {
    await tab(page, "gamma.tmt").click();
    await tab(page, "gamma.tmt").focus();
    await page.keyboard.press("Delete");
    await expect(tab(page, "gamma.tmt")).toHaveCount(0);
    await expect(page.getByText("closed = gamma")).toBeVisible();
    await expect(strip(page).getByRole("tab", { selected: true })).toBeFocused();
  });

  test("a middle click closes a closable tab and leaves a plain one", async ({ page }) => {
    await tab(page, "beta.tmt").click({ button: "middle" });
    await expect(tab(page, "beta.tmt")).toHaveCount(0);
    await expect(page.getByText("closed = beta")).toBeVisible();

    await tab(page, "pinned.tmt").click({ button: "middle" });
    await expect(tab(page, "pinned.tmt")).toBeVisible();
  });

  test("a middle click does not select", async ({ page }) => {
    await tab(page, "pinned.tmt").click({ button: "middle" });
    await expect(tab(page, "alpha.tmt")).toHaveAttribute("aria-selected", "true");
  });

  test("the compact size is smaller", async ({ page }) => {
    const compact = page.getByRole("tablist", { name: "Open documents, compact", exact: true });
    const [normal, small] = await Promise.all([
      tab(page, "alpha.tmt").boundingBox(),
      compact.getByRole("tab", { name: "alpha.tmt" }).boundingBox(),
    ]);
    expect(small!.height).toBeLessThan(normal!.height);
  });
});
