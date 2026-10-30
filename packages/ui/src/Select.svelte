<script lang="ts">
  import type { HTMLSelectAttributes } from "svelte/elements";
  import { getFieldContext } from "./field-context.ts";
  import Icon from "./Icon.svelte";
  import { ChevronDown } from "./icons.generated.ts";

  type Props = Omit<HTMLSelectAttributes, "class" | "style" | "value" | "children"> & {
    value?: string;
    options: { value: string; label: string }[];
    /** Marks the value as wrong. Set automatically inside a Field that has an error. */
    invalid?: boolean;
  };

  let { value = $bindable(""), options, invalid = false, ...rest }: Props = $props();

  const field = getFieldContext();
</script>

<span class="tln-select">
  <select
    class="tln-select-control"
    {...rest}
    id={field?.id ?? rest.id}
    aria-describedby={field?.describedby ?? rest["aria-describedby"]}
    aria-invalid={invalid || field?.invalid || undefined}
    bind:value
  >
    {#each options as option (option.value)}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
  <span class="tln-select-chevron"><Icon icon={ChevronDown} /></span>
</span>

<style>
  .tln-select {
    position: relative;
    display: block;
  }

  .tln-select-control {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    padding: calc(var(--tln-space) * 1.5) calc(var(--tln-space) * 8) calc(var(--tln-space) * 1.5)
      calc(var(--tln-space) * 3);
    font: inherit;
    font-size: var(--tln-text-sm);
    line-height: var(--tln-leading);
    color: var(--tln-fg);
    background: var(--tln-bg);
    border: 1px solid var(--tln-border-strong);
    border-radius: var(--tln-radius);
    appearance: none;
    cursor: pointer;
  }

  .tln-select-control:focus-visible {
    outline: 2px solid var(--tln-accent);
    outline-offset: 0;
    border-color: var(--tln-accent);
  }

  .tln-select-control[aria-invalid="true"] {
    border-color: var(--tln-danger);
  }

  .tln-select-control:disabled {
    background: var(--tln-bg-sunken);
    border-color: var(--tln-border);
    color: var(--tln-fg-muted);
    cursor: not-allowed;
  }

  /* The arrow is drawn by us so it follows the theme; clicks pass through to the select. */
  .tln-select-chevron {
    position: absolute;
    top: 50%;
    right: calc(var(--tln-space) * 3);
    display: inline-flex;
    transform: translateY(-50%);
    color: var(--tln-fg-muted);
    pointer-events: none;
  }
</style>
