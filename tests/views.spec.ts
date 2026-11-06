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
