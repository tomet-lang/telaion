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

  // The parts of CodeMirror that an application brings in with `extensions`: search, folding,
  // bracket matching. CodeMirror draws them for a light or a dark page, not for tokens, so they
  // are set here; otherwise a search panel stays light in a dark application.
  ".cm-panels": {
    color: "var(--tln-fg)",
    backgroundColor: "var(--tln-bg-subtle)",
  },
  ".cm-panels-top": { borderBottom: "1px solid var(--tln-border)" },
  ".cm-panels-bottom": { borderTop: "1px solid var(--tln-border)" },
  ".cm-panel.cm-search label": {
    color: "var(--tln-fg-muted)",
    fontSize: "var(--tln-text-xs)",
  },
  ".cm-panel.cm-search [name=close]": { color: "var(--tln-fg-muted)" },
  ".cm-textfield, .cm-button": {
    font: "inherit",
    fontSize: "var(--tln-text-sm)",
    color: "var(--tln-fg)",
    backgroundImage: "none",
    border: "1px solid var(--tln-border-strong)",
    borderRadius: "var(--tln-radius)",
  },
  ".cm-textfield": { backgroundColor: "var(--tln-bg)" },
  ".cm-button": { backgroundColor: "var(--tln-bg-subtle)", cursor: "pointer" },
  ".cm-button:hover": { backgroundColor: "var(--tln-bg-sunken)" },
  ".cm-textfield:focus-visible, .cm-button:focus-visible": {
    outline: "2px solid var(--tln-accent)",
    outlineOffset: "1px",
  },
  ".cm-searchMatch": {
    backgroundColor: "var(--tln-warn-soft)",
    outline: "1px solid var(--tln-warn)",
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "var(--tln-accent-soft)",
    outline: "1px solid var(--tln-accent)",
  },
  ".cm-selectionMatch": { backgroundColor: "var(--tln-bg-sunken)" },
  "&.cm-focused .cm-matchingBracket": {
    backgroundColor: "var(--tln-accent-soft)",
    outline: "1px solid var(--tln-accent)",
  },
  "&.cm-focused .cm-nonmatchingBracket": {
    backgroundColor: "var(--tln-danger-soft)",
    outline: "1px solid var(--tln-danger)",
  },
  ".cm-tooltip": {
    color: "var(--tln-fg)",
    backgroundColor: "var(--tln-bg-subtle)",
    border: "1px solid var(--tln-border-strong)",
    borderRadius: "var(--tln-radius)",
  },
  ".cm-foldPlaceholder": {
    color: "var(--tln-fg-muted)",
    backgroundColor: "var(--tln-bg-sunken)",
    border: "1px solid var(--tln-border-strong)",
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
