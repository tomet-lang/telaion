import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";

/**
 * The look of the editor, written in the design tokens of @telaion/primitives and nothing else.
 * CodeMirror writes these rules into a stylesheet, where var() resolves like anywhere else,
 * so the theme follows the light and dark switch with no extra work.
 */
const theme = EditorView.theme({
  "&": {
    height: "100%",
    color: "var(--tln-fg)",
    backgroundColor: "var(--tln-content)",
    fontSize: "var(--tln-text-sm)",
  },
  "&.cm-focused": {
    outline: "var(--tln-focus-ring)",
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
    backgroundColor: "var(--tln-tint)",
  },
  ".cm-gutters": {
    color: "var(--tln-fg-muted)",
    backgroundColor: "transparent",
    border: "none",
    borderRight: "1px solid var(--tln-border)",
  },
  ".cm-activeLineGutter": {
    color: "var(--tln-fg)",
    backgroundColor: "var(--tln-tint)",
  },

  // The parts of CodeMirror that an application brings in with `extensions`: search, folding,
  // bracket matching. CodeMirror draws them for a light or a dark page, not for tokens, so they
  // are set here; otherwise a search panel stays light in a dark application.
  // A panel only holds fields and buttons: it is content, set off from the text by a divider.
  ".cm-panels": {
    color: "var(--tln-fg)",
    backgroundColor: "var(--tln-content)",
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
    borderRadius: "var(--tln-radius)",
  },
  // A field is a well, a button is the action layer: the same looks as in @telaion/primitives.
  ".cm-textfield": {
    backgroundColor: "var(--tln-well)",
    border: "none",
    boxShadow: "var(--tln-shadow-well)",
  },
  // The same look as a Button of @telaion/primitives: no frame, a shadow that grows on hover.
  ".cm-button": {
    backgroundColor: "var(--tln-action)",
    border: "1px solid transparent",
    boxShadow: "var(--tln-shadow-action)",
    cursor: "pointer",
  },
  ".cm-button:hover": { boxShadow: "var(--tln-shadow-action-hover)" },
  ".cm-textfield:focus-visible, .cm-button:focus-visible": {
    outline: "var(--tln-focus-ring)",
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
  ".cm-selectionMatch": { backgroundColor: "var(--tln-tint)" },
  "&.cm-focused .cm-matchingBracket": {
    backgroundColor: "var(--tln-accent-soft)",
    outline: "1px solid var(--tln-accent)",
  },
  "&.cm-focused .cm-nonmatchingBracket": {
    backgroundColor: "var(--tln-danger-soft)",
    outline: "1px solid var(--tln-danger)",
  },
  // A tooltip floats over the editor.
  ".cm-tooltip": {
    color: "var(--tln-fg)",
    backgroundColor: "var(--tln-content)",
    border: "none",
    borderRadius: "var(--tln-radius)",
    boxShadow: "var(--tln-shadow-float)",
  },
  ".cm-foldPlaceholder": {
    color: "var(--tln-fg-muted)",
    backgroundColor: "var(--tln-tint)",
    border: "none",
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
