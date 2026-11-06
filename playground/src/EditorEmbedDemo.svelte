<script lang="ts">
  import { autocompletion, type CompletionContext } from "@codemirror/autocomplete";
  import { foldService } from "@codemirror/language";
  import { CodeEditor, sourceEditingExtensions } from "@telaion/editor";
  import { Badge } from "@telaion/primitives";

  const sample = "::meta{\n  id: a,\n  title: (Field versus pane),\n}\n\nA line of text to select.\nA line of text to select.\n";

  let fieldContent = $state(sample);
  let paneContent = $state(sample);
  let fieldChanges = $state(0);
  let paneChanges = $state(0);
  let paneSaves = $state(0);
  let paneFocused = $state(false);

  // A few words, to have a completion list to look at.
  function words(context: CompletionContext) {
    const word = context.matchBefore(/\w*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;
    return {
      from: word.from,
      options: [
        { label: "meta", type: "keyword", detail: "block" },
        { label: "metadata", type: "keyword", detail: "block" },
        { label: "title", type: "property" },
        { label: "text", type: "variable" },
      ],
    };
  }

  // Without a language there is nothing to fold; a block opened by a "{" at the end of a line folds
  // to its closing "}", so that the fold gutter has something to show.
  const blocks = foldService.of((state, from) => {
    const line = state.doc.lineAt(from);
    if (!line.text.trimEnd().endsWith("{")) return null;
    for (let n = line.number + 1; n <= state.doc.lines; n++) {
      const next = state.doc.line(n);
      if (next.text.startsWith("}")) return { from: line.to, to: next.from - 1 };
    }
    return null;
  });

  const extensions = [sourceEditingExtensions, blocks, autocompletion({ override: [words] })];
</script>

<div class="demo">
  <div class="cell">
    <p class="caption">
      variant="field" (the default): a well with a focus ring, one control among others.
      <Badge tone="neutral">changes <span aria-label="field changes">{fieldChanges}</span></Badge>
    </p>
    <div class="slot">
      <CodeEditor
        bind:content={fieldContent}
        label="Field editor"
        {extensions}
        onChange={() => fieldChanges++}
      />
    </div>
  </div>

  <div class="cell">
    <p class="caption">
      variant="bare": the editor is the pane. Focus shows in caret, selection and active line number.
      <Badge tone="neutral">changes <span aria-label="pane changes">{paneChanges}</span></Badge>
      <Badge tone="neutral">saves <span aria-label="pane saves">{paneSaves}</span></Badge>
      <Badge tone={paneFocused ? "accent" : "neutral"}>pane focus-within: {paneFocused ? "yes" : "no"}</Badge>
    </p>
    <!-- The pane: content that the editor fills. It owns the surface; the editor owns the scrolling. -->
    <div
      class="pane"
      role="group"
      aria-label="Pane"
      onfocusin={() => (paneFocused = true)}
      onfocusout={() => (paneFocused = false)}
    >
      <CodeEditor
        variant="bare"
        bind:content={paneContent}
        label="Bare editor"
        {extensions}
        onChange={() => paneChanges++}
        onSave={() => paneSaves++}
      />
    </div>
  </div>
</div>

<style>
  .demo {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(calc(var(--tln-space) * 80), 1fr));
    gap: calc(var(--tln-space) * 4);
  }

  .cell {
    display: grid;
    grid-template-rows: auto calc(var(--tln-space) * 44);
    gap: calc(var(--tln-space) * 2);
    min-width: 0;
  }

  .caption {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: calc(var(--tln-space) * 2);
    font-size: var(--tln-text-xs);
    color: var(--tln-fg-muted);
  }

  .slot,
  .pane {
    min-height: 0;
  }

  .pane {
    background: var(--tln-content);
    border-radius: var(--tln-radius);
    box-shadow: var(--tln-shadow-content);
    overflow: hidden;
  }
</style>
