<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { mouseLight } from "./mouse-light.js";
  import "./looks.css";

  type Props = Omit<HTMLButtonAttributes, "class" | "style" | "children"> & {
    /**
     * primary: the one main action. danger: destructive, outlined. danger-fill: destructive
     * when the destructive answer is the main action, as in a confirmation. quiet: no frame.
     */
    variant?: "primary" | "secondary" | "danger" | "danger-fill" | "quiet";
    children: Snippet;
  };

  let { variant = "secondary", type = "button", children, ...rest }: Props = $props();
</script>

<button use:mouseLight class="tln-btn tln-action" data-variant={variant} {type} {...rest}>
  {@render children()}
</button>

<style>
  /* How it looks (frame, shadow, variants, focus, disabled) is in looks.css, shared with IconButton. */
  .tln-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: calc(var(--tln-space) * 2);
    padding: calc(var(--tln-space) * 1.5) calc(var(--tln-space) * 3);
    font: inherit;
    font-size: var(--tln-text-sm);
    line-height: var(--tln-leading);
    /* A label stays on one line; a row of buttons wraps between them instead. */
    white-space: nowrap;
  }
</style>
