/**
 * Template colour schemes for the playground. A scheme gives, for each theme, the two ends of the
 * depth scale and the accent; the surfaces between the ends, the shadows and the lights are
 * computed from them by the tokens, so nothing else is chosen here.
 */

export type Ends = {
  /** The darkest end of the depth scale: what a shadow is made of. */
  dark: string;
  /** The brightest end: what a light is made of. */
  bright: string;
  accent: string;
};

export type Scheme = { id: string; label: string; light: Ends; dark: Ends };

export const schemes: Scheme[] = [
  {
    id: "lavender",
    label: "Lavender",
    light: { dark: "#d8d2ec", bright: "#fffbff", accent: "#6d4fd1" },
    dark: { dark: "#060509", bright: "#4a4560", accent: "#a78bfa" },
  },
  {
    id: "mint",
    label: "Mint",
    light: { dark: "#cde5de", bright: "#fbfffd", accent: "#0f766e" },
    dark: { dark: "#040807", bright: "#3c4e4a", accent: "#2dd4bf" },
  },
  {
    id: "cream",
    label: "Cream",
    light: { dark: "#e8dcc6", bright: "#fffdf7", accent: "#b45309" },
    dark: { dark: "#070604", bright: "#4d4640", accent: "#fbbf24" },
  },
  {
    id: "rose",
    label: "Rose",
    light: { dark: "#efd2dc", bright: "#fffafb", accent: "#be185d" },
    dark: { dark: "#090507", bright: "#544149", accent: "#f472b6" },
  },
];
