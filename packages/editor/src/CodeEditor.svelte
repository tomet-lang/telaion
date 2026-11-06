<script lang="ts">
  import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
  import { Annotation, Compartment, EditorState, type Extension } from "@codemirror/state";
  import {
    drawSelection,
    EditorView,
    highlightActiveLineGutter,
    keymap,
    lineNumbers,
  } from "@codemirror/view";
  import { onMount } from "svelte";
  import { telaionTheme } from "./theme.js";

  let {
    content = $bindable(""),
    variant = "field",
    readOnly = false,
    label = "Document source",
    language,
    extensions,
    onChange,
    onSave,
  }: {
    content?: string;
    /**
     * How the editor sits in its surroundings. Either way it fills the height of its parent,
     * which therefore needs a height of its own, and the editor scrolls itself.
     *
     * - `"field"` (the default): a text field. A well, cut into the surface it is on, with a
     *   focus ring while it is in use. Use it where the editor is one control among others.
     * - `"bare"`: the editor is the pane. It draws no surface, radius, shadow or ring: it is text
     *   on whatever its parent paints. Focus shows in the caret, the selection and the line number of
     *   the active line, which are only drawn while the editor is in use; a pane that wants more can style
     *   itself with `:focus-within`.
     */
    variant?: "field" | "bare";
    readOnly?: boolean;
    /** The accessible name of the text area. */
    label?: string;
    /** Syntax support, as a CodeMirror extension. @telaion/tomet supplies the one for Tomet. */
    language?: Extension;
    /**
     * More CodeMirror extensions, for what an application wants beyond the minimal editor: code
     * folding, bracket matching, search, and so on. The editor itself stays small.
     */
    extensions?: Extension;
    /** Called when a person edits. Not called when `content` is replaced from outside. */
    onChange?: (content: string) => void;
    /** Called on Ctrl+S or Cmd+S. */
    onSave?: () => void;
  } = $props();

  // Marks a change that came from the `content` prop, so it is not reported back as an edit.
  const fromOutside = Annotation.define<boolean>();
  const readOnlyConfig = new Compartment();
  const languageConfig = new Compartment();
  const extensionsConfig = new Compartment();

  let host: HTMLDivElement;
  let view: EditorView | undefined;

  onMount(() => {
    view = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: content,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          // No highlightActiveLine: a band over the line would also hide the selection on it, which
          // CodeMirror draws behind the text. The line number of the active line is marked instead.
          drawSelection(),
          history(),
          // No indentWithTab: Tab must still leave the editor for the next control.
          keymap.of([
            {
              key: "Mod-s",
              preventDefault: true,
              run: () => {
                onSave?.();
                return true;
              },
            },
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({ "aria-label": label }),
          telaionTheme,
          readOnlyConfig.of(EditorState.readOnly.of(readOnly)),
          languageConfig.of(language ?? []),
          extensionsConfig.of(extensions ?? []),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) return;
            const next = update.state.doc.toString();
            content = next;
            if (!update.transactions.some((tr) => tr.annotation(fromOutside))) onChange?.(next);
          }),
        ],
      }),
    });
    return () => view?.destroy();
  });

  $effect(() => {
    if (view && content !== view.state.doc.toString()) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: content },
        annotations: fromOutside.of(true),
      });
    }
  });

  $effect(() => {
    view?.dispatch({ effects: readOnlyConfig.reconfigure(EditorState.readOnly.of(readOnly)) });
  });

  $effect(() => {
    view?.dispatch({ effects: languageConfig.reconfigure(language ?? []) });
  });

  $effect(() => {
    view?.dispatch({ effects: extensionsConfig.reconfigure(extensions ?? []) });
  });
</script>

<div class="tln-code-editor" data-variant={variant} bind:this={host}></div>

<style>
  .tln-code-editor {
    box-sizing: border-box;
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  /* A field is a well, like every other thing that is typed into (looks.css: .tln-field-control). */
  .tln-code-editor[data-variant="field"] {
    background: var(--tln-well);
    border-radius: var(--tln-radius);
    box-shadow: var(--tln-shadow-well);
  }

  /* The ring is on the host, outside the clip of its own overflow, and stays while focus is in
     the editor's search panel too. */
  .tln-code-editor[data-variant="field"]:focus-within {
    outline: var(--tln-focus-ring);
    outline-offset: 0;
  }
</style>
