<script lang="ts">
  import type { TreeNode } from "./types.js";
  import TreeItem from "./TreeItem.svelte";

  let {
    nodes = [],
    selectedId = $bindable(null),
    expandedIds = $bindable(new Set<string>()),
    label = "File explorer",
    onselect,
    ontoggle,
  }: {
    nodes: TreeNode[];
    selectedId?: string | null;
    expandedIds?: Set<string>;
    label?: string;
    onselect?: (node: TreeNode) => void;
    ontoggle?: (node: TreeNode, expanded: boolean) => void;
  } = $props();

  let treeElement: HTMLUListElement | undefined = $state();

  function getVisibleTreeItems(): HTMLElement[] {
    if (!treeElement) return [];
    return Array.from(treeElement.querySelectorAll<HTMLElement>('[role="treeitem"]'));
  }

  function handleKeyDown(e: KeyboardEvent) {
    const items = getVisibleTreeItems();
    if (items.length === 0) return;

    const activeEl = document.activeElement as HTMLElement | null;
    const currentIndex = items.findIndex((item) => item === activeEl);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      items[nextIndex].focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      items[prevIndex].focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0].focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1].focus();
    }
  }

  // Ensure at least one item has tabindex=0 for initial focus if nothing selected
  $effect(() => {
    if (selectedId === null && treeElement) {
      const first = treeElement.querySelector<HTMLElement>('[role="treeitem"]');
      if (first && first.getAttribute("tabindex") !== "0") {
        first.setAttribute("tabindex", "0");
      }
    }
  });
</script>

<ul
  bind:this={treeElement}
  role="tree"
  aria-label={label}
  class="tln-tree-explorer"
  onkeydown={handleKeyDown}
>
  {#each nodes as node (node.id)}
    <TreeItem
      {node}
      depth={0}
      bind:selectedId
      bind:expandedIds
      {onselect}
      {ontoggle}
    />
  {/each}

  {#if nodes.length === 0}
    <li class="tln-tree-empty" role="none">
      <span>No items</span>
    </li>
  {/if}
</ul>

<style>
  .tln-tree-explorer {
    list-style: none;
    margin: 0;
    padding: calc(var(--tln-space) * 1.5) 0;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .tln-tree-empty {
    padding: calc(var(--tln-space) * 4);
    color: var(--tln-fg-muted);
    font-size: var(--tln-text-xs);
    text-align: center;
  }
</style>
