import { expect, test, type Page } from "@playwright/test";

// The rules written at the top of tokens.css, as tests. A change of a color that breaks one fails here.

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

type Rgb = [number, number, number];

/** What a token resolves to, as the browser computes it under the current theme. */
const token = (page: Page, name: string): Promise<Rgb> =>
  page.evaluate((variable) => {
    const probe = document.createElement("i");
    probe.style.color = `var(${variable})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color.match(/[\d.]+/g)!.slice(0, 3).map(Number) as Rgb;
  }, name);

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

const layers = ["well", "canvas", "content", "action"] as const;

for (const scheme of ["light", "dark"] as const) {
  test.describe(`${scheme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
    });

    for (const layer of layers) {
      for (const ink of ["fg", "fg-muted"]) {
        test(`${ink} is readable on the ${layer} layer`, async ({ page }) => {
          const [text, surface] = await Promise.all([token(page, `--tln-${ink}`), token(page, `--tln-${layer}`)]);
          expect(contrast(text, surface)).toBeGreaterThanOrEqual(4.5);
        });
      }

      test(`the focus ring is seen on the ${layer} layer`, async ({ page }) => {
        const [ring, surface] = await Promise.all([token(page, "--tln-accent"), token(page, `--tln-${layer}`)]);
        expect(contrast(ring, surface)).toBeGreaterThanOrEqual(3);
      });
    }

    test("what is higher is nearer the light: canvas, then content, then action", async ({ page }) => {
      const [canvas, content, action] = (await Promise.all(
        ["canvas", "content", "action"].map((l) => token(page, `--tln-${l}`)),
      )).map(luminance);
      expect(canvas).toBeLessThan(content);
      expect(content).toBeLessThanOrEqual(action);
    });

    test("a well is darker than the content it is cut into", async ({ page }) => {
      const [well, content] = (await Promise.all(["well", "content"].map((l) => token(page, `--tln-${l}`)))).map(
        luminance,
      );
      expect(well).toBeLessThan(content);
    });
  });
}

test("a field is a well: no border, and a shadow that falls inward", async ({ page }) => {
  const field = page.locator(".tln-input").first();
  const look = await field.evaluate((el) => {
    const s = getComputedStyle(el);
    return { border: s.borderTopWidth, shadow: s.boxShadow };
  });
  expect(look.border).toBe("0px");
  expect(look.shadow).toContain("inset");
});

test("a select is an action, like a button: casts an outward shadow", async ({ page }) => {
  const look = await page.locator(".tln-select-control").first().evaluate((el) => {
    const s = getComputedStyle(el);
    return { border: s.borderTopWidth, shadow: s.boxShadow };
  });
  expect(look.shadow).not.toBe("none");
  const shadows = look.shadow.split(/,(?![^(]*\))/);
  expect(shadows.some((s) => !s.includes("inset"))).toBe(true);
});

test("a button is the opposite of a well: casts an outward shadow", async ({ page }) => {
  const shadow = await page
    .locator('.tln-btn[data-variant="secondary"]')
    .first()
    .evaluate((el) => getComputedStyle(el).boxShadow);
  expect(shadow).not.toBe("none");
  const shadows = shadow.split(/,(?![^(]*\))/);
  expect(shadows.some((s) => !s.includes("inset"))).toBe(true);
});
