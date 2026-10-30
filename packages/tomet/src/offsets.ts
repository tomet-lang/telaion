import type { HighlightSpan } from "./services.js";

/**
 * Turn spans counted in UTF-8 bytes into spans counted in UTF-16 code units.
 *
 * Rust counts bytes; JavaScript and CodeMirror count code units. They agree on ASCII and
 * disagree on everything else, so Japanese text shifts every span after it. An application
 * whose engine answers in bytes passes the answer through this before handing it to Telaion.
 */
export function utf8ToUtf16Spans(
  source: string,
  spans: readonly HighlightSpan[],
): HighlightSpan[] {
  if (spans.length === 0) return [];

  const byteLength = new TextEncoder().encode(source).length;
  // Pure ASCII: both counts are the same.
  if (byteLength === source.length) return spans.map((span) => ({ ...span }));

  // For every byte offset, the code unit offset of the character it belongs to.
  const unitAt = new Uint32Array(byteLength + 1);
  let byte = 0;
  let unit = 0;
  for (const character of source) {
    const codePoint = character.codePointAt(0)!;
    const width = codePoint < 0x80 ? 1 : codePoint < 0x800 ? 2 : codePoint < 0x10000 ? 3 : 4;
    for (let k = 0; k < width; k++) unitAt[byte + k] = unit;
    byte += width;
    unit += character.length;
  }
  unitAt[byte] = unit;

  const convert = (offset: number) => unitAt[Math.max(0, Math.min(offset, byteLength))];
  return spans.map((span) => ({ ...span, from: convert(span.from), to: convert(span.to) }));
}
