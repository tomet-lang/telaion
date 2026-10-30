<script lang="ts">
  import { ConflictResolver, type TometServices } from "@telaion/tomet";
  import { Button, Field, Select } from "@telaion/ui";
  import { stubConflicts, stubResolve } from "./stub-tomet.ts";

  const original =
    '=[ Notes ]\n\nThe release is @conflict(a: "on Monday", b: "on Friday") for sure.\n\n@conflict(a: "Keep it short.", b: "Explain it at length, in two sentences.")\n';

  const modes = [
    { value: "sync", label: "Answers at once" },
    { value: "slow", label: "Answers after 500 ms" },
    { value: "failing", label: "Cannot resolve" },
  ];

  let mode = $state("sync");
  let content = $state(original);
  let backToEditor = $state(0);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const services = $derived<Pick<TometServices, "listConflicts" | "resolveConflict">>({
    listConflicts: async (source) => {
      if (mode === "slow") await sleep(500);
      return stubConflicts(source);
    },
    resolveConflict: async (source, index, side) => {
      if (mode === "slow") await sleep(500);
      if (mode === "failing") throw new Error("the engine is not available");
      return stubResolve(source, index, side);
    },
  });
</script>

<div class="demo">
  <div class="controls">
    <Field label="Engine of the test double">
      <Select bind:value={mode} options={modes} />
    </Field>
    <Button onclick={() => (content = original)}>Reset the document</Button>
    <span class="muted">back to the editor <span aria-label="back to editor">{backToEditor}</span> times</span>
  </div>
  <div class="frame">
    <ConflictResolver
      {content}
      {services}
      onResolve={(next) => (content = next)}
      onManualEdit={() => backToEditor++}
    />
  </div>
  <pre class="text" aria-label="document text">{content}</pre>
</div>

<style>
  .demo {
    display: grid;
    gap: calc(var(--tln-space) * 3);
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: calc(var(--tln-space) * 3);
  }

  .frame {
    max-height: calc(var(--tln-space) * 110);
    border: 1px solid var(--tln-border-strong);
    border-radius: var(--tln-radius);
    overflow: auto;
  }

  .text {
    margin: 0;
    padding: calc(var(--tln-space) * 3);
    font-family: var(--tln-font-mono);
    font-size: var(--tln-text-sm);
    background: var(--tln-bg-sunken);
    border: 1px solid var(--tln-border);
    border-radius: var(--tln-radius);
    white-space: pre-wrap;
  }

  .muted {
    color: var(--tln-fg-muted);
    font-size: var(--tln-text-sm);
  }
</style>
