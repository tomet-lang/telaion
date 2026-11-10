/** Colour arithmetic for the playground's colour panel: what a person picks, and whether it can be read. */

export type Rgb = [number, number, number];

export const hexToRgb = (hex: string): Rgb => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;

export const rgbToHex = ([r, g, b]: Rgb): string =>
  "#" + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("");

/** `amount` of the way from `a` to `b`, 0..1, in sRGB. Enough for a hover shade of a picked colour. */
export const mixHex = (a: string, b: string, amount: number): string => {
  const [x, y] = [hexToRgb(a), hexToRgb(b)];
  return rgbToHex(x.map((v, i) => v + (y[i] - v) * amount) as Rgb);
};

const linear = (v: number) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

export const luminance = ([r, g, b]: Rgb): number => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);

export const contrast = (a: Rgb, b: Rgb): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** The ink to put on a fill: white, or the near-black of the design, whichever reads better. */
export const inkOn = (fill: string): string =>
  contrast(hexToRgb("#ffffff"), hexToRgb(fill)) >= contrast(hexToRgb("#09090b"), hexToRgb(fill)) ? "#ffffff" : "#09090b";

let canvas: CanvasRenderingContext2D | null = null;

/** Any colour the browser computes (it writes `oklab(...)` for a colour mixed in oklab) as sRGB. */
export function cssToRgb(css: string): Rgb {
  canvas ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!canvas) throw new Error("no 2d canvas");
  canvas.clearRect(0, 0, 1, 1);
  canvas.fillStyle = "#000";
  canvas.fillStyle = css;
  canvas.fillRect(0, 0, 1, 1);
  const [r, g, b] = canvas.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

/**
 * What a token computes to under a theme, whatever its value is written as. The probe takes the
 * theme through `color-scheme`, which is what resolves `light-dark()`.
 */
export function tokenColor(token: string, scheme: "light" | "dark", property: "color" | "background-color" = "color"): Rgb {
  const probe = document.createElement("i");
  probe.style.colorScheme = scheme;
  probe.style.setProperty(property, `var(${token})`);
  document.documentElement.append(probe);
  const computed = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return cssToRgb(computed);
}
