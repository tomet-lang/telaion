import { expect, test, type Page } from "@playwright/test";

// The type, shape, motion and paper tokens of tokens.css, as the browser computes them in each theme.
// (The layers and the ink are in layers.spec.ts; the shadows in light-and-shadow.spec.ts.)

/** What a token computes to when it is used as `property`, under the current theme. */
const computed = (page: Page, name: string, property: string): Promise<string> =>
  page.evaluate(
    ([variable, prop]) => {
      const probe = document.createElement("div");
      probe.style.setProperty(prop, `var(${variable})`);
      document.body.append(probe);
      const value = getComputedStyle(probe).getPropertyValue(prop);
      probe.remove();
      return value;
    },
    [name, property],
  );

/** The declared value of a token, as the browser holds it on the root (a var() inside it already resolved). */
const declared = (page: Page, name: string): Promise<string> =>
  page.evaluate((variable) => getComputedStyle(document.documentElement).getPropertyValue(variable).trim(), name);

const px = async (page: Page, name: string) => parseFloat(await computed(page, name, "width"));

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

for (const scheme of ["light", "dark"] as const) {
  test.describe(`${scheme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
    });

    test("paper is white in both themes", async ({ page }) => {
      expect(await computed(page, "--tln-paper", "color")).toBe("rgb(255, 255, 255)");
    });

    test("paper is not on the depth scale", async ({ page }) => {
      const paper = await computed(page, "--tln-paper", "color");
      for (const layer of ["well", "canvas", "content", "action"]) {
        expect(await computed(page, `--tln-${layer}`, "color"), `paper is not ${layer}`).not.toBe(paper);
      }
    });

    test("a hairline is one pixel", async ({ page }) => {
      expect(await px(page, "--tln-hairline")).toBe(1);
    });

    test("the text sizes ascend from xs to 2xl", async ({ page }) => {
      const sizes = [];
      for (const size of ["xs", "sm", "md", "lg", "xl", "2xl"]) sizes.push(await px(page, `--tln-text-${size}`));
      expect(sizes).toEqual([12, 14, 16, 20, 24, 30]);
      expect([...sizes].sort((a, b) => a - b)).toEqual(sizes);
    });

    test("the weights are medium and strong, and the strong one is heavier", async ({ page }) => {
      const medium = Number(await computed(page, "--tln-weight-medium", "font-weight"));
      const strong = Number(await computed(page, "--tln-weight-strong", "font-weight"));
      expect(medium).toBe(500);
      expect(strong).toBe(700);
      expect(strong).toBeGreaterThan(medium);
    });

    test("read text is set looser than controls, and has a measure", async ({ page }) => {
      const leading = Number(await declared(page, "--tln-leading"));
      const prose = Number(await declared(page, "--tln-leading-prose"));
      expect(leading).toBe(1.6);
      expect(prose).toBe(1.75);
      expect(prose).toBeGreaterThan(leading);
      expect(await px(page, "--tln-measure")).toBe(768);
    });

    test("the transition is the duration and the easing, together", async ({ page }) => {
      const [duration, ease] = await page.evaluate(() => {
        const probe = document.createElement("i");
        probe.style.transition = "color var(--tln-transition)";
        document.body.append(probe);
        const used = getComputedStyle(probe);
        const result = [used.transitionDuration, used.transitionTimingFunction];
        probe.remove();
        return result;
      });
      expect(duration).toBe("0.15s");
      expect(ease).toBe("ease");
      // It is also what it was before it was split: one value that a person can still override whole.
      expect(await declared(page, "--tln-transition")).toBe(`${await declared(page, "--tln-duration")} ${await declared(page, "--tln-ease")}`);
      expect(await declared(page, "--tln-transition")).toBe("0.15s ease");
    });

    test("the focus ring is still two pixels", async ({ page }) => {
      const [width, style] = await page.evaluate(() => {
        const probe = document.createElement("i");
        probe.style.outline = "var(--tln-focus-ring)";
        document.body.append(probe);
        const used = getComputedStyle(probe);
        const result = [used.outlineWidth, used.outlineStyle];
        probe.remove();
        return result;
      });
      expect([width, style]).toEqual(["2px", "solid"]);
    });
  });
}

test("a token that a subtree overrides reaches the components in it", async ({ page }) => {
  // The hairline is read where it is used, so that an application can thicken every divider in a subtree.
  const width = await page.evaluate(() => {
    const host = document.createElement("div");
    host.style.setProperty("--tln-hairline", "3px");
    const probe = document.createElement("i");
    probe.style.border = "var(--tln-hairline) solid red";
    host.append(probe);
    document.body.append(host);
    const result = getComputedStyle(probe).borderTopWidth;
    host.remove();
    return result;
  });
  expect(width).toBe("3px");
});
