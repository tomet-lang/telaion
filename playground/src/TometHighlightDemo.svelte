<script lang="ts">
  import { CodeEditor } from "@telaion/editor";
  import { tometHighlighting, type HighlightSpan } from "@telaion/tomet";
  import { Button, Field, Select } from "@telaion/primitives";
  import {
    bytesHighlight,
    failingHighlight,
    slowHighlight,
    stubSpans,
    type Mode,
  } from "./stub-tomet.js";

  const modes = [
    { value: "sync", label: "Answers at once" },
    { value: "bytes", label: "Answers in UTF-8 bytes" },
    { value: "slow", label: "Answers after 600 ms" },
    { value: "manual", label: "Answers when told to" },
    { value: "failing", label: "Fails" },
  ];

  let mode = $state<Mode>("sync");
  let content = $state('=[ 見出し ]\n\n本文 // 注釈です\n@callout(kind: "note")\n');
  let errors = $state(0);
  let pending = $state<(() => void)[]>([]);

  // In the manual mode every request waits here until a button answers it.
  function manualHighlight(source: string): Promise<HighlightSpan[]> {
    return new Promise((resolve) => {
      pending.push(() => resolve(stubSpans(source)));
    });
  }

  const highlight = $derived(
    {
      sync: stubSpans,
      bytes: bytesHighlight,
      slow: slowHighlight,
      manual: manualHighlight,
      failing: failingHighlight,
    }[mode],
  );
  const language = $derived(tometHighlighting({ highlight }, { onError: () => errors++ }));
</script>

<div class="demo">
  <div class="controls">
    <Field label="Engine of the test double">
      <Select bind:value={mode} options={modes} />
    </Field>
    {#if mode === "manual"}
      <Button onclick={() => pending.shift()?.()}>Answer the oldest</Button>
      <Button onclick={() => pending.pop()?.()}>Answer the newest</Button>
    {/if}
    <span class="muted">
      waiting <span aria-label="pending answers">{pending.length}</span> · failed
      <span aria-label="highlight errors">{errors}</span>
    </span>
  </div>
  <div class="frame">
    <CodeEditor bind:content label="Highlighted source" {language} />
  </div>
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
    height: calc(var(--tln-space) * 48);
    background: var(--tln-content);
    border-radius: var(--tln-radius);
    box-shadow: var(--tln-shadow-content);
    overflow: hidden;
  }

  .muted {
    color: var(--tln-fg-muted);
    font-size: var(--tln-text-sm);
  }
</style>
