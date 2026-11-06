<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import Icon from "./Icon.svelte";
  import "./looks.css";
  import type { IconData } from "./icon-data.js";

  type Props = Omit<HTMLButtonAttributes, "class" | "style" | "children"> & {
    /** md is the usual button; sm is for toolbars and dense panels. */
    size?: "md" | "sm";
    /** An icon before the label. The button spaces it; do not put an `Icon` in the children for this. */
    icon?: IconData;
    /** An icon after the label: a chevron on a menu button, say. */
    iconEnd?: IconData;
    children: Snippet;
  } & (
      | {
          /**
           * primary: the one main action. danger: destructive, outlined. danger-fill: destructive
           * when the destructive answer is the main action, as in a confirmation. quiet: no frame.
           */
          variant?: "primary" | "secondary" | "danger" | "danger-fill" | "quiet";
          tone?: never;
        }
      | {
          /** soft: an action that carries a meaning, tinted with the color of its `tone`. */
          variant: "soft";
          /** The meaning a soft button wears; the same tones as Badge. Defaults to accent. */
          tone?: "accent" | "ok" | "warn" | "danger";
        }
    );

  let {
    variant = "secondary",
    tone,
    size = "md",
    icon,
    iconEnd,
    type = "button",
    children,
    ...rest
  }: Props = $props();
</script>

<button
  class="tln-btn tln-action tln-tone"
  data-variant={variant}
  data-tone={variant === "soft" ? (tone ?? "accent") : undefined}
  data-size={size}
  {type}
  {...rest}
>
  {#if icon}<Icon {icon} />{/if}
  {@render children()}
  {#if iconEnd}<Icon icon={iconEnd} />{/if}
</button>

<style>
  /* How it looks (frame, shadow, variants, focus, disabled) is in looks.css, shared with IconButton. */
  .tln-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: calc(var(--tln-space) * 2);
    padding: calc(var(--tln-space) * 1.5 + 1px) calc(var(--tln-space) * 3 + 1px);
    font: inherit;
    font-size: var(--tln-text-sm);
    line-height: var(--tln-leading);
    /* A label stays on one line; a row of buttons wraps between them instead. */
    white-space: nowrap;
  }

  /* Smaller type, tighter padding and gap. The icon is 1em, so it follows the type. */
  .tln-btn[data-size="sm"] {
    gap: calc(var(--tln-space) * 1.5);
    padding: var(--tln-space) calc(var(--tln-space) * 2.5);
    font-size: var(--tln-text-xs);
  }
</style>
