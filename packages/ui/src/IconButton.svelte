<script lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";
  import Icon from "./Icon.svelte";
  import type { IconData } from "./icon-data.js";

  type Props = Omit<HTMLButtonAttributes, "class" | "style" | "children" | "aria-label"> & {
    icon: IconData;
    /** What the button does. Required: there is no visible text. */
    label: string;
    variant?: "secondary" | "quiet";
  };

  let { icon, label, variant = "quiet", type = "button", ...rest }: Props = $props();
</script>

<button class="tln-icon-btn" data-variant={variant} {type} aria-label={label} title={label} {...rest}>
  <Icon {icon} />
</button>

<style>
  .tln-icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: calc(var(--tln-space) * 1.5);
    font-size: var(--tln-text-md);
    line-height: 1;
    border: 1px solid transparent;
    border-radius: var(--tln-radius);
    cursor: pointer;
  }

  .tln-icon-btn:focus-visible {
    outline: 2px solid var(--tln-accent);
    outline-offset: 2px;
  }

  .tln-icon-btn[data-variant="secondary"] {
    background: var(--tln-bg);
    border-color: var(--tln-border-strong);
    color: var(--tln-fg);
  }
  .tln-icon-btn[data-variant="secondary"]:hover {
    background: var(--tln-bg-subtle);
  }

  .tln-icon-btn[data-variant="quiet"] {
    background: transparent;
    color: var(--tln-fg-muted);
  }
  .tln-icon-btn[data-variant="quiet"]:hover {
    background: var(--tln-bg-sunken);
    color: var(--tln-fg);
  }

  .tln-icon-btn:disabled {
    background: transparent;
    border-color: transparent;
    color: var(--tln-fg-muted);
    cursor: not-allowed;
  }
</style>
