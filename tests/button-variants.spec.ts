import { expect, test, type Locator, type Page } from "@playwright/test";

// Sizes, icons and soft (tonal) buttons of Button and IconButton, in the ButtonDemo section of the playground.

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  // A color is read at rest and then on hover: look at the end of a transition, not along it.
  await page.addStyleTag({ content: "*{transition:none!important}" });
});

type Rgb = [number, number, number];

/** Any CSS color (rgb, color(srgb ...), oklab ...) as 8-bit RGB, as the browser paints it. */
const rgbOf = (page: Page, css: string): Promise<Rgb> =>
  page.evaluate((value) => {
    const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b] as Rgb;
  }, css);

/** What a token resolves to under the current theme. */
const token = (page: Page, name: string): Promise<Rgb> =>
  page
    .evaluate((variable) => {
      const probe = document.createElement("i");
      probe.style.color = `var(${variable})`;
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    }, name)
    .then((color) => rgbOf(page, color));

const style = (el: Locator, property: string) => el.evaluate((node, p) => getComputedStyle(node).getPropertyValue(p), property);
const paint = async (page: Page, el: Locator, property: "background-color" | "color") =>
  rgbOf(page, await style(el, property));

const luminance = ([r, g, b]: Rgb) => {
  const [R, G, B] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};
const contrast = (a: Rgb, b: Rgb) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const sizes = (page: Page) => page.locator('[aria-label="sizes"]');
const icons = (page: Page) => page.locator('[aria-label="icons"]');
const bar = (page: Page) => page.locator('[aria-label="insert bar"]');
const iconButtons = (page: Page) => page.locator('[aria-label="icon buttons"]');

const variants = ["primary", "secondary", "danger", "danger-fill", "quiet", "soft"] as const;

