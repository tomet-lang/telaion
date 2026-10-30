import { expect, test, type Page } from "@playwright/test";

const editor = (page: Page) => page.getByRole("textbox", { name: "Highlighted source" });
const mark = (page: Page, tag: string) => page.locator(`.cm-content .tln-hl-${tag}`);
const pending = (page: Page) => page.getByLabel("pending answers");
const errors = (page: Page) => page.getByLabel("highlight errors");

async function chooseEngine(page: Page, label: string) {
  await page.getByLabel("Engine of the test double").selectOption({ label });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(mark(page, "heading")).toBeVisible();
});

test("the ranges the engine reports are painted", async ({ page }) => {
  await expect(mark(page, "heading")).toHaveText("=[ 見出し ]");
  await expect(mark(page, "lineComment")).toHaveText("// 注釈です");
  await expect(mark(page, "string")).toHaveText('"note"');
  await expect(mark(page, "tagName")).toHaveText("@callout");
});

test("an engine that counts bytes is painted in the right places once adapted", async ({ page }) => {
  await chooseEngine(page, "Answers in UTF-8 bytes");
  await expect(mark(page, "heading")).toHaveText("=[ 見出し ]");
  await expect(mark(page, "lineComment")).toHaveText("// 注釈です");
  await expect(mark(page, "tagName")).toHaveText("@callout");
});

for (const scheme of ["light", "dark"] as const) {
  test(`the colors are the tokens, in the ${scheme} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    const token = (name: string) =>
      page.evaluate((variable) => {
        const probe = document.createElement("i");
        probe.style.color = `var(${variable})`;
        document.body.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      }, name);
    const colorOf = (tag: string) =>
      mark(page, tag).first().evaluate((el) => getComputedStyle(el).color);

    expect(await colorOf("heading")).toBe(await token("--tln-accent"));
    expect(await colorOf("string")).toBe(await token("--tln-ok"));
    expect(await colorOf("lineComment")).toBe(await token("--tln-fg-muted"));
  });
}

test("typing is highlighted too", async ({ page }) => {
  await editor(page).click();
  await page.keyboard.press("Control+End");
  await page.keyboard.type("// 追記");
  await expect(mark(page, "lineComment").last()).toHaveText("// 追記");
});

test("until the engine answers, the ranges follow the text", async ({ page }) => {
  await chooseEngine(page, "Answers after 600 ms");
  await expect(mark(page, "heading")).toHaveText("=[ 見出し ]");

  await editor(page).click();
  await page.keyboard.press("Control+Home");
  await page.keyboard.type("ab");
  // The new answer is 600 ms away; the old range has moved with the text and is still there.
  await expect(mark(page, "heading")).toHaveText("=[ 見出し ]");
  // Then the answer comes: "ab=[ ..." is no heading, so the range goes.
  await expect(mark(page, "heading")).toHaveCount(0);
});

test("an answer for text that has since changed is dropped", async ({ page }) => {
  await chooseEngine(page, "Answers when told to");
  await pending(page).waitFor();
  await page.getByRole("button", { name: "Answer the newest" }).click();
  await expect(pending(page)).toHaveText("0");

  await editor(page).click();
  await page.keyboard.press("Control+a");
  await page.keyboard.type("// c");
  await expect(pending(page)).toHaveText("4");
  await expect(mark(page, "lineComment")).toHaveCount(0);

  // Three answers for texts that no longer exist: none of them may paint anything.
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Answer the oldest" }).click();
  await expect(pending(page)).toHaveText("1");
  await expect(mark(page, "lineComment")).toHaveCount(0);

  // The answer for the text that is on screen paints.
  await page.getByRole("button", { name: "Answer the newest" }).click();
  await expect(mark(page, "lineComment")).toHaveText("// c");
});

test("a failing engine is reported, the last good colors stay, and the editor keeps working", async ({ page }) => {
  await chooseEngine(page, "Fails");
  await expect(errors(page)).toHaveText("1");
  // Nothing new could be painted, so what was painted last is still there.
  await expect(mark(page, "heading")).toHaveText("=[ 見出し ]");

  await editor(page).click();
  await page.keyboard.press("Control+End");
  await page.keyboard.type("still typing");
  await expect(editor(page)).toContainText("still typing");
  // Every edit asks again, and every failure is reported.
  await expect(errors(page)).not.toHaveText("1");
  await expect(mark(page, "heading")).toHaveText("=[ 見出し ]");
});
