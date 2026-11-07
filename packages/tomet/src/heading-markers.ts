import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import "./heading-markers.css";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    headingMarkers: {
      /** Shows or hides the Tomet markers on headings. */
      setHeadingMarkers: (shown: boolean) => ReturnType;
      toggleHeadingMarkers: () => ReturnType;
    };
  }
}

export interface HeadingMarkersOptions {
  /** Whether the markers are shown from the start. Default: true. */
  shown: boolean;
}

const key = new PluginKey<boolean>("tomet-heading-markers");

/**
 * Draws a heading the way Tomet writes it: `=[ title ]=`, `==[ title ]==`, `===[ title ]===` for
 * the first three levels. The markers are drawn around the heading, quietly, in the code face;
 * they are not text of the document and are never in its content. Without this extension (or with
 * the markers hidden) a heading is just a heading: the plain, rich-text view of the same document.
 *
 * Whether they are shown is state of the editor, not of the document, and can be changed at any time
 * (`editor.commands.setHeadingMarkers(false)`), so a person can switch between the two views
 * without the editor being made again. The editor is marked with the class `tln-tomet-markers`;
 * heading-markers.css is what that class draws.
 */
export const HeadingMarkers = Extension.create<HeadingMarkersOptions>({
  name: "headingMarkers",

  addOptions() {
    return { shown: true };
  },

  addCommands() {
    return {
      setHeadingMarkers:
        (shown) =>
        ({ tr, dispatch }) => {
          if (dispatch) tr.setMeta(key, shown);
          return true;
        },
      toggleHeadingMarkers:
        () =>
        ({ state, tr, dispatch }) => {
          if (dispatch) tr.setMeta(key, !key.getState(state));
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const initial = this.options.shown;
    return [
      new Plugin<boolean>({
        key,
        state: {
          init: () => initial,
          apply: (tr, shown) => (tr.getMeta(key) as boolean | undefined) ?? shown,
        },
        props: {
          attributes: (state): Record<string, string> =>
            key.getState(state) ? { class: "tln-tomet-markers" } : {},
        },
      }),
    ];
  },
});
