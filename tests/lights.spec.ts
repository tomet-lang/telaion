import { test, expect } from "@playwright/test";

test("playground mouse shadow toggle: reacts to mouse when enabled and clears styles when disabled", async ({
  page,
}) => {
  await page.goto("/");

  const button = page.locator(".tln-btn").first();
  await expect(button).toBeVisible();

  const getSun = async () =>
    page.evaluate(() => {
      const root = document.documentElement;
      return {
        x: root.style.getPropertyValue("--tln-sun-shadow-x"),
        y: root.style.getPropertyValue("--tln-sun-shadow-y"),
      };
    });

  const getLamp = async (selector: string) =>
    page.evaluate((sel) => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el) return null;
      return {
        x: el.style.getPropertyValue("--tln-lamp-shadow-x"),
        y: el.style.getPropertyValue("--tln-lamp-shadow-y"),
        shadow: getComputedStyle(el).boxShadow,
      };
    }, selector);

  const shadowToggle = page.getByLabel("Mouse shadow");
  await expect(shadowToggle).toBeVisible();

  // 1. Initial state (disabled): dynamic properties should be empty/unset
  await page.mouse.move(100, 100);
  await page.waitForTimeout(50);
  const initialSun = await getSun();
  expect(initialSun.x).toBe("");
  expect(initialSun.y).toBe("");

  const initialBtnLamp = await getLamp(".tln-btn");
  expect(initialBtnLamp?.x).toBe("");

  // 2. Enable mouse shadow
  await shadowToggle.check();
  await expect(shadowToggle).toBeChecked();

  // 3. Move mouse to top-left of viewport (100, 100)
  await page.mouse.move(100, 100);
  await page.waitForTimeout(100);

  const sunTopLeft = await getSun();
  expect(sunTopLeft.x).toBeTruthy();
  expect(sunTopLeft.y).toBeTruthy();
  // Cursor at top-left: Sun is at bottom-right, parallel sun shadows fall toward top-left (-x, -y)
  expect(parseFloat(sunTopLeft.x)).toBeLessThan(0);
  expect(parseFloat(sunTopLeft.y)).toBeLessThan(0);

  // Check button lamp shadow
  const btnTopLeft = await getLamp(".tln-btn");
  expect(btnTopLeft).not.toBeNull();
  expect(btnTopLeft?.x).toBeTruthy();

  // 4. Move mouse to bottom-right of viewport (1000, 600 - within 1280x720)
  await page.mouse.move(1000, 600);
  await page.waitForTimeout(100);

  const sunBottomRight = await getSun();
  // Cursor at bottom-right: Sun is at top-left, parallel sun shadows fall toward bottom-right (+x, +y)
  expect(parseFloat(sunBottomRight.x)).toBeGreaterThan(0);
  expect(parseFloat(sunBottomRight.y)).toBeGreaterThan(0);

  // 5. Check multiple layers: content (editor-bar, layer-content), well (input), float (modal)
  const editorBar = await getLamp(".tln-editor-bar");
  expect(editorBar).not.toBeNull();
  expect(editorBar?.x).toBeTruthy();
  expect(editorBar?.shadow).not.toBe("none");

  const layerContent = await getLamp(".layer-content");
  expect(layerContent).not.toBeNull();
  expect(layerContent?.x).toBeTruthy();

  const inputControl = await getLamp(".tln-input");
  expect(inputControl).not.toBeNull();
  expect(inputControl?.x).toBeTruthy();
  expect(inputControl?.shadow).toContain("inset");

  // Check float layer (Modal)
  await page.getByRole("button", { name: "Open modal" }).click();
  const modal = page.locator(".tln-modal[open]");
  await expect(modal).toBeVisible();

  // Move mouse to trigger light update on open modal
  await page.mouse.move(500, 300);
  await page.waitForTimeout(100);

  const modalLamp = await getLamp(".tln-modal[open]");
  expect(modalLamp).not.toBeNull();
  expect(modalLamp?.x).toBeTruthy();
  expect(modalLamp?.shadow).not.toBe("none");

  // Close modal
  await modal.getByRole("button", { name: "Close" }).click();
  await expect(modal).not.toBeVisible();

  // 6. Disable mouse shadow: all dynamic inline properties must be cleared
  await shadowToggle.uncheck();
  await expect(shadowToggle).not.toBeChecked();

  await page.mouse.move(200, 200);
  await page.waitForTimeout(50);

  const clearedSun = await getSun();
  expect(clearedSun.x).toBe("");
  expect(clearedSun.y).toBe("");

  const clearedBtnLamp = await getLamp(".tln-btn");
  expect(clearedBtnLamp?.x).toBe("");
  expect(clearedBtnLamp?.y).toBe("");
});
