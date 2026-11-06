import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { bracketMatching, foldGutter, foldKeymap, indentOnInput } from "@codemirror/language";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { type Extension, Prec } from "@codemirror/state";
import { keymap } from "@codemirror/view";

/**
 * What a person editing source text expects beyond the minimal editor: a fold gutter, matching
 * brackets that are closed as they are typed, indentation that follows what was typed, search
 * (Mod-f), and a highlight for the other places that match the selection. Pass it as the
 * `extensions` of a `CodeEditor`.
 *
 * It is a preset and not part of `CodeEditor`, because a small field (a commit message, a
 * one-line formula) is better off without it. Everything it draws is styled by the theme of
 * `CodeEditor`, so it follows the design tokens in light and dark.
 *
 * The bracket keys are placed above the default keys, so Backspace between a pair removes both.
 */
export const sourceEditingExtensions: Extension = [
  foldGutter(),
  indentOnInput(),
  bracketMatching(),
  closeBrackets(),
  highlightSelectionMatches(),
  Prec.high(keymap.of(closeBracketsKeymap)),
  keymap.of([...searchKeymap, ...foldKeymap]),
];
