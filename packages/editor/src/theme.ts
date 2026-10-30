import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";

/**
 * The look of the editor, written in the design tokens of @telaion/ui and nothing else.
 * CodeMirror writes these rules into a stylesheet, where var() resolves like anywhere else,
 * so the theme follows the light and dark switch with no extra work.
 */
const theme = EditorView.theme({
  "&": {
    height: "100%",
    color: "var(--tln-fg)",
    backgroundColor: "var(--tln-bg)",
    fontSize: "var(--tln-text-sm)",
  },
  "&.cm-focused": {
    outline: "2px solid var(--tln-accent)",
    outlineOffset: "-2px",
  },
  ".cm-scroller": {
    fontFamily: "var(--tln-font-mono)",
    lineHeight: "var(--tln-leading)",
  },
  ".cm-content": {
    caretColor: "var(--tln-accent)",
    padding: "calc(var(--tln-space) * 3) 0",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "var(--tln-accent)",
  },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
    {
      backgroundColor: "var(--tln-accent-soft)",
    },
  ".cm-activeLine": {
    backgroundColor: "var(--tln-bg-subtle)",
  },
  ".cm-gutters": {
    color: "var(--tln-fg-muted)",
    backgroundColor: "var(--tln-bg-subtle)",
    border: "none",
    borderRight: "1px solid var(--tln-border)",
  },
  ".cm-activeLineGutter": {
    color: "var(--tln-fg)",
    backgroundColor: "var(--tln-bg-sunken)",
  },
});

/** What the tags of a language are drawn as. Meaning goes by color; no weights, no sizes. */
const highlight = HighlightStyle.define([
  { tag: [tags.heading, tags.keyword], color: "var(--tln-accent)" },
  { tag: [tags.link, tags.url], color: "var(--tln-accent)", textDecoration: "underline" },
  { tag: [tags.string, tags.literal, tags.number], color: "var(--tln-ok)" },
  { tag: [tags.comment, tags.meta, tags.processingInstruction], color: "var(--tln-fg-muted)" },
  { tag: tags.invalid, color: "var(--tln-danger)" },
]);

export const telaionTheme: Extension = [theme, syntaxHighlighting(highlight)];
