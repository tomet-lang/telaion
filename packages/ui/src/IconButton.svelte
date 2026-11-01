<script lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";
  import Icon from "./Icon.svelte";
  import { mouseLight } from "./mouse-light.js";
  import "./looks.css";
  import type { IconData } from "./icon-data.js";

  type Props = Omit<HTMLButtonAttributes, "class" | "style" | "children" | "aria-label"> & {
    icon: IconData;
    /** What the button does. Required: there is no visible text. */
    label: string;
    variant?: "secondary" | "quiet";
  };

  let { icon, label, variant = "quiet", type = "button", ...rest }: Props = $props();
</script>

<button use:mouseLight class="tln-icon-btn tln-action" data-variant={variant} {type} aria-label={label} title={label} {...rest}>
  <Icon {icon} />
</button>

<style>
  /* How it looks is in looks.css, shared with Button. */
  .tln-icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: calc(var(--tln-space) * 1.5);
    font-size: var(--tln-text-md);
    line-height: 1;
  }
</style>
