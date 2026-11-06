import { expect, test, type Page } from "@playwright/test";

// The rule written at "LIGHT AND SHADOW" in tokens.css, as tests:
//
//   action  inside: light   outside: shadow
//   well    inside: shadow  outside: light
//
// and one sun for both, so that when the sun moves, light and shadow move together.

type Layer = { color: number[]; x: number; y: number; blur: number; spread: number; inset: boolean };

const COLOR = /(?:rgba?|color)\([^)]*\)/;

/** A computed colour as [r, g, b, a], each of r, g, b in 0..255. The browser writes either form. */
function parseColor(text: string): number[] {
  const srgb = text.match(/^color\(srgb\s+([^)]*)\)$/);
  if (srgb) {
    const [channels, alpha = "1"] = srgb[1].split("/").map((s) => s.trim());
    const [r, g, b] = channels.split(/\s+/).map((v) => parseFloat(v) * 255);
    return [r, g, b, parseFloat(alpha)];
  }
  const [r, g, b, a = 1] = text.match(/\(([^)]*)\)/)![1].split(",").map(Number);
  return [r, g, b, a];
}

/** The layers of a computed box-shadow, in paint order (the first is on top). */
function layers(boxShadow: string): Layer[] {
  const parts = boxShadow.split(/,(?![^(]*\))/).map((s) => s.trim());
  return parts.map((part) => {
    const color = parseColor(part.match(COLOR)![0]);
    const rest = part.replace(COLOR, "");
    const [x, y, blur = 0, spread = 0] = rest.match(/-?[\d.]+px/g)!.map(parseFloat);
    return { color, x, y, blur, spread, inset: /\binset\b/.test(rest) };
  });
}

/**
 * Whether a layer is light: made of the brightest step of the depth scale (--tln-layer-5), as
 * a shadow is made of the darkest (--tln-layer-1). Set in beforeEach for the theme under test.
 */
let isLight: (layer: Layer) => boolean = () => false;

const shadowOf = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((el) => getComputedStyle(el).boxShadow);

// Where the sun is, as the way a shadow falls: the default, the other side, and two mixed.
const suns = [
  { x: 2, y: 2 },
  { x: -3, y: -3 },
  { x: 3, y: -2 },
  { x: -2, y: 3 },
];

for (const scheme of ["light", "dark"] as const) {
  for (const sun of suns) {
    test.describe(`${scheme} theme, sun at ${sun.x}px ${sun.y}px`, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/");
        await page.emulateMedia({ colorScheme: scheme });
        await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; }" });
        await page.evaluate(({ x, y }) => {
          document.documentElement.style.setProperty("--tln-sun-shadow-x", `${x}px`);
          document.documentElement.style.setProperty("--tln-sun-shadow-y", `${y}px`);
        }, sun);
        const brightest = parseColor(
          await page.evaluate(() => {
            const probe = document.createElement("i");
            probe.style.color = "var(--tln-layer-5)";
            document.body.append(probe);
            const color = getComputedStyle(probe).color;
            probe.remove();
            return color;
          }),
        );
        isLight = ({ color }) => [0, 1, 2].every((i) => Math.abs(color[i] - brightest[i]) < 1.5);
      });

      test("an action is lit on the inside and casts its shadow on the outside", async ({ page }) => {
        const all = layers(await shadowOf(page, '.tln-btn[data-variant="secondary"]'));
        const inside = all.filter((l) => l.inset);
        const outside = all.filter((l) => !l.inset);

        // Inside there is light, on the edge the sun reaches: the same offset as the sun.
        expect(inside.length).toBeGreaterThan(0);
        expect(inside.every(isLight)).toBe(true);
        // A band as thick as the sun's offset, made of half the offset and a spread of the same
        // half, so that the hole stays in the box and every corner stays round.
        const reach = Math.max(Math.abs(sun.x), Math.abs(sun.y));
        expect(inside[0]).toMatchObject({ x: sun.x / 2, y: sun.y / 2, spread: reach / 2 });
        // A weaker sub: a ring of the same thickness all around, under the main light.
        expect(inside[1]).toMatchObject({ x: 0, y: 0, spread: reach });
        expect(inside[1].color[3]).toBeLessThan(inside[0].color[3]);

        // Outside there is shadow only, falling the way the sun says.
        expect(outside.length).toBeGreaterThan(0);
        expect(outside.some(isLight)).toBe(false);
        const sunShadow = outside[0];
        expect(Math.sign(sunShadow.x)).toBe(Math.sign(sun.x));
        expect(Math.sign(sunShadow.y)).toBe(Math.sign(sun.y));
      });

      test("a well is shadowed on the inside and lit on the outside", async ({ page }) => {
        const all = layers(await shadowOf(page, ".tln-input"));
        const inside = all.filter((l) => l.inset);
        const outside = all.filter((l) => !l.inset);

        // Inside there is shadow only: nothing lights the inside of a well.
        expect(inside.length).toBeGreaterThan(0);
        expect(inside.some(isLight)).toBe(false);
        expect(Math.sign(inside[0].x)).toBe(Math.sign(sun.x));
        expect(Math.sign(inside[0].y)).toBe(Math.sign(sun.y));

        // Outside there is light, on the lip the sun reaches: the same offset as the sun.
        expect(outside.length).toBeGreaterThan(0);
        expect(outside.every(isLight)).toBe(true);
        expect(outside[0]).toMatchObject({ x: sun.x, y: sun.y });
        // A weaker sub: a ring of the same thickness all around, under the main light.
        expect(outside[1]).toMatchObject({
          x: 0,
          y: 0,
          spread: Math.max(Math.abs(sun.x), Math.abs(sun.y)),
        });
        expect(outside[1].color[3]).toBeLessThan(outside[0].color[3]);
      });

      test("a danger button keeps the action's light and shadow under its outline", async ({ page }) => {
        const plain = layers(await shadowOf(page, '.tln-btn[data-variant="secondary"]'));
        const danger = layers(await shadowOf(page, '.tln-btn[data-variant="danger"]:enabled'));
        // The first layer is the outline; the rest are the action's own.
        expect(danger[0]).toMatchObject({ inset: true, x: 0, y: 0, spread: 1 });
        expect(danger.slice(1)).toEqual(plain);
      });
    });
  }
}

test("an invalid select keeps the action's light and shadow, also while hovered", async ({ page }) => {
  await page.goto("/");
  await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; }" });
  const select = page.locator(".tln-select-control").first();

  const rest = layers(await select.evaluate((el) => getComputedStyle(el).boxShadow));
  await select.hover();
  const hovered = layers(await select.evaluate((el) => getComputedStyle(el).boxShadow));
  await page.mouse.move(0, 0);

  await select.evaluate((el) => el.setAttribute("aria-invalid", "true"));
  const invalidRest = layers(await select.evaluate((el) => getComputedStyle(el).boxShadow));
  await select.hover();
  const invalidHovered = layers(await select.evaluate((el) => getComputedStyle(el).boxShadow));

  for (const [invalid, valid] of [
    [invalidRest, rest],
    [invalidHovered, hovered],
  ]) {
    expect(invalid[0]).toMatchObject({ inset: true, x: 0, y: 0, spread: 1 });
    expect(invalid.slice(1)).toEqual(valid);
  }
  expect(hovered).not.toEqual(rest);
});
