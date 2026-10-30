import { expect, test, type Page } from "@playwright/test";

// The conflict resolver, fed by a test double of the Tomet engine.

const section = (page: Page) =>
  page.locator("section").filter({ has: page.getByRole("heading", { name: /Conflict resolver/ }) });
const text = (page: Page) => section(page).getByLabel("document text");
const accept = (page: Page, side: "A" | "B", conflict: number) =>
  section(page).getByRole("button", { name: `Accept version ${side} of conflict ${conflict}` });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(section(page).getByText("2 conflicts found.")).toBeVisible();
});

test("every conflict shows both versions side by side", async ({ page }) => {
  const cards = section(page).getByRole("listitem");
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toContainText("on Monday");
  await expect(cards.nth(0)).toContainText("on Friday");
  await expect(cards.nth(1)).toContainText("Keep it short.");
  await expect(cards.nth(1)).toContainText("Explain it at length, in two sentences.");
  await expect(cards.nth(0)).toContainText("Conflict 1 · inline");
  await expect(cards.nth(1)).toContainText("Conflict 2 · block");
});

test("each accept button says which version of which conflict it takes", async ({ page }) => {
  for (const conflict of [1, 2]) {
    await expect(accept(page, "A", conflict)).toBeVisible();
    await expect(accept(page, "B", conflict)).toBeVisible();
  }
});

test("accepting a version puts it in the text and removes the conflict", async ({ page }) => {
  await accept(page, "B", 1).click();
  await expect(section(page).getByText("1 conflict found.")).toBeVisible();
  await expect(text(page)).toContainText("The release is on Friday for sure.");
  await expect(text(page)).not.toContainText("on Monday");
  await expect(section(page).getByRole("listitem")).toHaveCount(1);
});

test("resolving the last conflict shows the empty state, which leads back to the editor", async ({ page }) => {
  await accept(page, "A", 1).click();
  await expect(section(page).getByText("1 conflict found.")).toBeVisible();
  await accept(page, "A", 1).click();
  await expect(section(page).getByText("All conflicts are resolved.")).toBeVisible();
  await expect(text(page)).toContainText("The release is on Monday for sure.");
  await expect(text(page)).toContainText("Keep it short.");
  await expect(text(page)).not.toContainText("@conflict");

  await section(page).getByRole("button", { name: "Back to the editor" }).click();
  await expect(section(page).getByLabel("back to editor")).toHaveText("1");
});

test("resetting the document brings the conflicts back", async ({ page }) => {
  await accept(page, "A", 1).click();
  await accept(page, "A", 1).click();
  await expect(section(page).getByText("All conflicts are resolved.")).toBeVisible();
  await section(page).getByRole("button", { name: "Reset the document" }).click();
  await expect(section(page).getByText("2 conflicts found.")).toBeVisible();
});

test("an engine that answers late: the buttons wait until the answer is in", async ({ page }) => {
  await section(page).getByLabel("Engine of the test double").selectOption({ label: "Answers after 500 ms" });
  await expect(section(page).getByRole("status", { name: "Reading the conflicts" })).toHaveCount(0);

  await accept(page, "A", 1).click();
  // While the engine works, nothing else can be pressed: no second answer for the same text.
  await expect(accept(page, "A", 1)).toBeDisabled();
  await expect(accept(page, "B", 2)).toBeDisabled();
  await expect(section(page).getByText("1 conflict found.")).toBeVisible();
  await expect(accept(page, "A", 1)).toBeEnabled();
});

test("an engine that cannot resolve: the error is shown and nothing changes", async ({ page }) => {
  await section(page).getByLabel("Engine of the test double").selectOption({ label: "Cannot resolve" });
  await accept(page, "A", 1).click();
  await expect(
    section(page).getByRole("alert").filter({ hasText: "Could not resolve the conflict: the engine is not available" }),
  ).toBeVisible();
  await expect(section(page).getByText("2 conflicts found.")).toBeVisible();
  await expect(text(page)).toContainText("@conflict");
  // The buttons work again afterwards.
  await expect(accept(page, "A", 1)).toBeEnabled();
});
