export type ThemeMode = "system" | "light" | "dark";

/**
 * Apply the theme mode to an element by setting or removing the `data-theme` attribute.
 *
 * - "system": removes the `data-theme` attribute, allowing the browser's `light-dark()`
 *   and prefers-color-scheme to determine the theme automatically.
 * - "light": sets `data-theme="light"`.
 * - "dark": sets `data-theme="dark"`.
 */
export function applyTheme(element: HTMLElement, mode: ThemeMode): void {
  if (mode === "system") {
    element.removeAttribute("data-theme");
  } else {
    element.setAttribute("data-theme", mode);
  }
}

/**
 * Determine the effective theme ("light" or "dark") currently resolved on the given element.
 */
export function getEffectiveTheme(element: HTMLElement = document.documentElement): "light" | "dark" {
  const explicit = element.closest?.("[data-theme]")?.getAttribute("data-theme");
  if (explicit === "light" || explicit === "dark") {
    return explicit;
  }
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}