test.describe("size", () => {
  for (const variant of variants) {
    test(`a ${variant} Button of size sm is smaller than md, in height, type and padding`, async ({ page }) => {
      const [md, sm] = await Promise.all(
        ["md", "sm"].map(async (size) => {
          const button = sizes(page).locator(`.tln-btn[data-variant="${variant}"][data-size="${size}"]:enabled`);
          const box = await button.boundingBox();
          return {
            height: box!.height,
            fontSize: parseFloat(await style(button, "font-size")),
            paddingLeft: parseFloat(await style(button, "padding-left")),
          };
        }),
      );
      expect(sm.height).toBeLessThan(md.height);
      expect(sm.fontSize).toBeLessThan(md.fontSize);
      expect(sm.paddingLeft).toBeLessThan(md.paddingLeft);
    });
  }

  test("md is the default and its size has not changed", async ({ page }) => {
    const button = page.getByRole("button", { name: "Save", exact: true }).first();
    await expect(button).toHaveAttribute("data-size", "md");
    const space = parseFloat(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--tln-space")));
    expect(parseFloat(await style(button, "padding-top"))).toBe(space * 1.5 + 1);
    expect(parseFloat(await style(button, "padding-left"))).toBe(space * 3 + 1);
  });

  test("an IconButton of size sm is smaller than md, and stays square", async ({ page }) => {
    const [md, sm] = await Promise.all(
      ["md", "sm"].map(async (size) => {
        const box = await iconButtons(page)
          .locator(`.tln-icon-btn[data-variant="quiet"][data-size="${size}"]:enabled`)
          .boundingBox();
        return box!;
      }),
    );
    expect(sm.width).toBeLessThan(md.width);
    expect(sm.height).toBeLessThan(md.height);
    expect(sm.width).toBeCloseTo(sm.height, 0);
  });
});

test.describe("icons", () => {
  test("the icon sits before the label with the button's own gap, and is hidden from assistive technology", async ({ page }) => {
    for (const size of ["md", "sm"]) {
      const button = icons(page).locator(`.tln-btn[data-size="${size}"]`).filter({ hasText: "New page" });
      const gap = parseFloat(await style(button, "column-gap"));
      expect(gap).toBeGreaterThan(0);
      const [svg, label] = await button.evaluate((node) => {
        const svgBox = node.querySelector("svg")!.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents([...node.childNodes].find((n) => n.nodeType === 3 && n.textContent!.trim())!);
        const textBox = range.getBoundingClientRect();
        return [
          { left: svgBox.left, right: svgBox.right },
          { left: textBox.left, right: textBox.right },
        ];
      });
      expect(svg.right).toBeLessThanOrEqual(label.left);
      expect(label.left - svg.right).toBeCloseTo(gap, 0);
      await expect(button.locator("svg")).toHaveAttribute("aria-hidden", "true");
    }
  });

  test("iconEnd sits after the label, and both ends can be used together", async ({ page }) => {
    const button = icons(page).locator(".tln-btn").filter({ hasText: "Both" }).first();
    await expect(button.locator("svg")).toHaveCount(2);
    const [first, text, last] = await button.evaluate((node) => {
      const [a, b] = [...node.querySelectorAll("svg")].map((s) => s.getBoundingClientRect());
      const range = document.createRange();
      range.selectNodeContents([...node.childNodes].find((n) => n.nodeType === 3 && n.textContent!.trim())!);
      return [a.right, range.getBoundingClientRect().left, b.left, range.getBoundingClientRect().right];
    });
    expect(first).toBeLessThanOrEqual(text);
    expect(last).toBeGreaterThanOrEqual(text);
  });

  test("the label alone is the accessible name", async ({ page }) => {
    await expect(icons(page).getByRole("button", { name: "Save", exact: true }).first()).toBeVisible();
    await expect(icons(page).getByRole("button", { name: "Vault", exact: true }).first()).toBeVisible();
  });

  test("the icon follows the type size of the button", async ({ page }) => {
    const [md, sm] = await Promise.all(
      ["md", "sm"].map((size) =>
        icons(page).locator(`.tln-btn[data-size="${size}"]`).filter({ hasText: "New page" }).locator("svg").boundingBox(),
      ),
    );
    expect(sm!.width).toBeLessThan(md!.width);
  });
});

for (const scheme of ["light", "dark"] as const) {
  test.describe(`soft buttons, ${scheme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.waitForTimeout(200);
    });

    const tones = [
      ["accent", "Note"],
      ["ok", "Tip"],
      ["warn", "Warning"],
      ["danger", "Danger"],
    ] as const;

    for (const [tone, name] of tones) {
      test(`${tone}: filled with its soft color, label in the foreground, readable at rest and on hover`, async ({ page }) => {
        const button = bar(page).getByRole("button", { name, exact: true });
        await expect(button).toHaveAttribute("data-tone", tone);
        const soft = await token(page, `--tln-${tone}-soft`);
        const fg = await token(page, "--tln-fg");
        expect(await paint(page, button, "background-color")).toEqual(soft);
        expect(await paint(page, button, "color")).toEqual(fg);
        expect(contrast(fg, soft)).toBeGreaterThanOrEqual(4.5);

        await button.hover();
        const hovered = await paint(page, button, "background-color");
        expect(hovered).not.toEqual(soft);
        expect(contrast(fg, hovered)).toBeGreaterThanOrEqual(4.5);
      });

      test(`${tone}: the icon wears the tone`, async ({ page }) => {
        const icon = bar(page).getByRole("button", { name, exact: true }).locator("svg");
        expect(await paint(page, icon, "color")).toEqual(await token(page, `--tln-${tone}`));
      });
    }

    test("the tones are told apart", async ({ page }) => {
      const fills = await Promise.all(
        tones.map(([, name]) => paint(page, bar(page).getByRole("button", { name, exact: true }), "background-color")),
      );
      expect(new Set(fills.map((f) => f.join())).size).toBe(4);
    });

    test("a soft button without a tone is the accent", async ({ page }) => {
      const button = bar(page).getByRole("button", { name: "no tone", exact: true });
      await expect(button).toHaveAttribute("data-tone", "accent");
      expect(await paint(page, button, "background-color")).toEqual(await token(page, "--tln-accent-soft"));
    });

    test("it stays an action: it casts the action shadow and lifts on hover", async ({ page }) => {
      const button = bar(page).getByRole("button", { name: "Tip", exact: true });
      const rest = await style(button, "box-shadow");
      expect(rest).not.toBe("none");
      await button.hover();
      expect(await style(button, "box-shadow")).not.toBe(rest);
    });

    test("disabled: the one disabled look, whatever the tone", async ({ page }) => {
      const tint = await token(page, "--tln-tint");
      for (const tone of ["accent", "ok", "warn", "danger"]) {
        const button = bar(page).locator(`.tln-btn[data-variant="soft"][data-tone="${tone}"]:disabled`);
        expect(await paint(page, button, "background-color")).toEqual(tint);
        expect(await style(button, "box-shadow")).toBe("none");
      }
    });

    test("an IconButton can be soft too, and its icon wears the tone", async ({ page }) => {
      const button = iconButtons(page).getByRole("button", { name: "Remove (warn)" }).first();
      expect(await paint(page, button, "background-color")).toEqual(await token(page, "--tln-warn-soft"));
      expect(await paint(page, button.locator("svg"), "color")).toEqual(await token(page, "--tln-warn"));
    });
  });
}

test.describe("behavior", () => {
  test("a click and the keyboard both press a soft button", async ({ page }) => {
    const inserted = page.locator('[aria-label="inserted"]');
    await bar(page).getByRole("button", { name: "Tip", exact: true }).click();
    await expect(inserted).toHaveText("tip");
    await bar(page).getByRole("button", { name: "Warning", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(inserted).toHaveText("warning");
    await bar(page).getByRole("button", { name: "Danger", exact: true }).focus();
    await page.keyboard.press("Space");
    await expect(inserted).toHaveText("danger");
  });

  test("a disabled soft button does not press and is not focusable", async ({ page }) => {
    const disabled = bar(page).locator('.tln-btn[data-variant="soft"][data-tone="ok"]:disabled');
    await disabled.click({ force: true });
    await expect(disabled).toBeDisabled();
    await expect(page.locator('[aria-label="inserted"]')).toHaveText("nothing yet");
  });

  test("keyboard focus shows the focus ring on a soft button and on a small IconButton", async ({ page }) => {
    for (const target of [
      bar(page).getByRole("button", { name: "Note", exact: true }),
      iconButtons(page).locator('.tln-icon-btn[data-size="sm"][data-variant="soft"]').first(),
    ]) {
      await target.focus();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Shift+Tab");
      await expect(target).toBeFocused();
      expect(await style(target, "outline-style")).toBe("solid");
      expect(parseFloat(await style(target, "outline-width"))).toBeGreaterThan(0);
    }
  });

  test("a label stays on one line at both sizes", async ({ page }) => {
    for (const label of ["Code block", "Warning"]) {
      const button = bar(page).getByRole("button", { name: label, exact: true });
      const [box, line] = await Promise.all([
        button.boundingBox(),
        button.evaluate((el) => parseFloat(getComputedStyle(el).lineHeight)),
      ]);
      expect(box!.height).toBeLessThan(line * 2);
    }
  });
});
