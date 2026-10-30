<script lang="ts">
  import { closeBrackets } from "@codemirror/autocomplete";
  import { bracketMatching, foldGutter } from "@codemirror/language";
  import { CodeEditor } from "@telaion/editor";
  import { Field, Select } from "@telaion/ui";

  const choices = [
    { value: "none", label: "No extensions" },
    { value: "extras", label: "Folding, bracket matching, closing brackets" },
  ];

  let choice = $state("none");
  let content = $state("::meta{\n  id: a,\n}\n");
  const extensions = $derived(
    choice === "extras" ? [foldGutter(), bracketMatching(), closeBrackets()] : undefined,
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
    border: 1px solid var(--tln-border-strong);
    border-radius: var(--tln-radius);
    overflow: hidden;
  }
</style>
