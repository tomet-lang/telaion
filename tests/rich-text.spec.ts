import { expect, test, type Locator, type Page } from "@playwright/test";

const section = (page: Page) =>
  page.locator("section").filter({ has: page.getByRole("heading", { name: "RichText: field and pane (Tiptap)" }) });
const text = (page: Page, name: string) => section(page).getByRole("textbox", { name });
const field = (page: Page) => text(page, "Field rich text");
const bare = (page: Page) => text(page, "Bare rich text");
const empty = (page: Page) => text(page, "Empty rich text");
const readOnly = (page: Page) => text(page, "Read-only rich text");
const callouts = (page: Page) => text(page, "Callouts");
const markers = (page: Page) => text(page, "Heading markers");
const fieldHost = (page: Page) => section(page).locator('.tln-rich-text[data-variant="field"]').first();
const bareHost = (page: Page) => section(page).locator('.tln-rich-text[data-variant="bare"]').first();
const count = (page: Page, label: string) => section(page).getByLabel(label);

// What a token resolves to, as the browser computes it, for a color and for a length.
const token = (page: Page, name: string) =>
  page.evaluate((variable) => {
    const probe = document.createElement("i");
    probe.style.color = `var(${variable})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, name);
const length = (page: Page, name: string) =>
  page.evaluate((variable) => {
    const probe = document.createElement("i");
    probe.style.cssText = `display:block;width:var(${variable})`;
    document.body.append(probe);
    const width = getComputedStyle(probe).width;
    probe.remove();
    return width;
  }, name);

const style = (target: Locator, property: string, pseudo?: string) =>
  target.evaluate((el, [prop, pseudoElement]) => getComputedStyle(el, pseudoElement).getPropertyValue(prop!), [property, pseudo]);

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(field(page)).toBeVisible();
  await expect(bare(page)).toBeVisible();
});

test.describe("editing", () => {
  test("a document that was only shown is not reported as a change", async ({ page }) => {
    await expect(count(page, "field changes")).toHaveText("0");
    await expect(count(page, "pane changes")).toHaveText("0");
    await expect(count(page, "empty changes")).toHaveText("0");
  });

  test("typing reports a change, and Enter starts a paragraph", async ({ page }) => {
    await empty(page).click();
    await page.keyboard.type("one");
    await page.keyboard.press("Enter");
    await page.keyboard.type("two");
    await expect(empty(page).locator("> p")).toHaveText(["one", "two"]);
    await expect(count(page, "empty changes")).not.toHaveText("0");
  });

  test("the bold shortcut marks what is typed next", async ({ page }) => {
    await empty(page).click();
    await page.keyboard.press("Control+b");
    await page.keyboard.type("loud");
    await page.keyboard.press("Control+b");
    await page.keyboard.type(" quiet");
    await expect(empty(page).locator("strong")).toHaveText("loud");
    await expect(empty(page).locator("p")).toHaveText("loud quiet");
  });

  test("markdown at the start of a line makes a heading and a list", async ({ page }) => {
    await empty(page).click();
    await page.keyboard.type("# Title");
    await expect(empty(page).locator("h1")).toHaveText("Title");
    await page.keyboard.press("Enter");
    await page.keyboard.type("- item");
    await expect(empty(page).locator("ul > li")).toHaveText("item");
  });

  test("undo takes back what was typed", async ({ page }) => {
    await empty(page).click();
    await page.keyboard.type("abc");
    await expect(empty(page)).toContainText("abc");
    await page.keyboard.press("Control+z");
    await expect(empty(page)).not.toContainText("abc");
    await expect(empty(page).locator(".is-empty")).toHaveCount(1);
  });

  test("Tab leaves the editor for the next control", async ({ page }) => {
    await field(page).click();
    await page.keyboard.press("Tab");
    expect(await field(page).evaluate((el) => el.contains(document.activeElement))).toBe(false);
  });
});

test.describe("readOnly", () => {
  test("blocks typing, and says so", async ({ page }) => {
    await expect(readOnly(page)).toHaveAttribute("contenteditable", "false");
    await expect(readOnly(page)).toHaveAttribute("aria-readonly", "true");
    const before = await readOnly(page).innerText();
    await readOnly(page).click();
    await page.keyboard.type("typed");
    await page.keyboard.press("Backspace");
    expect(await readOnly(page).innerText()).toBe(before);
  });

  test("shows no placeholder: nobody can type", async ({ page }) => {
    await expect(readOnly(page).locator(".is-empty")).toHaveCount(0);
  });

  test("can be selected, to copy from", async ({ page }) => {
    await readOnly(page).getByText("Nothing here").dblclick();
    expect(await page.evaluate(() => String(getSelection()).trim().length)).toBeGreaterThan(0);
  });
});

test.describe("content from outside", () => {
  test("replaces the document, and is not reported as an edit", async ({ page }) => {
    await field(page).click();
    await page.keyboard.type("x");
    const before = await count(page, "field changes").innerText();
    await section(page).getByRole("button", { name: "Replace from outside" }).click();
    await expect(field(page).locator("h1")).toHaveText("Replaced from outside");
    await expect(count(page, "field changes")).toHaveText(before);
  });

  test("an edit comes back through the binding without replacing the document", async ({ page }) => {
    // If the editor took its own edit for a replacement, the caret would jump to the start and
    // the second word would land before the first.
    await empty(page).click();
    await page.keyboard.type("first ");
    await page.keyboard.type("second");
    await expect(empty(page)).toHaveText("first second");
    const changes = Number(await count(page, "empty changes").innerText());
    expect(changes).toBeGreaterThanOrEqual(2);
  });

  test("an edit is written back through the binding, JSON in the pane", async ({ page }) => {
    await bare(page).click();
    await page.keyboard.press("Control+End");
    await page.keyboard.type("!");
    await expect(bare(page)).toContainText("selection.!");
    await expect(count(page, "pane changes")).toHaveText("1");
  });
});

test.describe("commands on the bound editor", () => {
  test("the toolbar runs commands on the editor the component handed out", async ({ page }) => {
    await field(page).click();
    await page.keyboard.press("Control+a");
    await section(page).getByRole("button", { name: "Bold" }).click();
    await expect(field(page).locator("strong").first()).toBeVisible();
  });

  test("toggleCallout wraps the blocks and takes the callout away again", async ({ page }) => {
    await field(page).locator("p").first().click();
    const tip = section(page).getByRole("button", { name: "Tip callout" });
    await tip.click();
    await expect(field(page).locator('.tln-callout[data-callout="tip"]')).toHaveCount(1);
    await expect(field(page).locator(".tln-callout > p")).toHaveCount(1);
    await tip.click();
    await expect(field(page).locator(".tln-callout")).toHaveCount(0);
    await expect(field(page).locator("p").first()).toContainText("Body text is");
  });
});

test.describe("variants", () => {
  test("the field is a well, with a focus ring while it is in use", async ({ page }) => {
    expect(await style(fieldHost(page), "background-color")).toBe(await token(page, "--tln-well"));
    expect(await style(fieldHost(page), "border-radius")).not.toBe("0px");
    expect(await style(fieldHost(page), "box-shadow")).not.toBe("none");
    await expect(fieldHost(page)).toHaveCSS("outline-style", "none");
    await field(page).click();
    await expect(fieldHost(page)).toHaveCSS("outline-style", "solid");
    await expect(fieldHost(page)).toHaveCSS("outline-width", "2px");
    await page.keyboard.press("Tab");
    await expect(fieldHost(page)).toHaveCSS("outline-style", "none");
  });

  test("the bare editor draws no surface, radius, shadow or ring", async ({ page }) => {
    expect(await style(bareHost(page), "background-color")).toBe("rgba(0, 0, 0, 0)");
    expect(await style(bareHost(page), "border-radius")).toBe("0px");
    expect(await style(bareHost(page), "box-shadow")).toBe("none");
    await bare(page).click();
    await expect(bareHost(page)).toHaveCSS("outline-style", "none");
    // Not ProseMirror's own outline either: an application needs no override.
    await expect(bare(page)).toHaveCSS("outline-style", "none");
    await expect(field(page)).toHaveCSS("outline-style", "none");
  });

  test("both fill the height of their parent, and scroll inside it", async ({ page }) => {
    const pane = await section(page).getByRole("group", { name: "Rich text pane" }).boundingBox();
    const host = await bareHost(page).boundingBox();
    expect(Math.round(host!.height)).toBe(Math.round(pane!.height));
    await bare(page).click();
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Enter");
    }
    const scroller = bareHost(page).locator(".tln-rich-text-scroll");
    expect(await scroller.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    const after = await bareHost(page).boundingBox();
    expect(Math.round(after!.height)).toBe(Math.round(pane!.height));
  });

  test("the pane can see that focus is inside it", async ({ page }) => {
    await expect(section(page).getByText("pane focus-within: no")).toBeVisible();
    await bare(page).click();
    await expect(section(page).getByText("pane focus-within: yes")).toBeVisible();
  });

  test("a click below the last line still puts the caret in the document", async ({ page }) => {
    const box = await bare(page).boundingBox();
    await page.mouse.click(box!.x + 40, box!.y + box!.height - 8);
    await page.keyboard.type("z");
    await expect(bare(page)).toContainText("z");
  });
});

test.describe("the look of prose", () => {
  test("headings are the token sizes, 30, 24 and 20px, in the weight of strong", async ({ page }) => {
    const sizes = await field(page).evaluate((el) => ["h1", "h2", "h3"].map((tag) => getComputedStyle(el.querySelector(tag)!).fontSize));
    expect(sizes).toEqual(["30px", "24px", "20px"]);
    expect(await style(field(page).locator("h1"), "font-weight")).toBe("700");
  });

  test("body text is the ink, in the sans face, at the prose leading", async ({ page }) => {
    const p = field(page).locator("p").first();
    expect(await style(p, "color")).toBe(await token(page, "--tln-fg"));
    expect(await style(p, "font-size")).toBe("16px");
    expect(await style(p, "line-height")).toBe("28px");
  });

  test("a line is never wider than the measure", async ({ page }) => {
    expect(await style(field(page), "max-width")).toBe(await length(page, "--tln-measure"));
  });

  test("links are the accent and underlined; inline code and code blocks are a tint in the code face", async ({ page }) => {
    const link = field(page).locator("a").first();
    expect(await style(link, "color")).toBe(await token(page, "--tln-accent"));
    expect(await style(link, "text-decoration-line")).toBe("underline");
    const code = field(page).locator("p code").first();
    expect(await style(code, "background-color")).toBe(await token(page, "--tln-tint"));
    expect(await style(code, "font-family")).toContain("monospace");
    const pre = field(page).locator("pre");
    expect(await style(pre, "background-color")).toBe(await token(page, "--tln-tint"));
    expect(await style(pre.locator("code"), "background-color")).toBe("rgba(0, 0, 0, 0)");
  });

  test("lists keep their markers, and a rule is one hairline", async ({ page }) => {
    expect(await style(field(page).locator("ul").first(), "list-style-type")).toBe("disc");
    expect(await style(field(page).locator("ol").first(), "list-style-type")).toBe("decimal");
    const rule = field(page).locator("hr");
    expect(await style(rule, "border-top-width")).toBe("1px");
    expect(await style(rule, "border-top-color")).toBe(await token(page, "--tln-border"));
  });

  test("a quote is quiet, set back, and ruled by one hairline", async ({ page }) => {
    const quote = field(page).locator("blockquote");
    expect(await style(quote, "color")).toBe(await token(page, "--tln-fg-muted"));
    expect(await style(quote, "border-left-width")).toBe("1px");
    expect(await style(quote, "margin-left")).toBe("0px");
  });

  test("an empty document shows its placeholder in the muted ink, and typing takes it away", async ({ page }) => {
    const hint = empty(page).locator(".is-empty");
    await expect(hint).toHaveAttribute("data-placeholder", "Start writing here");
    expect(await style(hint, "content", "::before")).toBe('"Start writing here"');
    expect(await style(hint, "color", "::before")).toBe(await token(page, "--tln-fg-muted"));
    await empty(page).click();
    await page.keyboard.type("a");
    await expect(empty(page).locator(".is-empty")).toHaveCount(0);
  });

  test("a selection is the soft accent", async ({ page }) => {
    await field(page).locator("p").first().dblclick();
    expect(await style(field(page).locator("p").first(), "background-color", "::selection")).toBe(
      await token(page, "--tln-accent-soft"),
    );
  });
});

test.describe("Tomet callouts", () => {
  const tones = [
    ["note", "--tln-accent", "--tln-accent-soft"],
    ["tip", "--tln-ok", "--tln-ok-soft"],
    ["warning", "--tln-warn", "--tln-warn-soft"],
    ["danger", "--tln-danger", "--tln-danger-soft"],
  ] as const;

  for (const [kind, line, fill] of tones) {
    test(`${kind} wears its tone: a hairline and a soft fill`, async ({ page }) => {
      const callout = callouts(page).locator(`[data-callout="${kind}"]`);
      expect(await style(callout, "border-top-color")).toBe(await token(page, line));
      expect(await style(callout, "border-top-width")).toBe("1px");
      expect(await style(callout, "background-color")).toBe(await token(page, fill));
      expect(await style(callout, "border-radius")).toBe(await style(fieldHost(page), "border-radius"));
      await expect(callout).toHaveAttribute("role", "note");
    });

    test(`${kind} says what it is in words, not only in color`, async ({ page }) => {
      const callout = callouts(page).locator(`[data-callout="${kind}"]`);
      expect(await style(callout, "content", "::before")).toBe(`"${kind}"`);
    });
  }

  test("a callout holds blocks, and starts and ends flush", async ({ page }) => {
    const danger = callouts(page).locator('[data-callout="danger"]');
    await expect(danger.locator("> ul")).toHaveCount(1);
    expect(await style(danger.locator("> p").first(), "margin-top")).toBe("0px");
  });

  test("its kind is an attribute of the document, and survives an edit", async ({ page }) => {
    await callouts(page).locator('[data-callout="tip"] p').click();
    await page.keyboard.press("End");
    await page.keyboard.type("!");
    await expect(callouts(page).locator('[data-callout="tip"]')).toContainText("A tip: ok.!");
  });
});

test.describe("Tomet heading markers", () => {
  test("show the way Tomet writes a heading, and can be switched off and on", async ({ page }) => {
    const h1 = field(page).locator("h1");
    await expect(field(page)).not.toHaveClass(/tln-tomet-markers/);
    expect(await style(h1, "content", "::before")).toBe("none");
    await section(page).getByRole("button", { name: /Heading markers/ }).click();
    await expect(field(page)).toHaveClass(/tln-tomet-markers/);
    expect(await style(h1, "content", "::before")).toContain("=[ ");
    expect(await style(h1, "content", "::after")).toContain(" ]=");
    expect(await style(field(page).locator("h2").first(), "content", "::before")).toContain("==[ ");
    expect(await style(field(page).locator("h3").first(), "content", "::before")).toContain("===[ ");
    await section(page).getByRole("button", { name: /Heading markers/ }).click();
    await expect(field(page)).not.toHaveClass(/tln-tomet-markers/);
  });

  test("are quiet: the code face, the muted ink", async ({ page }) => {
    const h1 = markers(page).locator("h1");
    expect(await style(h1, "color", "::before")).toBe(await token(page, "--tln-fg-muted"));
    expect(await style(h1, "font-family", "::before")).toContain("monospace");
  });

  test("are not text of the document", async ({ page }) => {
    await expect(markers(page).locator("h1")).toHaveText("Writing in a pane");
  });
});
