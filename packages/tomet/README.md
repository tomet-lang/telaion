<!-- Generated from tmtroot/packages/tomet.tmt. Edit that, then `tomet export .`. -->

# @telaion/tomet

The Tomet-specific parts of a Telaion editor: syntax highlighting, conflict resolution, and Tiptap extensions for Tomet's blocks. It carries no Tomet engine. The application passes one in, so it is never loaded twice.

## Install

```bash
pnpm add @telaion/tomet
```

Svelte 5, `@codemirror/state` and `@codemirror/view` are peer dependencies. `@tiptap/core` and `@tiptap/pm` are optional ones, for the rich-text extensions only. It uses `@telaion/primitives` and `@telaion/editor`.

## The engine comes from the application

An application already has a Tomet engine, as WebAssembly or as Rust. It describes that engine to Telaion with `TometServices`:

```ts
import type { TometServices } from "@telaion/tomet";

const services: TometServices = {
  highlight: (source) => engine.highlight(source),
  listConflicts: (source) => engine.listConflicts(source),
  resolveConflict: (source, index, side) => engine.resolveConflict(source, index, side),
};
```

Every method may answer at once or later (return a promise). Offsets count UTF-16 code units, as CodeMirror does. An engine that counts bytes passes its spans through `utf8ToUtf16Spans`.

## Highlighting

```svelte
<script>
  import { CodeEditor } from "@telaion/editor";
  import { tometHighlighting } from "@telaion/tomet";

  let content = $state("");
  const language = tometHighlighting(services, { onError: console.warn });
</script>

<CodeEditor bind:content {language} />
```

The extension asks again after every edit. An answer for text that has since changed is dropped. If the engine fails, the last good colors stay and `onError` is told. The colors are the design tokens of `@telaion/primitives`.

## Conflicts

A document may hold `@conflict` markers, left by a merge that could not combine two edits. `ConflictResolver` lists them and replaces them one at a time:

```svelte
<script>
  import { ConflictResolver } from "@telaion/tomet";
</script>

<ConflictResolver {content} {services} onResolve={(next) => (content = next)} />
```

## Rich text

`@telaion/tomet/rich-text` has Tiptap extensions for `RichText` of `@telaion/editor`, or for any Tiptap editor. They hold no engine: turning a `.tmt` source into ProseMirror JSON and back is the application's.

```svelte
<script>
  import { RichText } from "@telaion/editor/rich-text";
  import { Callout, HeadingMarkers } from "@telaion/tomet/rich-text";
</script>

<RichText bind:content bind:editor extensions={[Callout, HeadingMarkers]} />
```

- `Callout` is the node `callout`, with the attribute `type` (`note`, `tip`, `warning`, `danger`), holding blocks, as the engine writes a `::{callout(note)}` block into ProseMirror JSON. It is drawn in the tone of its kind, with the kind written on it. `setCallout({ type })`, `toggleCallout({ type })` and `unsetCallout()` are its commands.
- `HeadingMarkers` draws `=[ title ]=`, `==[ title ]==` and `===[ title ]===` around headings. They are not text of the document. `editor.commands.setHeadingMarkers(false)` and `toggleHeadingMarkers()` switch them at any time; the option `shown` is for the start.

## License

Licensed under either of MIT or Apache-2.0, at your option.

