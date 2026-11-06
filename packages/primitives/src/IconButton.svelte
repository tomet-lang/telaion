<script lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";
  import Icon from "./Icon.svelte";
  import "./looks.css";
  import type { IconData } from "./icon-data.js";

  type Props = Omit<HTMLButtonAttributes, "class" | "style" | "children" | "aria-label"> & {
    icon: IconData;
    /** What the button does. Required: there is no visible text. */
    label: string;
    /** md is the usual button; sm is for toolbars and dense panels. */
    size?: "md" | "sm";
  } & (
      | { variant?: "secondary" | "quiet"; tone?: never }
      | {
          /** soft: an action that carries a meaning, tinted with the color of its `tone`. */
          variant: "soft";
          /** The meaning a soft button wears; the same tones as Badge. Defaults to accent. */
          tone?: "accent" | "ok" | "warn" | "danger";
        }
    );

  let { icon, label, variant = "quiet", tone, size = "md", type = "button", ...rest }: Props = $props();
</script>

<button
  class="tln-icon-btn tln-action tln-tone"
  data-variant={variant}
  data-tone={variant === "soft" ? (tone ?? "accent") : undefined}
  data-size={size}
  {type}
  aria-label={label}
  title={label}
  {...rest}
>
  <Icon {icon} />
</button>

<style>
  /* How it looks is in looks.css, shared with Button. */
  .tln-icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: calc(var(--tln-space) * 1.5 + 1px);
    font-size: var(--tln-text-md);
    line-height: 1;
  }

  .tln-icon-btn[data-size="sm"] {
    padding: calc(var(--tln-space) * 1.5);
    font-size: var(--tln-text-sm);
  }
</style>
