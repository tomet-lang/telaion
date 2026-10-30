<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import { getFieldContext } from "./field-context.ts";

  type Props = Omit<HTMLInputAttributes, "class" | "style" | "value" | "type" | "children"> & {
    value?: string;
    type?: "text" | "password" | "search";
    /** Marks the value as wrong. Set automatically inside a Field that has an error. */
    invalid?: boolean;
  };

  let { value = $bindable(""), type = "text", invalid = false, ...rest }: Props = $props();

  const field = getFieldContext();
</script>

<input
  class="tln-input"
  {...rest}
  {type}
  id={field?.id ?? rest.id}
  aria-describedby={field?.describedby ?? rest["aria-describedby"]}
  aria-invalid={invalid || field?.invalid || undefined}
  bind:value
/>

<style>
  .tln-input {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    padding: calc(var(--tln-space) * 1.5) calc(var(--tln-space) * 3);
    font: inherit;
    font-size: var(--tln-text-sm);
    line-height: var(--tln-leading);
    background: var(--tln-bg);
    color: var(--tln-fg);
    border: 1px solid var(--tln-border-strong);
    border-radius: var(--tln-radius);
  }

  .tln-input::placeholder {
    color: var(--tln-fg-muted);
  }

  .tln-input:focus-visible {
    outline: 2px solid var(--tln-accent);
    outline-offset: 0;
    border-color: var(--tln-accent);
  }

  .tln-input[aria-invalid="true"] {
    border-color: var(--tln-danger);
  }
  .tln-input[aria-invalid="true"]:focus-visible {
    outline-color: var(--tln-danger);
  }

  .tln-input:disabled {
    background: var(--tln-bg-sunken);
    border-color: var(--tln-border);
    color: var(--tln-fg-muted);
    cursor: not-allowed;
  }
</style>
