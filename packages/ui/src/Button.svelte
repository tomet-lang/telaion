<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  type Props = Omit<HTMLButtonAttributes, "class" | "style" | "children"> & {
    /** primary: the one main action. danger: destructive. quiet: toolbar-like, no frame. */
    variant?: "primary" | "secondary" | "danger" | "quiet";
    children: Snippet;
  };

  let { variant = "secondary", type = "button", children, ...rest }: Props = $props();
</script>

<button class="tln-btn" data-variant={variant} {type} {...rest}>
  {@render children()}
</button>

<style>
  .tln-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: calc(var(--tln-space) * 2);
    padding: calc(var(--tln-space) * 1.5) calc(var(--tln-space) * 3);
    font: inherit;
    font-size: var(--tln-text-sm);
    line-height: var(--tln-leading);
    border: 1px solid transparent;
    border-radius: var(--tln-radius);
    cursor: pointer;
  }

  .tln-btn:focus-visible {
    outline: 2px solid var(--tln-accent);
    outline-offset: 2px;
  }

  .tln-btn[data-variant="primary"] {
    background: var(--tln-accent);
    border-color: var(--tln-accent);
    color: var(--tln-accent-fg);
  }
  .tln-btn[data-variant="primary"]:hover {
    background: var(--tln-accent-hover);
    border-color: var(--tln-accent-hover);
  }

  .tln-btn[data-variant="secondary"] {
    background: var(--tln-bg);
    border-color: var(--tln-border-strong);
    color: var(--tln-fg);
  }
  .tln-btn[data-variant="secondary"]:hover {
    background: var(--tln-bg-subtle);
  }

  .tln-btn[data-variant="danger"] {
    background: var(--tln-bg);
    border-color: var(--tln-danger);
    color: var(--tln-danger);
  }
  .tln-btn[data-variant="danger"]:hover {
    background: var(--tln-danger-soft);
  }

  .tln-btn[data-variant="quiet"] {
    background: transparent;
    color: var(--tln-fg-muted);
  }
  .tln-btn[data-variant="quiet"]:hover {
    background: var(--tln-bg-sunken);
    color: var(--tln-fg);
  }

  /* One disabled look for every variant, built from existing tokens only. */
  .tln-btn:disabled {
    background: var(--tln-bg-sunken);
    border-color: var(--tln-border);
    color: var(--tln-fg-muted);
    cursor: not-allowed;
  }
  .tln-btn[data-variant="quiet"]:disabled {
    background: transparent;
    border-color: transparent;
  }
</style>
