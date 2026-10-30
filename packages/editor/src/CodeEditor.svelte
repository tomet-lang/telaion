<script lang="ts">
  import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
  import { Annotation, Compartment, EditorState, type Extension } from "@codemirror/state";
  import {
    drawSelection,
    EditorView,
    highlightActiveLine,
    highlightActiveLineGutter,
    keymap,
    lineNumbers,
  } from "@codemirror/view";
  import { onMount } from "svelte";
  import { telaionTheme } from "./theme.ts";

  let {
    content = $bindable(""),
    readOnly = false,
    label = "Document source",
    language,
    onChange,
    onSave,
  }: {
    content?: string;
    readOnly?: boolean;
    /** The accessible name of the text area. */
    label?: string;
    /** Syntax support, as a CodeMirror extension. @telaion/tomet supplies the one for Tomet. */
    language?: Extension;
    /** Called when a person edits. Not called when `content` is replaced from outside. */
    onChange?: (content: string) => void;
    /** Called on Ctrl+S or Cmd+S. */
    onSave?: () => void;
  } = $props();

  // Marks a change that came from the `content` prop, so it is not reported back as an edit.
  const fromOutside = Annotation.define<boolean>();
  const readOnlyConfig = new Compartment();
  const languageConfig = new Compartment();

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
          highlightActiveLine(),
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
</script>

<div class="tln-code-editor" bind:this={host}></div>

<style>
  .tln-code-editor {
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }
</style>
