<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    keys,
    children,
  }: {
    /** A key combination, one entry per key: ["Ctrl", "P"]. */
    keys?: string[];
    /** A single key, as text, when `keys` is not given. */
    children?: Snippet;
  } = $props();
</script>

{#if keys && keys.length > 1}
  <!-- A combination is a kbd of kbds, as HTML defines it. The plus is for the eye only. -->
  <kbd class="tln-kbd-combo">
    {#each keys as key, index (index)}
      {#if index > 0}<span class="tln-kbd-plus" aria-hidden="true">+</span>{/if}
      <kbd class="tln-kbd">{key}</kbd>
    {/each}
  </kbd>
{:else}
  <kbd class="tln-kbd">{#if keys}{keys[0]}{:else}{@render children?.()}{/if}</kbd>
{/if}

<style>
  /*
   * A hint to read, not a control, so it is not an action: no shadow, no raised look.
   * It is told from the text around it by the tint, the way a code span is.
   */
  .tln-kbd {
    display: inline-block;
    padding: 0 calc(var(--tln-space) * 1.5);
    font: inherit;
    font-family: var(--tln-font-mono);
    font-size: var(--tln-text-xs);
    line-height: var(--tln-leading);
    color: var(--tln-fg-muted);
    background: var(--tln-tint);
    border-radius: var(--tln-radius);
    white-space: nowrap;
  }

  .tln-kbd-combo {
    display: inline-flex;
    align-items: baseline;
    gap: var(--tln-space);
    font: inherit;
  }

  .tln-kbd-plus {
    font-size: var(--tln-text-xs);
    color: var(--tln-fg-muted);
  }
</style>
