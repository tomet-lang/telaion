<!-- Generated from tmtroot/packages/editor.tmt. Edit that, then `tomet export .`. -->

# @telaion/editor

A source editor for Svelte 5, built on CodeMirror 6, with a document session and a storage adapter, and a rich-text editor built on Tiptap. It knows nothing about Tomet; the language is a slot.

## Install

```bash
pnpm add @telaion/editor
```

Svelte 5 is a peer dependency. Also import the design tokens of `@telaion/theme` once, for example `import "@telaion/theme/tokens.css"`.

The rich-text editor needs Tiptap, which is an optional peer dependency, so that an application that only edits source does not install it: `pnpm add @tiptap/core @tiptap/pm @tiptap/starter-kit`, in version 2.11 or later of the 2.x line. The editor and every Tiptap extension must share one copy of `@tiptap/core`.

## Use

The application says where documents live, by writing a `DocumentAdapter`:

```ts
import type { DocumentAdapter } from "@telaion/editor";

const adapter: DocumentAdapter = {
  async load(path) {
    return { content: await readFile(path), rev: await currentRevision(path) };
  },
  async save(path, content, base) {
    if (base !== (await currentRevision(path))) {
      return { ok: false, conflict: { remote: await readFile(path) } };
    }
    await writeFile(path, content);
    return { ok: true, rev: await currentRevision(path) };
  },
};
```

Then it shows a document with a session:

```svelte
<script>
  import { DocumentSession, Editor } from "@telaion/editor";
  import { onMount } from "svelte";

  const session = new DocumentSession(adapter, "notes/idea.tmt");
  onMount(() => session.load());
</script>

<Editor {session} />
```

## What is in it

- `DocumentSession` -- one document being edited: its text, whether it is unsaved (`dirty`), the status, the last error, and a conflict when a save found a newer stored version. It has no view.
- `CodeEditor` -- the text area, on CodeMirror 6. It is kept minimal: line numbers, history, line wrapping. Its `variant` is `field` (a well, as a text field is) or `bare` (the editor is the pane: no surface, radius, shadow or ring). The preset `sourceEditingExtensions`, passed as `extensions`, adds what a person editing source expects: a fold gutter, bracket matching and closing, search and a highlight for matches of the selection. The `language` prop takes a CodeMirror extension for syntax, and `extensions` takes any more an application wants, such as code folding, bracket matching or search. The search panel, bracket highlights, fold markers and tooltips of CodeMirror are drawn in the design tokens too, so they follow the light and dark switch.
- `Editor` -- a session and a `CodeEditor` with a path, a status badge, a Save button, and the alerts for errors and conflicts.

## Rich text

`RichText` is a Tiptap editor. It has its own entry, so that Tiptap is only loaded by an application that uses it:

```svelte
<script>
  import { RichText } from "@telaion/editor/rich-text";
  import Link from "@tiptap/extension-link";

  let content = $state({ type: "doc", content: [{ type: "paragraph" }] });
  let editor = $state(null);
</script>

<button onclick={() => editor?.chain().focus().toggleBold().run()}>Bold</button>
<RichText bind:content bind:editor label="Notes" placeholder="Write here" extensions={[Link]} />
```

- `content` is bindable and is either the JSON of ProseMirror (the default) or an HTML string. `format="html"` makes the edits come back as HTML. An edit that returns through the binding is not applied again, and a value that is not the editor's own replaces the document without calling `onChange`.
- `editor` is bindable and holds the Tiptap `Editor` once it exists, to run commands on.
- `variant` is `field` (a well) or `bare` (the editor is the pane), as in `CodeEditor`. Either fills the height of its parent, which needs a height of its own, and scrolls the text inside it.
- `extensions` takes more Tiptap extensions and `starterKit` its options, or `false` to leave it out. Both are read once. The StarterKit has no links: bring `@tiptap/extension-link`.
- `readOnly`, `label` (the accessible name), `placeholder` and `onChange` are what they are in `CodeEditor`.
- The look of the text is `.tln-prose`, in `@telaion/editor/prose.css`, written in tokens only. It can be put on any element that holds HTML, to show a document the way it is edited.

## Behavior

- A save writes the text as it was when the save started. Text typed while it runs stays unsaved.
- A conflict never overwrites. The edit is kept and the session reports the conflict.
- Tab leaves the editor for the next control; it does not insert indentation.

## License

Licensed under either of MIT or Apache-2.0, at your option.

