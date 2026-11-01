<script lang="ts">
  import type { Snippet } from "svelte";
  import "./looks.css";

  let {
    tone = "neutral",
    children,
  }: {
    tone?: "neutral" | "accent" | "ok" | "warn" | "danger";
    children: Snippet;
  } = $props();
</script>

<!-- The text stays in the foreground color: a tone-colored text on its own tint misses AA in light mode. -->
<span class="tln-badge tln-tone" data-tone={tone}>{@render children()}</span>

<style>
  /* The color of each tone is in looks.css, shared with Alert. */
  .tln-badge {
    display: inline-block;
    padding: 0 calc(var(--tln-space) * 2);
    font-size: var(--tln-text-xs);
    line-height: var(--tln-leading);
    color: var(--tln-fg);
    border: 1px solid var(--tln-tone);
    border-radius: var(--tln-radius);
    background: var(--tln-tone-soft);
    white-space: nowrap;
  }
</style>
