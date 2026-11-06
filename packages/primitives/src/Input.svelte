<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import { getFieldContext } from "./field-context.js";
  import "./looks.css";

  // `size` is the native character width of an input; here it is the compact option, so the native one is not offered.
  type Props = Omit<HTMLInputAttributes, "class" | "style" | "value" | "type" | "size" | "children"> & {
    value?: string;
    type?: "text" | "password" | "search";
    /** Marks the value as wrong. Set automatically inside a Field that has an error. */
    invalid?: boolean;
    /** Monospace, for what is read character by character: a path, a token, an identifier. */
    mono?: boolean;
    /** sm: compact, for a dense panel such as an inspector. */
    size?: "md" | "sm";
  };

  let {
    value = $bindable(""),
    type = "text",
    invalid = false,
    mono = false,
    size = "md",
    ...rest
  }: Props = $props();

  const field = getFieldContext();
</script>

<input
  class="tln-input tln-field-control"
  data-mono={mono ? "true" : undefined}
  data-size={size}
  {...rest}
  {type}
  id={field?.id ?? rest.id}
  aria-describedby={field?.describedby ?? rest["aria-describedby"]}
  aria-invalid={invalid || field?.invalid || undefined}
  bind:value
/>

<style>
  /* How a field looks is in looks.css, shared with Select. These two options are only Input's. */
  .tln-input[data-mono="true"] {
    font-family: var(--tln-font-mono);
  }

  /* One step of padding and type smaller, as a compact button would be. */
  .tln-input[data-size="sm"] {
    padding: var(--tln-space) calc(var(--tln-space) * 2);
    font-size: var(--tln-text-xs);
  }
</style>
