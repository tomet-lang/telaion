<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    tone = "neutral",
    children,
  }: {
    tone?: "neutral" | "accent" | "ok" | "warn" | "danger";
    children: Snippet;
  } = $props();
</script>

<!-- The text stays in the foreground color: a tone-colored text on its own tint misses AA in light mode. -->
<span class="tln-badge" data-tone={tone}>{@render children()}</span>

<style>
  .tln-badge {
    display: inline-block;
    padding: 0 calc(var(--tln-space) * 2);
    font-size: var(--tln-text-xs);
    line-height: var(--tln-leading);
    color: var(--tln-fg);
    border: 1px solid var(--tln-border);
    border-radius: var(--tln-radius);
    background: var(--tln-bg-sunken);
    white-space: nowrap;
  }

  .tln-badge[data-tone="accent"] {
    background: var(--tln-accent-soft);
    border-color: var(--tln-accent);
  }
  .tln-badge[data-tone="ok"] {
    background: var(--tln-ok-soft);
    border-color: var(--tln-ok);
  }
  .tln-badge[data-tone="warn"] {
    background: var(--tln-warn-soft);
    border-color: var(--tln-warn);
  }
  .tln-badge[data-tone="danger"] {
    background: var(--tln-danger-soft);
    border-color: var(--tln-danger);
  }
</style>
