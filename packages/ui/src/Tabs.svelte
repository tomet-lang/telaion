<script lang="ts">
  import Icon from "./Icon.svelte";
  import { X } from "./icons.generated.ts";

  type Item = { id: string; label: string; dirty?: boolean; closable?: boolean };

  let {
    items,
    value = $bindable(""),
    onclose,
  }: {
    items: Item[];
    /** The id of the selected tab. */
    value?: string;
    /** Called when a closable tab is closed, by its button or by the Delete key. */
    onclose?: (id: string) => void;
  } = $props();

  const uid = $props.id();
  let list: HTMLDivElement;

  // Only the selected tab is in the Tab order; the arrow keys move between tabs.
  const tabbableId = $derived(items.some((item) => item.id === value) ? value : items[0]?.id);

  function select(index: number) {
    const target = items[(index + items.length) % items.length];
    value = target.id;
    list.querySelector<HTMLElement>(`[data-tab-id="${CSS.escape(target.id)}"]`)?.focus();
  }

  function handleKeydown(event: KeyboardEvent) {
    const current = items.findIndex((item) => item.id === tabbableId);
    if (event.key === "ArrowRight") select(current + 1);
    else if (event.key === "ArrowLeft") select(current - 1);
    else if (event.key === "Home") select(0);
    else if (event.key === "End") select(items.length - 1);
    else if (event.key === "Delete" && items[current]?.closable) onclose?.(items[current].id);
    else return;
    event.preventDefault();
  }
</script>

<!-- svelte-ignore a11y_interactive_supports_focus -->
<div class="tln-tabs" role="tablist" bind:this={list} onkeydown={handleKeydown}>
  {#each items as item (item.id)}
    <div class="tln-tab" data-selected={item.id === value}>
      <button
        type="button"
        class="tln-tab-button"
        role="tab"
        id="{uid}-{item.id}"
        data-tab-id={item.id}
        aria-selected={item.id === value}
        tabindex={item.id === tabbableId ? 0 : -1}
        onclick={() => (value = item.id)}
      >
        {item.label}
        {#if item.dirty}
          <span class="tln-tab-dirty" role="img" aria-label="unsaved changes"></span>
        {/if}
      </button>
      {#if item.closable}
        <!-- Out of the Tab order on purpose: the keyboard closes a tab with Delete. -->
        <button
          type="button"
          class="tln-tab-close"
          tabindex="-1"
          aria-label="Close {item.label}"
          title="Close {item.label}"
          onclick={() => onclose?.(item.id)}
        >
          <Icon icon={X} />
        </button>
      {/if}
    </div>
  {/each}
</div>

<style>
  .tln-tabs {
    display: flex;
    gap: var(--tln-space);
    border-bottom: 1px solid var(--tln-border);
    overflow-x: auto;
  }

  .tln-tab {
    display: inline-flex;
    align-items: center;
    margin-bottom: -1px; /* the selected underline sits on the strip's border */
    border-bottom: 2px solid transparent;
  }

  .tln-tab[data-selected="true"] {
    border-bottom-color: var(--tln-accent);
  }

  .tln-tab-button {
    display: inline-flex;
    align-items: center;
    gap: calc(var(--tln-space) * 2);
    padding: calc(var(--tln-space) * 2) calc(var(--tln-space) * 3);
    font: inherit;
    font-size: var(--tln-text-sm);
    line-height: var(--tln-leading);
    color: var(--tln-fg-muted);
    background: transparent;
    border: 0;
    border-radius: var(--tln-radius) var(--tln-radius) 0 0;
    white-space: nowrap;
    cursor: pointer;
  }

  .tln-tab-button:hover {
    color: var(--tln-fg);
    background: var(--tln-bg-subtle);
  }

  .tln-tab[data-selected="true"] .tln-tab-button {
    color: var(--tln-fg);
  }

  .tln-tab-button:focus-visible,
  .tln-tab-close:focus-visible {
    outline: 2px solid var(--tln-accent);
    outline-offset: -2px;
  }

  .tln-tab-dirty {
    width: calc(var(--tln-space) * 2);
    height: calc(var(--tln-space) * 2);
    background: var(--tln-accent);
    border-radius: 50%;
  }

  .tln-tab-close {
    display: inline-flex;
    padding: var(--tln-space);
    margin-right: var(--tln-space);
    font-size: var(--tln-text-sm);
    color: var(--tln-fg-muted);
    background: transparent;
    border: 0;
    border-radius: var(--tln-radius);
    cursor: pointer;
  }

  .tln-tab-close:hover {
    color: var(--tln-fg);
    background: var(--tln-bg-sunken);
  }
</style>
