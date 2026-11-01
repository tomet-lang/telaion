import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(200);
});

test.describe("Views - Kanban", () => {
  test("renders columns and cards with badges", async ({ page }) => {
    const section = page.getByTestId("kanban-section");
    await section.scrollIntoViewIfNeeded();

    // Verify columns exist
    const todoCol = section.getByRole("region", { name: "To Do" });
    const inProgressCol = section.getByRole("region", { name: "In Progress" });
    const doneCol = section.getByRole("region", { name: "Done" });

    await expect(todoCol).toBeVisible();
    await expect(inProgressCol).toBeVisible();
    await expect(doneCol).toBeVisible();

    // Cards in To Do
    await expect(todoCol.getByText("Refactor packages")).toBeVisible();
    await expect(todoCol.getByText("Add Playwright tests")).toBeVisible();

    // Card in In Progress
    await expect(inProgressCol.getByText("Implement Kanban")).toBeVisible();
  });

  test("clicking add card button adds a new card", async ({ page }) => {
    const section = page.getByTestId("kanban-section");
    await section.scrollIntoViewIfNeeded();

    const todoCol = section.getByRole("region", { name: "To Do" });
    const addBtn = todoCol.getByRole("button", { name: "Add card to To Do" });

    await addBtn.click();
    await expect(todoCol.getByText("New task")).toBeVisible();
  });

  test("keyboard navigation moves cards between columns", async ({ page }) => {
    const section = page.getByTestId("kanban-section");
    await section.scrollIntoViewIfNeeded();

    const card = page.locator("#kanban-card-task-1");
    await card.focus();
    await expect(card).toBeFocused();

    // Press ArrowRight to move card to next column (In Progress)
    await page.keyboard.press("ArrowRight");

    // Check that card was moved
    const inProgressCol = section.getByRole("region", { name: "In Progress" });
    await expect(inProgressCol.getByText("Refactor packages")).toBeVisible();
    await expect(page.getByTestId("kanban-last-moved")).toContainText("task-1 to in-progress");

    // Press ArrowLeft to move card back to previous column (To Do)
    await card.focus();
    await page.keyboard.press("ArrowLeft");

    const todoCol = section.getByRole("region", { name: "To Do" });
    await expect(todoCol.getByText("Refactor packages")).toBeVisible();
    await expect(page.getByTestId("kanban-last-moved")).toContainText("task-1 to todo");
  });
});

test.describe("Views - TreeExplorer", () => {
  test("renders tree items with expanded and collapsed states", async ({ page }) => {
    const section = page.getByTestId("tree-explorer-section");
    await section.scrollIntoViewIfNeeded();

    const srcFolder = section.getByRole("treeitem", { name: "src" });
    const docsFolder = section.getByRole("treeitem", { name: "docs" });

    await expect(srcFolder).toHaveAttribute("aria-expanded", "true");
    await expect(docsFolder).toHaveAttribute("aria-expanded", "false");

    // Children of src should be visible
    await expect(section.getByRole("treeitem", { name: "components" })).toBeVisible();
    await expect(section.getByRole("treeitem", { name: "index.ts" })).toBeVisible();

    // Children of docs should not be rendered/visible yet
    await expect(section.getByRole("treeitem", { name: "readme.tmt" })).toHaveCount(0);
  });

  test("clicking a folder expands and collapses it", async ({ page }) => {
    const section = page.getByTestId("tree-explorer-section");
    await section.scrollIntoViewIfNeeded();

    const docsFolder = section.getByRole("treeitem", { name: "docs" });

    // Expand docs
    await docsFolder.click();
    await expect(docsFolder).toHaveAttribute("aria-expanded", "true");
    await expect(section.getByRole("treeitem", { name: "readme.tmt" })).toBeVisible();

    // Collapse docs
    await docsFolder.click();
    await expect(docsFolder).toHaveAttribute("aria-expanded", "false");
    await expect(section.getByRole("treeitem", { name: "readme.tmt" })).toHaveCount(0);
  });

  test("clicking a file selects it", async ({ page }) => {
    const section = page.getByTestId("tree-explorer-section");
    await section.scrollIntoViewIfNeeded();

    const indexFile = section.getByRole("treeitem", { name: "index.ts" });
    await indexFile.click();

    await expect(indexFile).toHaveAttribute("aria-selected", "true");
    await expect(page.getByTestId("tree-selected-id")).toHaveText("index-ts");
  });

  test("keyboard navigation expands and collapses folders", async ({ page }) => {
    const section = page.getByTestId("tree-explorer-section");
    await section.scrollIntoViewIfNeeded();

    const docsFolder = section.getByRole("treeitem", { name: "docs" });
    await docsFolder.focus();

    // ArrowRight expands
    await page.keyboard.press("ArrowRight");
    await expect(docsFolder).toHaveAttribute("aria-expanded", "true");
    await expect(section.getByRole("treeitem", { name: "readme.tmt" })).toBeVisible();

    // ArrowLeft collapses
    await page.keyboard.press("ArrowLeft");
    await expect(docsFolder).toHaveAttribute("aria-expanded", "false");
    await expect(section.getByRole("treeitem", { name: "readme.tmt" })).toHaveCount(0);
  });
});
