import { expect, test } from "@playwright/test";

// A filled button must stay readable in both themes. These tests fail if a token change breaks that.

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

/** WCAG contrast ratio between the text color and the fill of an element, read as the browser sees them. */
async function contrast(page: import("@playwright/test").Page, name: string): Promise<number> {
  return page.getByRole("button", { name, exact: true }).first().evaluate((el) => {
    const channels = (css: string) => css.match(/[\d.]+/g)!.slice(0, 3).map(Number);
    const luminance = ([r, g, b]: number[]) => {
      const [R, G, B] = [r, g, b].map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    };
    const style = getComputedStyle(el);
    const [a, b] = [luminance(channels(style.color)), luminance(channels(style.backgroundColor))].sort(
      (x, y) => y - x,
    );
    return (a + 0.05) / (b + 0.05);
  });
}

for (const scheme of ["light", "dark"] as const) {
  test.describe(`${scheme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.waitForTimeout(200);
    });

    test("primary text is readable on its fill", async ({ page }) => {
      expect(await contrast(page, "Save")).toBeGreaterThanOrEqual(4.5);
    });

    test("danger-fill text is readable on its fill", async ({ page }) => {
      expect(await contrast(page, "Delete")).toBeGreaterThanOrEqual(4.5);
    });

    test("danger-fill is filled with the danger color", async ({ page }) => {
      const button = page.getByRole("button", { name: "Delete", exact: true }).nth(1);
      const [fill, danger] = await Promise.all([
        button.evaluate((el) => getComputedStyle(el).backgroundColor),
        page.evaluate(() => {
          const probe = document.createElement("i");
          probe.style.color = "var(--tln-danger)";
          document.body.append(probe);
          const color = getComputedStyle(probe).color;
          probe.remove();
          return color;
        }),
      ]);
      expect(fill).toBe(danger);
    });
  });
}
