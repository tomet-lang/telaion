<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";
  import { getFieldContext } from "./field-context.js";
  import "./looks.css";

  type Props = Omit<HTMLInputAttributes, "class" | "style" | "type" | "value" | "checked" | "indeterminate" | "children"> & {
    checked?: boolean;
    /** What it switches. A string, or a snippet for markup. Without it, name the switch with `aria-label`. */
    label?: string | Snippet;
    /** Marks the setting as wrong. Set automatically inside a Field that has an error. */
    invalid?: boolean;
  };

  let { checked = $bindable(false), label, invalid = false, disabled = false, ...rest }: Props = $props();

  const field = getFieldContext();
</script>

<label class="tln-switch tln-mark" data-disabled={disabled ? "true" : undefined}>
  <input
    class="tln-mark-input"
    {...rest}
    type="checkbox"
    role="switch"
    {disabled}
    id={field?.id ?? rest.id}
    aria-describedby={field?.describedby ?? rest["aria-describedby"]}
    aria-invalid={invalid || field?.invalid || undefined}
    bind:checked
  />
  <span class="tln-well tln-switch-track" aria-hidden="true">
    <span class="tln-switch-thumb"></span>
  </span>
  {#if label}
    <span>{#if typeof label === "string"}{label}{:else}{@render label()}{/if}</span>
  {/if}
</label>

<style>
  .tln-switch {
    --tln-track-height: calc(var(--tln-space) * 6);
    --tln-track-width: calc(var(--tln-space) * 11);
    --tln-thumb-gap: var(--tln-space);
    --tln-thumb-size: calc(var(--tln-track-height) - var(--tln-thumb-gap) * 2);
  }

  /* The track is a well. The thumb is an action standing in it: it is what moves, and what is pressed. */
  .tln-switch-track {
    position: relative;
    flex: none;
    box-sizing: border-box;
    width: var(--tln-track-width);
    height: var(--tln-track-height);
    border-radius: min(var(--tln-radius), calc(var(--tln-track-height) / 2));
  }

  .tln-switch-thumb {
    position: absolute;
    top: var(--tln-thumb-gap);
    left: var(--tln-thumb-gap);
    width: var(--tln-thumb-size);
    height: var(--tln-thumb-size);
    border-radius: min(var(--tln-radius), calc(var(--tln-thumb-size) / 2));
    background: var(--tln-action);
    box-shadow: var(--tln-shadow-action);
    transition:
      transform var(--tln-transition),
      background-color var(--tln-transition),
      box-shadow var(--tln-track);
  }

  .tln-mark-input:enabled:hover + .tln-switch-track .tln-switch-thumb {
    box-shadow: var(--tln-shadow-action-hover);
    background: var(--tln-action-hover);
  }
  .tln-mark-input:enabled:active + .tln-switch-track .tln-switch-thumb {
    box-shadow: var(--tln-shadow-action-active);
  }

  /* On: the thumb moves across and takes the accent, lit by a lighter shade of its own fill. */
  .tln-mark-input:checked + .tln-switch-track .tln-switch-thumb {
    transform: translateX(calc(var(--tln-track-width) - var(--tln-thumb-size) - var(--tln-thumb-gap) * 2));
    background: var(--tln-accent);
    --tln-light: var(--tln-light-on-accent);
    --tln-light-sub: var(--tln-light-on-accent-sub);
  }
  .tln-mark-input:checked:enabled:hover + .tln-switch-track .tln-switch-thumb {
    background: var(--tln-accent-hover);
  }

  /* Disabled: the thumb steps back down onto the track, as every disabled action does. */
  .tln-mark-input:disabled + .tln-switch-track .tln-switch-thumb {
    background: var(--tln-tint);
    box-shadow: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .tln-switch-thumb {
      transition: none;
    }
  }
</style>
