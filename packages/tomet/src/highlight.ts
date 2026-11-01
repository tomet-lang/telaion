import { type Extension, StateEffect, StateField } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView, ViewPlugin } from "@codemirror/view";
import type { HighlightSpan, TometServices } from "./services.js";

/**
 * Colors for the tags of the Tomet highlighter, in the design tokens of @telaion/primitives.
 * Meaning goes by color only. A tag that is not listed here is left in the ordinary text color.
 */
const theme = EditorView.baseTheme({
  ".tln-hl-heading, .tln-hl-tagName, .tln-hl-list": { color: "var(--tln-accent)" },
  ".tln-hl-string, .tln-hl-number, .tln-hl-atom": { color: "var(--tln-ok)" },
  ".tln-hl-lineComment, .tln-hl-blockComment, .tln-hl-processingInstruction, .tln-hl-punctuation, .tln-hl-contentSeparator":
    { color: "var(--tln-fg-muted)" },
  ".tln-hl-propertyName": { color: "var(--tln-fg)" },
  ".tln-hl-monospace": { backgroundColor: "var(--tln-tint)" },
});

const setHighlights = StateEffect.define<DecorationSet>();

// The decorations live in the editor state, so they follow the text while a new answer is on its way.
const highlights = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(decorations, transaction) {
    decorations = decorations.map(transaction.changes);
    for (const effect of transaction.effects) {
      if (effect.is(setHighlights)) decorations = effect.value;
    }
    return decorations;
  },
  provide: (field) => EditorView.decorations.from(field),
});

function toDecorations(spans: readonly HighlightSpan[], length: number): DecorationSet {
  const ranges = [];
  for (const { from, to, tag } of spans) {
    // A tag becomes a CSS class name, so only plain words are let through.
    if (!/^[A-Za-z]+$/.test(tag) || !(from < to) || from < 0 || to > length) continue;
    ranges.push(Decoration.mark({ class: `tln-hl-${tag}` }).range(from, to));
  }
  return Decoration.set(ranges, true);
}

/**
 * Syntax highlighting for Tomet, from the `highlight` of the application's Tomet services.
 * Pass the result as the `language` of a CodeEditor.
 *
 * It asks again after every edit. An answer that arrives for text that has since changed is
 * dropped, so a slow engine never paints old ranges over new text. If the engine fails, the
 * editor keeps working and `onError` is told.
 */
export function tometHighlighting(
  services: Pick<TometServices, "highlight">,
  options: { onError?: (error: unknown) => void } = {},
): Extension {
  const plugin = ViewPlugin.fromClass(
    class {
      #version = 0;
      #destroyed = false;

      constructor(view: EditorView) {
        this.#ask(view);
      }

      update(update: { docChanged: boolean; view: EditorView }) {
        if (update.docChanged) this.#ask(update.view);
      }

      destroy() {
        this.#destroyed = true;
      }

      #ask(view: EditorView) {
        const version = ++this.#version;
        const source = view.state.doc.toString();
        const show = (spans: readonly HighlightSpan[]) => {
          if (this.#destroyed || version !== this.#version) return;
          view.dispatch({ effects: setHighlights.of(toDecorations(spans, source.length)) });
        };
        const fail = (error: unknown) => {
          if (!this.#destroyed && version === this.#version) options.onError?.(error);
        };
        try {
          const answer = services.highlight(source);
          if (answer instanceof Promise) answer.then(show, fail);
          // An editor may not be updated while it is updating; answer on the next tick.
          else queueMicrotask(() => show(answer));
        } catch (error) {
          fail(error);
        }
      }
    },
  );

  return [highlights, plugin, theme];
}
