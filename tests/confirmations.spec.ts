import { expect, test, type Page } from "@playwright/test";

// The confirmations of ordiola, rebuilt on Telaion. These tests state what they must keep doing.

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

const outcome = (page: Page) => page.getByLabel("outcome");

test.describe("delete confirmation", () => {
  test("names the file and puts the focus on the safe answer", async ({ page }) => {
    await page.getByRole("button", { name: "Delete a file" }).click();
    const dialog = page.getByRole("dialog", { name: "ファイルの削除" });
    await expect(dialog).toContainText("「idea.tmt」を削除してもよろしいですか？");
    await expect(dialog.getByRole("button", { name: "キャンセル" })).toBeFocused();
    await expect(dialog.getByText("フォルダ内のすべてのファイル")).toHaveCount(0);
  });

  test("a folder shows the warning and its own title", async ({ page }) => {
    await page.getByRole("button", { name: "Delete a folder" }).click();
    const dialog = page.getByRole("dialog", { name: "フォルダの削除" });
    await expect(dialog.getByRole("alert")).toContainText("完全に削除されます");
  });

  test("削除 confirms, once", async ({ page }) => {
    await page.getByRole("button", { name: "Delete a file" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "削除" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(outcome(page)).toHaveText("deleted idea.tmt");
  });

  test("Cancel, Escape and the backdrop all cancel", async ({ page }) => {
    for (const dismiss of [
      () => page.getByRole("dialog").getByRole("button", { name: "キャンセル" }).click(),
      () => page.keyboard.press("Escape"),
      () => page.mouse.click(4, 4),
    ]) {
      await page.getByRole("button", { name: "Delete a file" }).click();
      await dismiss();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(outcome(page)).toHaveText("delete cancelled");
      await page.reload();
    }
  });

  test("a delete cannot happen by pressing Enter on a fresh dialog", async ({ page }) => {
    await page.getByRole("button", { name: "Delete a file" }).click();
    await page.keyboard.press("Enter");
    await expect(outcome(page)).toHaveText("delete cancelled");
  });
});

test.describe("unsaved changes", () => {
  const open = (page: Page) => page.getByRole("button", { name: "Close an unsaved tab" }).click();
  const dialog = (page: Page) => page.getByRole("dialog", { name: "変更が保存されていません" });

  test("names the tab and focuses 保存する", async ({ page }) => {
    await open(page);
    await expect(dialog(page)).toContainText("「readme.tmt」への変更を保存しますか？");
    await expect(dialog(page).getByRole("button", { name: "保存する" })).toBeFocused();
  });

  test("each of the three answers does its own thing", async ({ page }) => {
    const answers: [string, string][] = [
      ["保存する", "saved and closed readme.tmt"],
      ["保存しない", "discarded readme.tmt"],
      ["キャンセル", "close cancelled"],
    ];
    for (const [button, expected] of answers) {
      await open(page);
      await dialog(page).getByRole("button", { name: button }).click();
      await expect(dialog(page)).toHaveCount(0);
      await expect(outcome(page)).toHaveText(expected);
      await page.reload();
    }
  });

  test("Escape means cancel, not discard", async ({ page }) => {
    await open(page);
    await page.keyboard.press("Escape");
    await expect(outcome(page)).toHaveText("close cancelled");
  });
});
