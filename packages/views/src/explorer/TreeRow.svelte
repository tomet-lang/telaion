<script lang="ts">
  import { Icon, Spinner } from "@telaion/primitives";
  import { ChevronDown, ChevronRight, File, Folder, FolderOpen } from "@telaion/primitives/icons";
  import type { Snippet } from "svelte";
  import type { TreeNode } from "./types.js";

  // One row, and nothing else: it does not know the tree. What happens when it is clicked, dragged
  // or asked for a menu is decided by TreeExplorer, which listens on the whole tree.
  let {
    node,
    level,
    position,
    setSize,
    branch,
    expanded,
    selected,
    tabbable,
    context,
    dropTarget,
    dragging,
    draggable,
    icon,
    trailing,
    editing,
    children,
  }: {
    node: TreeNode;
    level: number;
    position: number;
    setSize: number;
    branch: boolean;
    expanded: boolean;
    selected: boolean;
    /** The one row of the tree that is in the tab order. */
    tabbable: boolean;
    /** A context menu is open for it. */
    context: boolean;
    /** It is the branch a dragged node would land in. */
    dropTarget: boolean;
    /** It is the node being dragged. */
    dragging: boolean;
    draggable: boolean;
    icon?: Snippet<[TreeNode, boolean]>;
    trailing?: Snippet<[TreeNode]>;
    /** Its name is being edited: the field (the children) takes the place of the content. */
    editing: boolean;
    children?: Snippet;
  } = $props();
</script>

<li
  role="treeitem"
  data-id={node.id}
  tabindex={tabbable ? 0 : -1}
  aria-label={node.label}
  aria-level={level}
  aria-posinset={position}
  aria-setsize={setSize}
  aria-expanded={branch ? expanded : undefined}
  aria-selected={selected}
  aria-busy={node.loading || undefined}
  draggable={draggable && !editing}
  class="tln-tree-row"
  class:selected
  class:context
  class:drop-target={dropTarget}
  class:dragging
  class:editing
  style:--depth={level - 1}
>
  {#if editing}
    {@render children?.()}
  {:else}
    {#if node.loading}
      <span class="tln-tree-chevron"><Spinner label="Loading" /></span>
    {:else if branch}
      <span class="tln-tree-chevron" data-chevron aria-hidden="true">
        <Icon icon={expanded ? ChevronDown : ChevronRight} />
      </span>
    {:else}
      <span class="tln-tree-chevron" aria-hidden="true"></span>
    {/if}

    <span class="tln-tree-icon" aria-hidden="true">
      {#if icon}
        {@render icon(node, expanded)}
      {:else if branch}
        <Icon icon={(expanded ? (node.openIcon ?? node.icon) : node.icon) ?? (expanded ? FolderOpen : Folder)} />
      {:else}
        <Icon icon={node.icon ?? File} />
      {/if}
    </span>

    <span class="tln-tree-label">{node.label}</span>

    {#if trailing}
      <span class="tln-tree-trailing">{@render trailing(node)}</span>
    {/if}
  {/if}
</li>

<style>
  .tln-tree-row {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: calc(var(--tln-space) * 1.5);
    /* As tall as a compact field (Input size="sm"), so that a row turns into its edit field without moving the rows below. */
    padding-block: var(--tln-space);
    padding-left: calc(var(--tln-space) * (3 + 4 * var(--depth)));
    padding-right: calc(var(--tln-space) * 3);
    font-size: var(--tln-text-xs);
    line-height: var(--tln-leading);
    color: var(--tln-fg);
    border-radius: var(--tln-radius);
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    outline: none;
    transition: background-color var(--tln-transition), color var(--tln-transition);
  }

  /* An edit field has its own padding and its own height: the row gives up its own. */
  .tln-tree-row.editing {
    padding: 0;
    cursor: auto;
  }

  .tln-tree-row:hover,
  .tln-tree-row.context {
    background: var(--tln-tint);
  }
  .tln-tree-row.editing:hover {
    background: transparent;
  }

  .tln-tree-row:focus-visible {
    outline: var(--tln-focus-ring);
    outline-offset: -2px;
  }

  .tln-tree-row.selected {
    background: var(--tln-accent-soft);
    color: var(--tln-accent);
  }

  /* Where a drop would land: the selection's tone and a ring, so that it is not taken for a selection. */
  .tln-tree-row.drop-target {
    background: var(--tln-accent-soft);
    outline: var(--tln-focus-ring);
    outline-offset: -2px;
  }

  .tln-tree-row.dragging {
    color: var(--tln-fg-muted);
  }

  .tln-tree-chevron {
    font-size: var(--tln-text-sm);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: calc(var(--tln-space) * 4);
    height: calc(var(--tln-space) * 4);
    color: var(--tln-fg-muted);
  }

  .tln-tree-icon {
    font-size: var(--tln-text-sm);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    color: var(--tln-fg-muted);
  }
  .tln-tree-row.selected .tln-tree-icon {
    color: var(--tln-accent);
  }

  .tln-tree-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tln-tree-trailing {
    display: inline-flex;
    align-items: center;
    gap: var(--tln-space);
    flex: none;
    margin-left: auto;
    padding-left: calc(var(--tln-space) * 2);
  }
</style>
