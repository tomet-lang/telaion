<script lang="ts">
  import type { IconData } from "./icon-data.ts";

  let {
    icon,
    label,
  }: {
    icon: IconData;
    /** Accessible name. Without it the icon is decorative and hidden from assistive technology. */
    label?: string;
  } = $props();
</script>

<svg
  class="tln-icon"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  role={label ? "img" : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : "true"}
>
  {@html icon.body}
</svg>

<style>
  .tln-icon {
    width: 1em;
    height: 1em;
    flex: none;
  }
</style>
