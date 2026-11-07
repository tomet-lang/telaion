import { mergeAttributes, Node } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorState } from "@tiptap/pm/state";
import "@telaion/primitives/looks.css";
import "./callout.css";

/** The kinds of callout that Tomet knows. */
export type CalloutType = "note" | "tip" | "warning" | "danger";

/**
 * The tone (looks.css) that each kind is drawn in. `note` is the accent, as every tone is that
 * has no name of its own; so an unknown kind is, and `info`, which ordiola's stylesheet treats as a note.
 */
const tones: Record<string, "ok" | "warn" | "danger" | undefined> = {
  tip: "ok",
  warning: "warn",
  danger: "danger",
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      /** Wraps the selected blocks in a callout; if the selection is in one, sets its kind. */
      setCallout: (attributes?: { type: CalloutType | (string & {}) }) => ReturnType;
      /** Like `setCallout`; takes the callout away if the selection is in one of that kind. */
      toggleCallout: (attributes?: { type: CalloutType | (string & {}) }) => ReturnType;
      /** Takes away the callout that the selection is in, and keeps what it held. */
      unsetCallout: () => ReturnType;
    };
  }
}

export interface CalloutOptions {
  HTMLAttributes: Record<string, unknown>;
}

/**
 * A callout: a block of blocks that carries a meaning, drawn as the tone of that meaning.
 *
 * The node is called `callout`, with one attribute `type`, and holds blocks. That is the shape of
 * a Tomet `::{callout(note)} ... ::` block in the ProseMirror JSON that the engine of an application
 * produces and reads. It renders as `<div data-callout="note">`, which is also what it parses.
 *
 * It needs the look of looks.css (the tones), which this module imports; the rest of the look is
 * callout.css. It imports `@tiptap/core` and nothing of Telaion's editor: it is an extension of
 * Tiptap, usable in any editor.
 */
export const Callout = Node.create<CalloutOptions>({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      type: {
        default: "note",
        parseHTML: (element) => element.getAttribute("data-callout") || "note",
        renderHTML: (attributes) => ({ "data-callout": attributes.type }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-callout]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const tone = tones[String(HTMLAttributes["data-callout"])];
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "tln-callout tln-tone",
        role: "note",
        ...(tone ? { "data-tone": tone } : {}),
      }),
      0,
    ];
  },

  addCommands() {
    const name = this.name;

    /** The callout that the selection is in (or is, as a whole), and where it is. */
    const around = (state: EditorState): { pos: number; node: ProseMirrorNode } | null => {
      const { $from } = state.selection;
      for (let depth = $from.depth; depth > 0; depth--) {
        const node = $from.node(depth);
        if (node.type.name === name) return { pos: $from.before(depth), node };
      }
      const after = $from.nodeAfter;
      return after?.type.name === name ? { pos: $from.pos, node: after } : null;
    };

    return {
      setCallout:
        (attributes) =>
        ({ state, tr, dispatch, commands }) => {
          const found = around(state);
          if (!found) return commands.wrapIn(name, attributes);
          if (dispatch) tr.setNodeMarkup(found.pos, undefined, { ...found.node.attrs, ...attributes });
          return true;
        },
      toggleCallout:
        (attributes) =>
        ({ state, tr, dispatch, commands }) => {
          const found = around(state);
          if (!found) return commands.wrapIn(name, attributes);
          // The same kind again takes it away; another kind changes it.
          if (attributes && found.node.attrs.type !== attributes.type) {
            if (dispatch) tr.setNodeMarkup(found.pos, undefined, { ...found.node.attrs, ...attributes });
            return true;
          }
          if (dispatch) tr.replaceWith(found.pos, found.pos + found.node.nodeSize, found.node.content);
          return true;
        },
      unsetCallout:
        () =>
        ({ state, tr, dispatch }) => {
          const found = around(state);
          if (!found) return false;
          if (dispatch) tr.replaceWith(found.pos, found.pos + found.node.nodeSize, found.node.content);
          return true;
        },
    };
  },
});
