<script lang="ts">
  import type { Snippet } from "svelte";
  import Icon from "./Icon.svelte";
  import type { IconData } from "./icon-data.js";

  let {
    icon,
    title,
    description,
    level = 2,
    action,
  }: {
    icon?: IconData;
    title: string;
    description?: string;
    /** The heading level of the title, so that it fits the outline of the page it is in. */
    level?: 2 | 3 | 4 | 5 | 6;
    /** What to do about it: usually a Button. */
    action?: Snippet;
  } = $props();
</script>

<div class="tln-empty">
  {#if icon}<span class="tln-empty-icon"><Icon {icon} /></span>{/if}
  <svelte:element this={`h${level}`} class="tln-empty-title">{title}</svelte:element>
  {#if description}<p class="tln-empty-description">{description}</p>{/if}
  {#if action}<div class="tln-empty-action">{@render action()}</div>{/if}
</div>

<style>
  /* It sits on whatever holds it, with nothing of its own: an empty place is not a surface. */
  .tln-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: calc(var(--tln-space) * 2);
    padding: calc(var(--tln-space) * 8);
    text-align: center;
    color: var(--tln-fg);
  }

  .tln-empty-icon {
    display: inline-flex;
    /* The one place a size is a multiple of the rhythm: a glyph in a type scale would be too small to be seen. */
    font-size: calc(var(--tln-space) * 12);
    color: var(--tln-fg-muted);
  }

  .tln-empty-title {
    margin: 0;
    font-size: var(--tln-text-md);
    font-weight: inherit;
    line-height: var(--tln-leading);
  }

  .tln-empty-description {
    margin: 0;
    max-width: calc(var(--tln-space) * 100);
    font-size: var(--tln-text-sm);
    line-height: var(--tln-leading);
    color: var(--tln-fg-muted);
  }

  .tln-empty-action {
    margin-top: calc(var(--tln-space) * 2);
  }
</style>
