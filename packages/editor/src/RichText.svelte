<script lang="ts">
  import { Editor, type Content, type Extensions } from "@tiptap/core";
  import StarterKit, { type StarterKitOptions } from "@tiptap/starter-kit";
  import { onMount } from "svelte";
  import { placeholderExtension } from "./placeholder.js";
  import "./prose.css";

  let {
    content = $bindable(null),
    editor = $bindable(null),
    format = "json",
    variant = "field",
    readOnly = false,
    label = "Document",
    placeholder = "",
    extensions = [],
    starterKit = {},
    onChange,
  }: {
    /**
     * The document. Either the JSON of ProseMirror (`format="json"`, the default) or an HTML
     * string (`format="html"`). What a person edits is written back in the same format, so the
     * value can be bound. A value that is not what the editor holds (a different document) replaces
     * it; the editor's own edits coming back through the binding are recognised and left alone, so the
     * caret and the undo history stay.
     */
    content?: Content;
    /**
     * The Tiptap `Editor`, once there is one (`null` before that and after the component is gone).
     * Bind it to run commands: `editor?.chain().focus().toggleBold().run()`.
     */
    editor?: Editor | null;
    /**
     * What `content` and `onChange` carry. JSON is exact: every node and attribute of the schema
     * survives, as an application's own extensions define them. HTML is what a page already has, and
     * keeps only what the schema can parse back.
     */
    format?: "json" | "html";
    /**
     * How the editor sits in its surroundings. Either way it fills the height of its parent,
     * which therefore needs a height of its own, and the text scrolls inside it. (The same
     * two variants as `CodeEditor`, so that the two behave alike where they are embedded.)
     *
     * - `"field"` (the default): a text field. A well, cut into the surface it is on, with a
     *   focus ring while it is in use.
     * - `"bare"`: the editor is the pane. It draws no surface, radius, shadow or ring: it is text
     *   on whatever its parent paints. Focus shows in the caret and the selection.
     */
    variant?: "field" | "bare";
    readOnly?: boolean;
    /** The accessible name of the text area. */
    label?: string;
    /** A hint in an empty document. */
    placeholder?: string;
    /**
     * More Tiptap extensions, for the marks and nodes an application has: a link, a callout, a
     * table. They are read once, when the editor is made: to change them, make the editor again
     * (`{#key}`). Extensions import `@tiptap/core`; they share the editor's copy of it.
     */
    extensions?: Extensions;
    /**
     * Options for the StarterKit that is the base of the editor (headings, lists, code, history,
     * and so on), or `false` to leave it out and bring the whole schema with `extensions`. Read
     * once, like `extensions`.
     */
    starterKit?: Partial<StarterKitOptions> | false;
    /** Called when a person edits. Not called when `content` is replaced from outside. */
    onChange?: (content: Content) => void;
  } = $props();

  let host: HTMLDivElement;
  let instance = $state.raw<Editor | null>(null);

  // What the editor holds as of the last time this component and its parent agreed, as text, so that
  // `content` coming back through a binding (a proxy of what was written) is recognised as
  // the editor's own and not applied again.
  let agreed = "";
  const key = (value: Content) =>
    typeof value === "string" ? value : JSON.stringify($state.snapshot(value));
  const read = (from: Editor): Content => (format === "html" ? from.getHTML() : from.getJSON());

  // A textbox that says what it is for and whether it can be typed into. Tiptap's own defaults
  // supply the rest (the role is repeated so that it does not depend on the version).
  const attributes = $derived({
    class: "tln-prose",
    role: "textbox",
    "aria-multiline": "true",
    "aria-label": label,
    "aria-readonly": String(readOnly),
  });

  onMount(() => {
    agreed = key(content);
    const made = new Editor({
      element: host,
      extensions: [
        ...(starterKit === false
          ? []
          : [
              StarterKit.configure({
                // The drop line is drawn by ProseMirror with an inline colour, so it takes a token here.
                dropcursor: { color: "var(--tln-accent)" },
                ...starterKit,
              }),
            ]),
        placeholderExtension(() => placeholder),
        ...extensions,
      ],
      content,
      editable: !readOnly,
      editorProps: { attributes },
      onUpdate: ({ editor: updated }) => {
        const next = read(updated);
        agreed = key(next);
        content = next;
        onChange?.(next);
      },
    });
    instance = made;
    editor = made;
    return () => {
      made.destroy();
      instance = null;
      editor = null;
    };
  });

  // A document that did not come from this editor replaces the one in it. No `update` event: this is
  // not an edit.
  $effect(() => {
    const incoming = key(content);
    if (instance && incoming !== agreed) {
      agreed = incoming;
      instance.commands.setContent(typeof content === "string" ? content : $state.snapshot(content), false);
    }
  });

  $effect(() => {
    // Not announced as an update either: switching it off or on edits nothing.
    instance?.setEditable(!readOnly, false);
  });

  $effect(() => {
    instance?.setOptions({ editorProps: { attributes } });
  });

  // The hint is read when the editor is drawn, so a new one needs a redraw.
  $effect(() => {
    void placeholder;
    if (instance) instance.view.dispatch(instance.state.tr);
  });
</script>

<div class="tln-rich-text" data-variant={variant}>
  <div class="tln-rich-text-scroll" bind:this={host}></div>
</div>

<style>
  .tln-rich-text {
    box-sizing: border-box;
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  /*
   * A field is a well, like every other thing that is typed into (looks.css: .tln-field-control),
   * and CodeEditor. A document that is written in a pane, not typed into a box, is the bare variant.
   */
  .tln-rich-text[data-variant="field"] {
    background: var(--tln-well);
    border-radius: var(--tln-radius);
    box-shadow: var(--tln-shadow-well);
  }

  /* The ring is on the host, outside the clip of its own overflow. */
  .tln-rich-text[data-variant="field"]:focus-within {
    outline: var(--tln-focus-ring);
    outline-offset: 0;
  }

  /*
   * The text scrolls here. It is a column that the text fills to the bottom, so that a click below
   * the last line still puts the caret in the document. The column of text is centred and never
   * wider than the measure (prose.css), the padding keeps it off the edges of a narrow pane.
   */
  .tln-rich-text-scroll {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: auto;
    padding: calc(var(--tln-space) * 4) calc(var(--tln-space) * 5);
  }

  .tln-rich-text-scroll :global(.ProseMirror) {
    flex: 1 0 auto;
    width: 100%;
    margin-inline: auto;
    /* The ring, where there is one, is the host's; and ProseMirror's own outline never shows. */
    outline: none;
  }
</style>
