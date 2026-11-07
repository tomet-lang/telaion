import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const key = new PluginKey("telaionPlaceholder");

/**
 * Shows a hint in an empty document. The hint is a `data-placeholder` attribute and an `is-empty`
 * class on the one empty block that an empty document is; prose.css draws it. It is a decoration,
 * not content: it is never in the document, and it is gone as soon as there is a character, or a
 * second block, or when nobody can type (a read-only editor has nothing to ask for).
 *
 * `text` is read each time the editor is drawn, so the hint can change while the editor lives
 * (see `RichText`, which redraws after it changed).
 */
export function placeholderExtension(text: () => string): Extension {
  return Extension.create({
    name: "telaionPlaceholder",
    addProseMirrorPlugins() {
      const editor = this.editor;
      return [
        new Plugin({
          key,
          props: {
            decorations({ doc }) {
              const hint = text();
              const only = doc.childCount === 1 ? doc.firstChild : null;
              if (!hint || !editor.isEditable || !only || !only.isTextblock || only.content.size > 0) {
                return null;
              }
              return DecorationSet.create(doc, [
                Decoration.node(0, only.nodeSize, { class: "is-empty", "data-placeholder": hint }),
              ]);
            },
          },
        }),
      ];
    },
  });
}
