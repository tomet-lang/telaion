<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import { getFieldContext } from "./field-context.js";
  import "./looks.css";

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
  class="tln-input tln-field-control"
  {...rest}
  {type}
  id={field?.id ?? rest.id}
  aria-describedby={field?.describedby ?? rest["aria-describedby"]}
  aria-invalid={invalid || field?.invalid || undefined}
  bind:value
/>
