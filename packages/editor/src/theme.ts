import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";

/**
 * The look of the text and of what CodeMirror draws around it, written in design tokens and
 * nothing else. CodeMirror writes these rules into a stylesheet, where var() resolves like
 * anywhere else, so the theme follows the light and dark switch with no extra work.
 *
 * It paints no surface and no frame: the editor is text on whatever holds it. The surface
 * (a well, or the pane the editor fills) and the focus ring belong to CodeEditor, which knows
 * whether it is a field or a pane. Where focus shows without a ring is decided here: the caret,
 * the selection and the line number of the active line are shown while the editor has focus and
 * are quiet otherwise. There is no band on the active line itself (see CodeEditor).
 */
const theme = EditorView.theme({
  "&": {
    height: "100%",
    color: "var(--tln-fg)",
    fontSize: "var(--tln-text-sm)",
  },
  // CodeMirror outlines a focused editor by itself; the ring, where there is one, is CodeEditor's.
  "&.cm-focused": { outline: "none" },
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
  // A selection is a passing state (tint) while the editor is not in use, and the accent while it is.
  ".cm-selectionBackground": { backgroundColor: "var(--tln-tint)" },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-content ::selection":
    {
      backgroundColor: "var(--tln-accent-soft)",
    },
  ".cm-gutters": {
    color: "var(--tln-fg-muted)",
    backgroundColor: "transparent",
    border: "none",
    borderRight: "1px solid var(--tln-border)",
  },
  ".cm-activeLineGutter": { backgroundColor: "transparent" },
  "&.cm-focused .cm-activeLineGutter": {
    color: "var(--tln-fg)",
    backgroundColor: "var(--tln-tint)",
  },
  ".cm-foldGutter span:hover": { color: "var(--tln-fg)" },

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
  ".cm-button:active": { boxShadow: "var(--tln-shadow-action-active)" },
  ".cm-textfield:focus-visible, .cm-button:focus-visible": {
    outline: "var(--tln-focus-ring)",
    outlineOffset: "0",
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
  // A tooltip floats over the editor: content lifted in front of the page, with no frame and no arrow.
  ".cm-tooltip": {
    color: "var(--tln-fg)",
    backgroundColor: "var(--tln-content)",
    border: "none",
    borderRadius: "var(--tln-radius)",
    boxShadow: "var(--tln-shadow-float)",
    overflow: "hidden",
  },
  ".cm-tooltip .cm-tooltip-arrow": { display: "none" },
  // The completion list is a menu: its items are what is chosen, the selected one is marked as a
  // selection is, and a disabled list steps back.
  ".cm-tooltip.cm-tooltip-autocomplete > ul": {
    fontFamily: "var(--tln-font-mono)",
    fontSize: "var(--tln-text-sm)",
    lineHeight: "var(--tln-leading)",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul > li": {
    padding: "0 calc(var(--tln-space) * 2)",
    lineHeight: "var(--tln-leading)",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul > completion-section": {
    color: "var(--tln-fg-muted)",
    borderBottom: "1px solid var(--tln-border)",
    opacity: "1",
  },
  ".cm-tooltip-autocomplete ul li[aria-selected]": {
    color: "var(--tln-fg)",
    background: "var(--tln-accent-soft)",
  },
  ".cm-tooltip-autocomplete-disabled ul li[aria-selected]": {
    color: "var(--tln-fg-muted)",
    background: "var(--tln-tint)",
  },
  ".cm-completionDetail, .cm-completionIcon": { color: "var(--tln-fg-muted)", opacity: "1" },
  ".cm-completionMatchedText": { color: "var(--tln-accent)" },
  ".cm-tooltip.cm-completionInfo": { padding: "calc(var(--tln-space) * 2)" },
  // A snippet's fields: where Tab goes next.
  ".cm-snippetField": { backgroundColor: "var(--tln-tint)" },
  ".cm-snippetFieldPosition": { borderLeftColor: "var(--tln-fg-muted)" },
  ".cm-foldPlaceholder": {
    color: "var(--tln-fg-muted)",
    backgroundColor: "var(--tln-tint)",
    border: "none",
    borderRadius: "var(--tln-radius)",
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
