<script lang="ts">
  import { CodeEditor, sourceEditingExtensions } from "@telaion/editor";
  import { Field, Select } from "@telaion/primitives";

  const choices = [
    { value: "none", label: "No extensions" },
    { value: "extras", label: "Folding, bracket matching, closing brackets, search" },
  ];

  let choice = $state("none");
  let content = $state("::meta{\n  id: a,\n}\n");
  const extensions = $derived(choice === "extras" ? sourceEditingExtensions : undefined);
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
  }
</style>
