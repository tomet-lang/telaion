<script lang="ts">
  import { Icon } from "@telaion/primitives";
  import { ChevronDown, ChevronRight, File, Folder, FolderOpen } from "@telaion/primitives/icons";
  import type { TreeNode } from "./types.js";
  import TreeItem from "./TreeItem.svelte";

  let {
    node,
    depth = 0,
    selectedId = $bindable(null),
    expandedIds = $bindable(new Set<string>()),
    onselect,
    ontoggle,
  }: {
    node: TreeNode;
    depth?: number;
    selectedId: string | null;
    expandedIds: Set<string>;
    onselect?: (node: TreeNode) => void;
    ontoggle?: (node: TreeNode, expanded: boolean) => void;
  } = $props();

  const isFolder = $derived(node.isFolder ?? (Array.isArray(node.children) && node.children.length > 0));
  const isExpanded = $derived(expandedIds.has(node.id));
  const isSelected = $derived(selectedId === node.id);

  function toggle() {
    if (!isFolder) return;
    const next = new Set(expandedIds);
    if (next.has(node.id)) {
      next.delete(node.id);
      expandedIds = next;
      ontoggle?.(node, false);
    } else {
      next.add(node.id);
      expandedIds = next;
      ontoggle?.(node, true);
    }
  }

  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    selectedId = node.id;
    onselect?.(node);
    if (isFolder) {
      toggle();
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      selectedId = node.id;
      onselect?.(node);
      if (isFolder) {
        toggle();
      }
    } else if (e.key === "ArrowRight") {
      if (isFolder && !isExpanded) {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }
    } else if (e.key === "ArrowLeft") {
      if (isFolder && isExpanded) {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }
    }
  }
</script>

<li
  role="treeitem"
  tabindex={isSelected ? 0 : -1}
  aria-expanded={isFolder ? isExpanded : undefined}
  aria-selected={isSelected}
  class="tln-tree-node"
  class:selected={isSelected}
  style:padding-left="calc(var(--tln-space) * 3 + {depth} * calc(var(--tln-space) * 4))"
  onclick={handleClick}
  onkeydown={handleKeyDown}
>
  {#if isFolder}
    <span class="tln-tree-chevron" aria-hidden="true">
      <Icon icon={isExpanded ? ChevronDown : ChevronRight} />
    </span>
    <span class="tln-tree-icon" aria-hidden="true">
      <Icon icon={isExpanded ? FolderOpen : Folder} />
    </span>
  {:else}
    <span class="tln-tree-chevron-spacer" aria-hidden="true"></span>
    <span class="tln-tree-icon" aria-hidden="true">
      <Icon icon={File} />
    </span>
  {/if}

  <span class="tln-tree-label">{node.label}</span>
</li>

{#if isFolder && isExpanded && node.children && node.children.length > 0}
  <ul role="group" class="tln-tree-group">
    {#each node.children as child (child.id)}
      <TreeItem
        node={child}
        depth={depth + 1}
        bind:selectedId
        bind:expandedIds
        {onselect}
        {ontoggle}
      />
    {/each}
  </ul>
{/if}

<style>
  .tln-tree-node {
    display: flex;
    align-items: center;
    gap: calc(var(--tln-space) * 1.5);
    padding-top: calc(var(--tln-space) * 1.5);
    padding-bottom: calc(var(--tln-space) * 1.5);
    padding-right: calc(var(--tln-space) * 3);
    font-size: var(--tln-text-sm);
    color: var(--tln-fg);
    border-radius: var(--tln-radius);
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    outline: none;
    transition: background-color var(--tln-transition), color var(--tln-transition);
  }

  .tln-tree-node:hover {
    background: var(--tln-action-hover);
  }

  .tln-tree-node:focus-visible {
    outline: var(--tln-focus-ring);
    outline-offset: -1px;
  }

  .tln-tree-node.selected {
    background: var(--tln-accent-soft);
    color: var(--tln-accent);
    font-weight: var(--tln-weight-medium);
  }

  .tln-tree-chevron {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    color: var(--tln-fg-muted);
  }

  .tln-tree-chevron-spacer {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .tln-tree-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--tln-fg-muted);
  }

  .tln-tree-node.selected .tln-tree-icon {
    color: var(--tln-accent);
  }

  .tln-tree-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tln-tree-group {
    list-style: none;
    margin: 0;
    padding: 0;
  }
</style>
