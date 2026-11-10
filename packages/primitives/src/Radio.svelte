<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";
  import { getFieldContext } from "./field-context.js";
  import "./looks.css";

  type Props = Omit<HTMLInputAttributes, "class" | "style" | "type" | "value" | "name" | "group" | "checked" | "children"> & {
    /** What the group's `group` becomes when this one is chosen. */
    value: string;
    /** The group this belongs to. Radios with the same name are one stop in the Tab order and the arrow keys move between them. */
    name: string;
    /** The value of the chosen radio of the group. Bind the same variable on every radio of it. */
    group?: string;
    /** What the choice is. A string, or a snippet for markup. Without it, name the radio with `aria-label`. */
    label?: string | Snippet;
  };

  let { value, name, group = $bindable(""), label, disabled = false, ...rest }: Props = $props();

  const field = getFieldContext();
</script>

<label class="tln-radio tln-mark" data-disabled={disabled ? "true" : undefined}>
  <input
    class="tln-mark-input"
    {...rest}
    type="radio"
    {name}
    {value}
    {disabled}
    id={field?.id ?? rest.id}
    aria-describedby={field?.describedby ?? rest["aria-describedby"]}
    bind:group
  />
  <span class="tln-well tln-mark-box" aria-hidden="true">
    <span class="tln-radio-dot tln-mark-glyph" data-for="checked"></span>
  </span>
  {#if label}
    <span>{#if typeof label === "string"}{label}{:else}{@render label()}{/if}</span>
  {/if}
</label>

<style>
  /* The mark of a chosen radio: a dot, half the box, as round as the radius lets it be. */
  .tln-radio-dot {
    width: 50%;
    height: 50%;
    border-radius: min(var(--tln-radius), calc(var(--tln-mark-size) / 4));
    background: currentColor;
  }
</style>
