// A test double for the Tomet highlighter. It is NOT a Tomet grammar: a few regular
// expressions are enough to give the highlighting extension something to paint.
// The real one comes from the application's Tomet engine.

import { type HighlightSpan, utf8ToUtf16Spans } from "@telaion/tomet";

export type Mode = "sync" | "bytes" | "slow" | "manual" | "failing";

const pattern = /^=\[.*\]$|\/\/.*$|"[^"\n]*"|@[A-Za-z]+/gm;

/** Spans counted in UTF-16 code units, the unit Telaion expects. */
export function stubSpans(source: string): HighlightSpan[] {
  const spans: HighlightSpan[] = [];
  for (const match of source.matchAll(pattern)) {
    const text = match[0];
    const tag = text.startsWith("=[")
      ? "heading"
      : text.startsWith("//")
        ? "lineComment"
        : text.startsWith('"')
          ? "string"
          : "tagName";
    spans.push({ from: match.index, to: match.index + text.length, tag });
  }
  return spans;
}

/** The same spans as an engine written in Rust would report them: in UTF-8 bytes. */
function inBytes(source: string, spans: HighlightSpan[]): HighlightSpan[] {
  const encoder = new TextEncoder();
  const at = (index: number) => encoder.encode(source.slice(0, index)).length;
  return spans.map((span) => ({ ...span, from: at(span.from), to: at(span.to) }));
}

/** An engine that answers in bytes, adapted the way an application adapts it. */
export function bytesHighlight(source: string): HighlightSpan[] {
  return utf8ToUtf16Spans(source, inBytes(source, stubSpans(source)));
}

export function slowHighlight(source: string): Promise<HighlightSpan[]> {
  return new Promise((resolve) => setTimeout(() => resolve(stubSpans(source)), 600));
}

export function failingHighlight(): Promise<HighlightSpan[]> {
  return Promise.reject(new Error("the engine is not available"));
}
