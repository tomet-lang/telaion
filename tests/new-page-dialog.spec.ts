import { expect, test } from "@playwright/test";

// The wiki's "Create New Page" dialog, rebuilt on Telaion. These tests state what it must keep doing.

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open the New Page dialog" }).click();
});

const dialog = (page: import("@playwright/test").Page) =>
  page.getByRole("dialog", { name: "Create New Page" });

test("opens with the focus in the path field", async ({ page }) => {
  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page).getByLabel(/Page Path/)).toBeFocused();
});

test("an empty path shows the error and keeps the dialog open", async ({ page }) => {
  await dialog(page).getByRole("button", { name: "Create & Edit" }).click();
  await expect(dialog(page).getByRole("alert")).toHaveText("Path cannot be empty");
  await expect(dialog(page).getByLabel(/Page Path/)).toHaveAttribute("aria-invalid", "true");
  await expect(dialog(page)).toBeVisible();
});

test("Enter in the field submits the form", async ({ page }) => {
  await dialog(page).getByLabel(/Page Path/).fill("notes/my-topic");
  await page.keyboard.press("Enter");
  await expect(dialog(page)).toBeHidden();
  await expect(page.getByLabel("created")).toContainText("notes/my-topic.tmt");
});

test("the path is cleaned: spaces and leading slashes go, .tmt is added once", async ({ page }) => {
  await dialog(page).getByLabel(/Page Path/).fill("  //guides/getting-started.tmt ");
  await dialog(page).getByRole("button", { name: "Create & Edit" }).click();
  await expect(page.getByLabel("created")).toHaveText(/^guides\/getting-started\.tmt\n/);
});

test("the standard template has a title and a paragraph", async ({ page }) => {
  await dialog(page).getByLabel(/Page Path/).fill("concepts/my-first_note");
  await dialog(page).getByRole("button", { name: "Create & Edit" }).click();
  await expect(page.getByLabel("created")).toHaveText(
    "concepts/my-first_note.tmt\n---\n=[ My First Note ]\n\nWrite your notes here...\n",
  );
});

test("the blank template has only the title", async ({ page }) => {
  await dialog(page).getByLabel(/Page Path/).fill("blank-page");
  await dialog(page).getByLabel("Initial Template").selectOption("blank");
  await dialog(page).getByRole("button", { name: "Create & Edit" }).click();
  await expect(page.getByLabel("created")).toHaveText("blank-page.tmt\n---\n=[ Blank Page ]\n\n");
});

test("Cancel, Escape, the close button and the backdrop each cancel once", async ({ page }) => {
  const opener = page.getByRole("button", { name: "Open the New Page dialog" });
  const cancelledTimes = (n: number) => expect(page.getByText(`cancelled ${n} times`)).toBeVisible();

  await dialog(page).getByRole("button", { name: "Cancel" }).click();
  await expect(dialog(page)).toBeHidden();
  await cancelledTimes(1);

  await opener.click();
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
  await cancelledTimes(2);

  await opener.click();
  await dialog(page).getByRole("button", { name: "Close" }).click();
  await expect(dialog(page)).toBeHidden();
  await cancelledTimes(3);

  await opener.click();
  await page.mouse.click(4, 4);
  await expect(dialog(page)).toBeHidden();
  await cancelledTimes(4);
});

test("the code hint under the path field is read as part of the field", async ({ page }) => {
  const field = dialog(page).getByLabel(/Page Path/);
  const describedby = await field.getAttribute("aria-describedby");
  expect(describedby).toBeTruthy();
  await expect(page.locator(`[id="${describedby}"]`)).toContainText("guides/getting-started.tmt");
});
