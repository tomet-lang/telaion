import { expect, test } from "@playwright/test";
import { utf8ToUtf16Spans } from "../packages/tomet/src/offsets.ts";

// Rust counts bytes; JavaScript counts UTF-16 code units. These tests state how a span moves.

const span = (from: number, to: number) => ({ from, to, tag: "t" });

test("plain ASCII is unchanged", () => {
  expect(utf8ToUtf16Spans("=[ Title ]", [span(0, 10)])).toEqual([span(0, 10)]);
});

test("no spans, no work", () => {
  expect(utf8ToUtf16Spans("日本語", [])).toEqual([]);
});

test("Japanese: three bytes become one code unit", () => {
  // "=[ 見出し ]": '=', '[', ' ' are 3 bytes, 見出し is 9 bytes, then ' ' and ']'.
  const source = "=[ 見出し ]";
  expect(utf8ToUtf16Spans(source, [span(3, 12)])).toEqual([span(3, 6)]);
  expect(utf8ToUtf16Spans(source, [span(0, 14)])).toEqual([span(0, 8)]);
});

test("text after Japanese shifts back to where JavaScript counts it", () => {
  const source = "注釈 // x";
  const bytes = new TextEncoder().encode(source);
  const fromByte = bytes.length - 4; // "// x"
  const [converted] = utf8ToUtf16Spans(source, [span(fromByte, bytes.length)]);
  expect(source.slice(converted.from, converted.to)).toBe("// x");
});

test("an emoji is four bytes and two code units", () => {
  // "😀a": the emoji takes bytes 0-3, 'a' is byte 4.
  expect(utf8ToUtf16Spans("😀a", [span(4, 5)])).toEqual([span(2, 3)]);
  expect(utf8ToUtf16Spans("😀a", [span(0, 4)])).toEqual([span(0, 2)]);
});

test("an offset in the middle of a character lands on that character", () => {
  expect(utf8ToUtf16Spans("日本", [span(1, 4)])).toEqual([span(0, 1)]);
});

test("offsets outside the text are held inside it", () => {
  expect(utf8ToUtf16Spans("日本", [span(0, 999)])).toEqual([span(0, 2)]);
});

test("the tag and any other field travel along", () => {
  expect(utf8ToUtf16Spans("日", [{ from: 0, to: 3, tag: "string" }])).toEqual([
    { from: 0, to: 1, tag: "string" },
  ]);
});
