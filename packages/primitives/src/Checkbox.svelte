<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLInputAttributes } from "svelte/elements";
  import { getFieldContext } from "./field-context.js";
  import Icon from "./Icon.svelte";
  import { Check, Minus } from "./icons.generated.js";
  import "./looks.css";

  type Props = Omit<
    HTMLInputAttributes,
    "class" | "style" | "type" | "value" | "checked" | "indeterminate" | "children"
  > & {
    checked?: boolean;
    /** Some of what it stands for is chosen, and some is not: shown as a dash. A click makes it checked or unchecked. */
    indeterminate?: boolean;
    /** What the box is for. A string, or a snippet for markup such as <code>. Without it, name the box with `aria-label`. */
    label?: string | Snippet;
    /** Marks the choice as wrong. Set automatically inside a Field that has an error. */
    invalid?: boolean;
  };

  let {
    checked = $bindable(false),
    indeterminate = $bindable(false),
    label,
    invalid = false,
    disabled = false,
    ...rest
  }: Props = $props();

  const field = getFieldContext();
</script>

<label class="tln-checkbox tln-mark" data-disabled={disabled ? "true" : undefined}>
  <input
    class="tln-mark-input"
    {...rest}
    type="checkbox"
    {disabled}
    id={field?.id ?? rest.id}
    aria-describedby={field?.describedby ?? rest["aria-describedby"]}
    aria-invalid={invalid || field?.invalid || undefined}
    bind:checked
    bind:indeterminate
  />
  <span class="tln-well tln-mark-box" aria-hidden="true">
    <span class="tln-mark-glyph" data-for="checked"><Icon icon={Check} /></span>
    <span class="tln-mark-glyph" data-for="indeterminate"><Icon icon={Minus} /></span>
  </span>
  {#if label}
    <span>{#if typeof label === "string"}{label}{:else}{@render label()}{/if}</span>
  {/if}
</label>

<style>
  /* The two marks lie on top of each other in the middle of the box. */
  .tln-checkbox :global(.tln-mark-box) {
    grid-template-areas: "mark";
  }
  .tln-mark-glyph {
    display: grid;
    grid-area: mark;
    place-items: center;
  }
</style>
