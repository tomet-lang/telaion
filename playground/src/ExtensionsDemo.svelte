<script lang="ts">
  import { closeBrackets } from "@codemirror/autocomplete";
  import { bracketMatching, foldGutter } from "@codemirror/language";
  import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
  import { keymap } from "@codemirror/view";
  import { CodeEditor } from "@telaion/editor";
  import { Field, Select } from "@telaion/ui";

  const choices = [
    { value: "none", label: "No extensions" },
    { value: "extras", label: "Folding, bracket matching, closing brackets, search" },
  ];

  let choice = $state("none");
  let content = $state("::meta{\n  id: a,\n}\n");
  const extensions = $derived(
    choice === "extras"
      ? [
          foldGutter(),
          bracketMatching(),
          closeBrackets(),
          highlightSelectionMatches(),
          keymap.of(searchKeymap),
        ]
      : undefined,
  );
</script>

<div class="demo">
  <Field label="Extensions the application adds">
    <Select bind:value={choice} options={choices} />
  </Field>
  <div class="frame">
    <CodeEditor bind:content label="Source with extensions" {extensions} />
  </div>
</div>

<style>
  .demo {
    display: grid;
    gap: calc(var(--tln-space) * 3);
    max-width: calc(var(--tln-space) * 140);
  }

  .frame {
    height: calc(var(--tln-space) * 36);
    background: var(--tln-content);
    border-radius: var(--tln-radius);
    box-shadow: var(--tln-shadow-content);
    overflow: hidden;
  }
</style>
