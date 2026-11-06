import { expect, test, type Locator, type Page } from "@playwright/test";

// The playground's first tree (TreeDemo.svelte) is a small application around TreeExplorer: it
// validates names (no slash), refuses duplicates among siblings, and does the moves. Its log lists
// what the tree asked of it.

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("tree-demo").scrollIntoViewIfNeeded();
});

const tree = (page: Page) => page.getByRole("tree", { name: "Project" });
const row = (page: Page, name: string) => tree(page).getByRole("treeitem", { name, exact: true });
const log = (page: Page) => page.getByTestId("tree-log");
const field = (page: Page) => tree(page).getByRole("textbox");

/** Moves a drag over a row. A browser starts a drag with a first move and reports it over a target with the next ones. */
async function dragOver(page: Page, target: Locator) {
  await target.hover();
  const box = (await target.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2 + 3, box.y + box.height / 2);
  await page.mouse.move(box.x + box.width / 2 + 6, box.y + box.height / 2);
}

async function startDrag(page: Page, source: Locator, target: Locator) {
  await source.hover();
  await page.mouse.down();
  await dragOver(page, target);
}
const selection = (input: Locator) => input.evaluate((el: HTMLInputElement) => [el.selectionStart, el.selectionEnd]);

test.describe("Views - TreeExplorer", () => {
  test("renders tree items with expanded and collapsed states", async ({ page }) => {
    const section = page.getByTestId("tree-explorer-section");
    await section.scrollIntoViewIfNeeded();

    await expect(row(page, "src")).toHaveAttribute("aria-expanded", "true");
    await expect(row(page, "docs")).toHaveAttribute("aria-expanded", "false");

    // Children of src are shown, children of docs are not rendered yet
    await expect(row(page, "components")).toBeVisible();
    await expect(row(page, "index.ts")).toBeVisible();
    await expect(row(page, "readme.tmt")).toHaveCount(0);
  });

  test("clicking a folder expands and collapses it", async ({ page }) => {
    const docs = row(page, "docs");
    await docs.click();
    await expect(docs).toHaveAttribute("aria-expanded", "true");
    await expect(row(page, "readme.tmt")).toBeVisible();

    await docs.click();
    await expect(docs).toHaveAttribute("aria-expanded", "false");
    await expect(row(page, "readme.tmt")).toHaveCount(0);
  });

  test("clicking the chevron opens a folder without selecting it", async ({ page }) => {
    await row(page, "docs").locator("[data-chevron]").click();
    await expect(row(page, "docs")).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByTestId("tree-selected-id")).toHaveText("button-svelte");
  });

  test("clicking a file selects it", async ({ page }) => {
    await row(page, "index.ts").click();
    await expect(row(page, "index.ts")).toHaveAttribute("aria-selected", "true");
    await expect(page.getByTestId("tree-selected-id")).toHaveText("index-ts");
  });

  test("rows say their depth and place to assistive technology", async ({ page }) => {
    await expect(row(page, "src")).toHaveAttribute("aria-level", "1");
    await expect(row(page, "components")).toHaveAttribute("aria-level", "2");
    await expect(row(page, "Button.svelte")).toHaveAttribute("aria-level", "3");
    await expect(row(page, "Button.svelte")).toHaveAttribute("aria-posinset", "1");
    await expect(row(page, "Button.svelte")).toHaveAttribute("aria-setsize", "2");
    await expect(row(page, "tokens.css")).toHaveAttribute("aria-posinset", "3");
  });

  test.describe("keyboard", () => {
    test("only one row is in the tab order, and it follows the focus", async ({ page }) => {
      const tabbable = tree(page).locator('[role="treeitem"][tabindex="0"]');
      await expect(tabbable).toHaveCount(1);
      await expect(tabbable).toHaveAccessibleName("Button.svelte");
      await row(page, "tokens.css").focus();
      await expect(tabbable).toHaveAccessibleName("tokens.css");
    });

    test("arrows, Home and End move the focus and do not wrap", async ({ page }) => {
      await row(page, "src").focus();
      await page.keyboard.press("ArrowUp");
      await expect(row(page, "src")).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(row(page, "components")).toBeFocused();
      await page.keyboard.press("End");
      await expect(row(page, "package.json")).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(row(page, "package.json")).toBeFocused();
      await page.keyboard.press("Home");
      await expect(row(page, "src")).toBeFocused();
    });

    test("ArrowRight opens a folder, then steps into it; ArrowLeft closes it, then steps out", async ({ page }) => {
      await row(page, "docs").focus();
      await page.keyboard.press("ArrowRight");
      await expect(row(page, "docs")).toHaveAttribute("aria-expanded", "true");
      await expect(row(page, "docs")).toBeFocused();
      await page.keyboard.press("ArrowRight");
      await expect(row(page, "readme.tmt")).toBeFocused();
      await page.keyboard.press("ArrowLeft");
      await expect(row(page, "docs")).toBeFocused();
      await page.keyboard.press("ArrowLeft");
      await expect(row(page, "docs")).toHaveAttribute("aria-expanded", "false");
      await expect(row(page, "readme.tmt")).toHaveCount(0);
    });

    test("Enter and Space select a file and toggle a folder", async ({ page }) => {
      await row(page, "docs").focus();
      await page.keyboard.press("Enter");
      await expect(row(page, "docs")).toHaveAttribute("aria-expanded", "true");
      await page.keyboard.press("Space");
      await expect(row(page, "docs")).toHaveAttribute("aria-expanded", "false");
      await row(page, "index.ts").focus();
      await page.keyboard.press("Space");
      await expect(page.getByTestId("tree-selected-id")).toHaveText("index-ts");
    });
  });

  test.describe("renaming", () => {
    test("F2 turns the row into a field named after it, with only the stem selected", async ({ page }) => {
      await row(page, "index.ts").focus();
      await page.keyboard.press("F2");
      const input = field(page);
      await expect(input).toBeFocused();
      await expect(input).toHaveAccessibleName("Rename index.ts");
      await expect(input).toHaveValue("index.ts");
      expect(await selection(input)).toEqual([0, 5]);
    });

    test("Enter commits, and the focus goes back to the row", async ({ page }) => {
      await row(page, "index.ts").focus();
      await page.keyboard.press("F2");
      await page.keyboard.type("main");
      await page.keyboard.press("Enter");
      await expect(field(page)).toHaveCount(0);
      await expect(row(page, "main.ts")).toBeFocused();
      await expect(log(page)).toContainText("renamed index-ts to main.ts");
    });

    test("Escape cancels, changes nothing, and the focus goes back to the row", async ({ page }) => {
      await row(page, "index.ts").focus();
      await page.keyboard.press("F2");
      await page.keyboard.type("main");
      await page.keyboard.press("Escape");
      await expect(field(page)).toHaveCount(0);
      await expect(row(page, "index.ts")).toBeFocused();
      await expect(log(page)).not.toContainText("renamed");
    });

    test("Escape in the field does not reach what is around the tree", async ({ page }) => {
      await row(page, "index.ts").focus();
      await page.keyboard.press("F2");
      await page.evaluate(() => {
        (window as unknown as { escaped: boolean }).escaped = false;
        window.addEventListener("keydown", (e) => {
          if (e.key === "Escape") (window as unknown as { escaped: boolean }).escaped = true;
        });
      });
      await page.keyboard.press("Escape");
      await expect(field(page)).toHaveCount(0);
      expect(await page.evaluate(() => (window as unknown as { escaped: boolean }).escaped)).toBe(false);
    });

    test("a name the application refuses while typing is shown, and Enter does not commit it", async ({ page }) => {
      await row(page, "index.ts").focus();
      await page.keyboard.press("F2");
      await page.keyboard.type("a/b");
      const input = field(page);
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await expect(tree(page).getByRole("alert")).toHaveText("A name cannot contain a slash.");
      await expect(input).toHaveAccessibleDescription("A name cannot contain a slash.");
      await page.keyboard.press("Enter");
      await expect(input).toBeFocused();
      await expect(log(page)).not.toContainText("renamed");

      // Fixing it clears the message, and then Enter goes through.
      await input.fill("ab.ts");
      await expect(tree(page).getByRole("alert")).toHaveCount(0);
      await page.keyboard.press("Enter");
      await expect(row(page, "ab.ts")).toBeVisible();
    });

    test("a name refused on commit keeps the field open with the message, and the focus in it", async ({ page }) => {
      await row(page, "index.ts").focus();
      await page.keyboard.press("F2");
      await field(page).fill("tokens.css");
      await page.keyboard.press("Enter");
      await expect(tree(page).getByRole("alert")).toHaveText('"tokens.css" already exists here.');
      await expect(field(page)).toBeFocused();
      await expect(field(page)).toHaveAttribute("aria-invalid", "true");
    });

    test("typing the old name back is a cancel, not a commit", async ({ page }) => {
      await row(page, "index.ts").focus();
      await page.keyboard.press("F2");
      await page.keyboard.type("x");
      await field(page).fill("index.ts");
      await page.keyboard.press("Enter");
      await expect(field(page)).toHaveCount(0);
      await expect(log(page)).not.toContainText("renamed");
    });

    test("leaving the field commits a changed name, and cancels an unchanged one", async ({ page }) => {
      await row(page, "index.ts").focus();
      await page.keyboard.press("F2");
      await field(page).fill("moved.ts");
      await page.getByTestId("tree-selected-id").click();
      await expect(row(page, "moved.ts")).toBeVisible();
      await expect(log(page)).toContainText("renamed index-ts to moved.ts");

      await row(page, "tokens.css").focus();
      await page.keyboard.press("F2");
      await page.getByTestId("tree-selected-id").click();
      await expect(field(page)).toHaveCount(0);
      await expect(row(page, "tokens.css")).toBeVisible();
    });

    test("leaving the field with a refused name is a cancel", async ({ page }) => {
      await row(page, "index.ts").focus();
      await page.keyboard.press("F2");
      await field(page).fill("a/b");
      await page.getByTestId("tree-selected-id").click();
      await expect(field(page)).toHaveCount(0);
      await expect(row(page, "index.ts")).toBeVisible();
    });

    test("an Enter that ends an IME composition is not a commit", async ({ page }) => {
      await row(page, "index.ts").focus();
      await page.keyboard.press("F2");
      await field(page).fill("にほん.ts");
      await field(page).dispatchEvent("keydown", { key: "Enter", isComposing: true });
      await expect(field(page)).toBeVisible();
      await expect(log(page)).not.toContainText("renamed");
      await page.keyboard.press("Enter");
      await expect(row(page, "にほん.ts")).toBeVisible();
    });

    test("the field is as tall as the row it replaces, so nothing below it moves", async ({ page }) => {
      const below = row(page, "tokens.css");
      const before = (await below.boundingBox())!.y;
      await row(page, "index.ts").focus();
      await page.keyboard.press("F2");
      await expect(field(page)).toBeFocused();
      expect((await below.boundingBox())!.y).toBeCloseTo(before, 0);
    });
  });

  test.describe("creating", () => {
    test("the button creates next to the selected file, at the top of its folder", async ({ page }) => {
      await page.getByRole("button", { name: "New document" }).click();
      const input = field(page);
      await expect(input).toBeFocused();
      await expect(input).toHaveAccessibleName("New document name");
      await expect(input).toHaveAttribute("placeholder", "name.tmt");
      // Button.svelte is selected, so the row stands where its siblings are, before them.
      const rows = tree(page).locator("[role='treeitem'], input");
      const names = await rows.evaluateAll((els) => els.map((el) => el.getAttribute("aria-label")));
      expect(names.slice(0, 4)).toEqual(["src", "components", "New document name", "Button.svelte"]);

      await page.keyboard.type("Card.svelte");
      await page.keyboard.press("Enter");
      await expect(field(page)).toHaveCount(0);
      await expect(row(page, "Card.svelte")).toHaveAttribute("aria-selected", "true");
      await expect(log(page)).toContainText("created Card.svelte in components");
    });

    test("it creates at the root when the selected file is at the root", async ({ page }) => {
      await row(page, "package.json").click();
      await page.getByRole("button", { name: "New folder" }).click();
      await page.keyboard.type("assets");
      await page.keyboard.press("Enter");
      await expect(row(page, "assets")).toHaveAttribute("aria-level", "1");
      await expect(row(page, "assets")).toHaveAttribute("aria-expanded", "false");
      await expect(log(page)).toContainText("created assets in the root");
    });

    test("a closed folder opens to show the new row", async ({ page }) => {
      await row(page, "docs").click(); // open, selected
      await row(page, "docs").click(); // closed, still selected
      await expect(row(page, "docs")).toHaveAttribute("aria-expanded", "false");
      await page.getByRole("button", { name: "New folder" }).click();
      await expect(row(page, "docs")).toHaveAttribute("aria-expanded", "true");
      await expect(field(page)).toBeFocused();
      await expect(field(page)).toHaveAccessibleName("New folder name");
    });

    test("Escape cancels, and the focus goes back to the folder", async ({ page }) => {
      await page.getByRole("button", { name: "New document" }).click();
      await page.keyboard.type("draft.tmt");
      await page.keyboard.press("Escape");
      await expect(field(page)).toHaveCount(0);
      await expect(row(page, "components")).toBeFocused();
      await expect(log(page)).not.toContainText("created");
    });

    test("an empty name is a cancel, and a taken name is refused", async ({ page }) => {
      await page.getByRole("button", { name: "New document" }).click();
      await page.keyboard.press("Enter");
      await expect(field(page)).toHaveCount(0);

      await page.getByRole("button", { name: "New document" }).click();
      await page.keyboard.type("modal.svelte");
      await page.keyboard.press("Enter");
      await expect(tree(page).getByRole("alert")).toContainText("already exists");
      await expect(field(page)).toBeFocused();
    });
  });

  test.describe("dragging", () => {
    test("a node dropped on a folder moves into it", async ({ page }) => {
      await row(page, "docs").click(); // open it, so the result can be seen
      await row(page, "index.ts").dragTo(row(page, "docs"));
      await expect(log(page)).toContainText("moved index.ts into docs");
      await expect(row(page, "index.ts")).toHaveAttribute("aria-level", "2");
    });

    test("the folder a drop would land in is marked while the pointer is over it", async ({ page }) => {
      const target = row(page, "docs");
      await startDrag(page, row(page, "index.ts"), target);
      await expect(target).toHaveClass(/drop-target/);
      // Over the folder it already is in, a drop would do nothing, so nothing is marked.
      await dragOver(page, row(page, "src"));
      await expect(target).not.toHaveClass(/drop-target/);
      await expect(row(page, "src")).not.toHaveClass(/drop-target/);
      await page.mouse.up();
      await expect(log(page)).not.toContainText("moved");
    });

    test("a node dropped on the empty area under the rows moves to the root", async ({ page }) => {
      const scroll = page.locator(".tree-scroll").first();
      await row(page, "tokens.css").dragTo(scroll, { targetPosition: { x: 100, y: 340 } });
      await expect(log(page)).toContainText("moved tokens.css into the root");
      await expect(row(page, "tokens.css")).toHaveAttribute("aria-level", "1");
    });

    test("a node dropped on a file lands in the folder of that file", async ({ page }) => {
      await row(page, "package.json").dragTo(row(page, "Modal.svelte"));
      await expect(log(page)).toContainText("moved package.json into components");
      await expect(row(page, "package.json")).toHaveAttribute("aria-level", "3");
    });

    test("a node cannot be dropped into itself, into what it holds, or where it already is", async ({ page }) => {
      await row(page, "src").dragTo(row(page, "components"));
      await row(page, "src").dragTo(row(page, "Button.svelte"));
      await row(page, "Button.svelte").dragTo(row(page, "Modal.svelte"));
      await row(page, "components").dragTo(row(page, "src"));
      await expect(log(page)).not.toContainText("moved");
      await expect(row(page, "src")).toHaveAttribute("aria-level", "1");
    });

    test("a closed folder opens when a drag rests on it", async ({ page }) => {
      const docs = row(page, "docs");
      await startDrag(page, row(page, "index.ts"), docs);
      await expect(docs).toHaveAttribute("aria-expanded", "true");
      await page.mouse.up();
    });

    test("a tree with no move handler has nothing to drag", async ({ page }) => {
      const states = page.getByRole("tree", { name: "States" });
      await expect(states.getByRole("treeitem", { name: "A document.tmt" })).toHaveAttribute("draggable", "false");
      await expect(row(page, "index.ts")).toHaveAttribute("draggable", "true");
    });
  });

  test.describe("context menu", () => {
    test("a right click asks for a menu for the row under the pointer, and marks it", async ({ page }) => {
      await row(page, "index.ts").click({ button: "right" });
      await expect(page.getByTestId("tree-menu")).toHaveText("index-ts pointer");
      await expect(log(page)).toContainText("menu for index.ts at");
      await expect(row(page, "index.ts")).toBeFocused();
      // Asking for a menu does not select: that would open the document.
      await expect(page.getByTestId("tree-selected-id")).toHaveText("button-svelte");
      await expect(row(page, "index.ts")).toHaveClass(/context/);
    });

    test("a right click on the empty area asks for a menu for the root", async ({ page }) => {
      await page.locator(".tree-scroll").first().click({ button: "right", position: { x: 100, y: 340 } });
      await expect(page.getByTestId("tree-menu")).toHaveText("none pointer");
    });

    test("the menu key and Shift+F10 ask from the keyboard, below the focused row", async ({ page }) => {
      await row(page, "tokens.css").focus();
      await page.keyboard.press("ContextMenu");
      await expect(page.getByTestId("tree-menu")).toHaveText("tokens-css keyboard");
      const box = (await row(page, "tokens.css").boundingBox())!;
      await expect(log(page)).toContainText(`at ${Math.round(box.x)},${Math.round(box.y + box.height)} by keyboard`);

      await page.getByRole("button", { name: "clear" }).click();
      await row(page, "index.ts").focus();
      await page.keyboard.press("Shift+F10");
      await expect(page.getByTestId("tree-menu")).toHaveText("index-ts keyboard");
    });

    test("a field inside the tree keeps the browser's own menu", async ({ page }) => {
      await row(page, "index.ts").focus();
      await page.keyboard.press("F2");
      const prevented = await field(page).evaluate((el) => {
        const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
        el.dispatchEvent(event);
        return event.defaultPrevented;
      });
      expect(prevented).toBe(false);
    });
  });

  test.describe("rows that only read", () => {
    test("a loading folder says so, and a branch without children shows no empty note", async ({ page }) => {
      const states = page.getByRole("tree", { name: "States" });
      const loading = states.getByRole("treeitem", { name: "Loading its children" });
      await expect(loading).toHaveAttribute("aria-busy", "true");
      await expect(loading.getByRole("status")).toBeVisible();
      await states.getByRole("treeitem", { name: "Children not loaded yet" }).click();
      await expect(states.getByText("Nothing in here")).toHaveCount(1); // only the empty folder's own
    });

    test("an empty open folder says so, through the application's snippet", async ({ page }) => {
      await expect(page.getByRole("tree", { name: "States" }).getByText("Nothing in here")).toBeVisible();
    });

    test("a long label is cut, and the mark after it keeps its place", async ({ page }) => {
      const long = page.getByRole("tree", { name: "States" }).getByRole("treeitem", { name: /A name so long/ });
      const mark = long.getByText("M", { exact: true });
      const row = (await long.boundingBox())!;
      const box = (await mark.boundingBox())!;
      expect(box.x + box.width).toBeLessThanOrEqual(row.x + row.width);
      expect(await long.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    });
  });
});
