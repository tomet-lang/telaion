<script lang="ts">
  import { File } from "@telaion/primitives/icons";
  import { onDestroy, tick, untrack, type Snippet } from "svelte";
  import TreeEditRow from "./TreeEditRow.svelte";
  import TreeRow from "./TreeRow.svelte";
  import { canMoveInto, flattenTree, indexTree, isBranch, type TreeRowModel } from "./tree-model.js";
  import type {
    TreeCheckResult,
    TreeCommitEvent,
    TreeContextMenuEvent,
    TreeEditing,
    TreeMoveEvent,
    TreeNode,
    TreeRenameEditing,
  } from "./types.js";

  let {
    nodes = [],
    label,
    selectedId = $bindable(null),
    expandedIds = $bindable(new Set<string>()),
    editing = $bindable(null),
    contextId = null,
    validate,
    oncommit,
    onselect,
    ontoggle,
    onrename,
    onmove,
    candrop,
    oncontextmenu,
    icon,
    trailing,
    empty,
  }: {
    nodes: TreeNode[];
    /** The accessible name of the tree. */
    label: string;
    selectedId?: string | null;
    expandedIds?: Set<string>;
    /**
     * Set it to start naming a node (rename) or a new child (create). The tree shows the field,
     * and sets it back to `null` when the edit ends, committed or not.
     */
    editing?: TreeEditing | null;
    /** The node a context menu is open for, marked like a hovered row until the application clears it. */
    contextId?: string | null;
    /** Called while typing, and again before a commit. A message refuses the name and is shown under the field. */
    validate?: (value: string, editing: TreeEditing) => TreeCheckResult;
    /**
     * A name was committed. Do the rename or the creation here. A message (or a promise of one) refuses
     * it: the field stays open and shows it. Anything else accepts it and ends the edit.
     */
    oncommit?: (e: TreeCommitEvent) => TreeCheckResult | Promise<TreeCheckResult>;
    /** A node was clicked, or Enter or Space was pressed on it. */
    onselect?: (node: TreeNode) => void;
    ontoggle?: (node: TreeNode, expanded: boolean) => void;
    /** F2 was pressed on a node. The tree renames nothing by itself; set `editing` to do it. */
    onrename?: (node: TreeNode) => void;
    /** Setting it makes nodes draggable. A node was dropped onto a branch or onto the empty area. */
    onmove?: (e: TreeMoveEvent) => void;
    /** Refuses a drop that the shape of the tree allows. `target` is `null` for the root. */
    candrop?: (source: TreeNode, target: TreeNode | null) => boolean;
    /** The pointer or the keyboard (the context menu key, Shift+F10) asked for a menu. Setting it replaces the browser's menu. */
    oncontextmenu?: (e: TreeContextMenuEvent) => void;
    /** Replaces the icon of every node. Receives the node and whether it is expanded. */
    icon?: Snippet<[TreeNode, boolean]>;
    /** Content at the end of every row: a badge, a mark. */
    trailing?: Snippet<[TreeNode]>;
    /** What stands in an empty tree (`null`) or an empty expanded branch. */
    empty?: Snippet<[TreeNode | null]>;
  } = $props();

  const SPRING_OPEN_MS = 700;
  /** The type of what a drag carries, so that only a drag started in a tree is taken for a move. */
  const DRAG_TYPE = "application/x-telaion-tree-node";

  let treeElement: HTMLUListElement | undefined = $state();
  let focusedId = $state<string | null>(null);
  let draggingId = $state<string | null>(null);
  /** Where a drop would land. `null` is no drop; `{ id: null }` is the root. */
  let drop = $state<{ id: string | null } | null>(null);
  let springTimer: ReturnType<typeof setTimeout> | undefined;
  let lastKeyboardMenu = -Infinity;

  const index = $derived(indexTree(nodes));
  const rows = $derived(flattenTree(nodes, expandedIds, editing));
  type NodeRow = Extract<TreeRowModel, { kind: "node" }>;
  const nodeRows = $derived(rows.filter((r): r is NodeRow => r.kind === "node"));

  // Roving tabindex: one row is in the tab order, the one focused last, else the selected, else the first.
  const tabbableId = $derived.by(() => {
    const has = (id: string | null) => id !== null && nodeRows.some((r) => r.node.id === id);
    if (has(focusedId)) return focusedId;
    if (has(selectedId)) return selectedId;
    return nodeRows[0]?.node.id ?? null;
  });

  onDestroy(() => clearTimeout(springTimer));

  // ---- Expanding, selecting, focusing -------------------------------------------------------

  function setExpanded(node: TreeNode, expanded: boolean) {
    if (expandedIds.has(node.id) === expanded) return;
    const next = new Set(expandedIds);
    if (expanded) next.add(node.id);
    else next.delete(node.id);
    expandedIds = next;
    ontoggle?.(node, expanded);
  }

  function activate(node: TreeNode) {
    selectedId = node.id;
    onselect?.(node);
    if (isBranch(node)) setExpanded(node, !expandedIds.has(node.id));
  }

  function rowElement(id: string): HTMLElement | null {
    if (!treeElement) return null;
    for (const el of treeElement.querySelectorAll<HTMLElement>('[role="treeitem"]')) {
      if (el.dataset.id === id) return el;
    }
    return null;
  }

  /** Puts the keyboard focus on a node's row, once the tree has been drawn. */
  export async function focusNode(id: string) {
    await tick();
    (rowElement(id) ?? (tabbableId ? rowElement(tabbableId) : null))?.focus();
  }

  /** The row an event happened in. Not the fields of an edit row: those are the field's own. */
  function hit(target: EventTarget | null): { node: TreeNode; el: HTMLElement } | null {
    if (!(target instanceof Element) || target.closest("[data-tln-edit]")) return null;
    const el = target.closest<HTMLElement>('[role="treeitem"]');
    if (!el || !treeElement?.contains(el)) return null;
    const node = index.byId.get(el.dataset.id ?? "");
    return node ? { node, el } : null;
  }

  function handleFocusIn(e: FocusEvent) {
    const found = hit(e.target);
    if (found) focusedId = found.node.id;
  }

  function handleClick(e: MouseEvent) {
    const found = hit(e.target);
    if (!found) return;
    if ((e.target as Element).closest("[data-chevron]")) {
      setExpanded(found.node, !expandedIds.has(found.node.id));
      return;
    }
    activate(found.node);
  }

  // ---- Keyboard -----------------------------------------------------------------------------

  function openMenuFromKeyboard(node: TreeNode, el: HTMLElement) {
    const box = el.getBoundingClientRect();
    lastKeyboardMenu = performance.now();
    oncontextmenu?.({ node, x: box.left, y: box.bottom, source: "keyboard" });
  }

  function handleKeyDown(e: KeyboardEvent) {
    const found = hit(e.target);
    if (!found || e.ctrlKey || e.metaKey || e.altKey) return;
    const { node, el } = found;
    const at = nodeRows.findIndex((r) => r.node.id === node.id);
    const row = nodeRows[at];
    const go = (target: NodeRow | undefined) => {
      e.preventDefault();
      if (target) rowElement(target.node.id)?.focus();
    };

    if (e.key === "ArrowDown") go(nodeRows[at + 1]);
    else if (e.key === "ArrowUp") go(nodeRows[at - 1]);
    else if (e.key === "Home") go(nodeRows[0]);
    else if (e.key === "End") go(nodeRows[nodeRows.length - 1]);
    else if (e.key === "ArrowRight") {
      if (!row.branch) return;
      e.preventDefault();
      // Closed: open it. Open: step into it.
      if (!row.expanded) setExpanded(node, true);
      else if (nodeRows[at + 1]?.parentId === node.id) go(nodeRows[at + 1]);
    } else if (e.key === "ArrowLeft") {
      // Open: close it. Otherwise: step out to the parent.
      if (row.branch && row.expanded) {
        e.preventDefault();
        setExpanded(node, false);
      } else if (row.parentId !== null) {
        go(nodeRows.find((r) => r.node.id === row.parentId));
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate(node);
    } else if (e.key === "F2" && onrename) {
      e.preventDefault();
      onrename(node);
    } else if ((e.key === "ContextMenu" || (e.key === "F10" && e.shiftKey)) && oncontextmenu) {
      e.preventDefault();
      openMenuFromKeyboard(node, el);
    }
  }

  // ---- Context menu -------------------------------------------------------------------------

  function handleContextMenu(e: MouseEvent) {
    if (!oncontextmenu || (e.target as Element).closest("[data-tln-edit]")) return;
    e.preventDefault();
    // The same gesture was already answered by the key handler.
    if (performance.now() - lastKeyboardMenu < 500) return;
    const found = hit(e.target);
    found?.el.focus();
    oncontextmenu({ node: found?.node ?? null, x: e.clientX, y: e.clientY, source: "pointer" });
  }

  // ---- Drag and drop ------------------------------------------------------------------------

  /** The branch a drop on a row lands in: the row itself when it is a branch, else the branch it is in. */
  function landingFor(node: TreeNode | undefined): string | null {
    if (!node) return null;
    return isBranch(node) ? node.id : (index.parentOf.get(node.id) ?? null);
  }

  function accepts(targetId: string | null): boolean {
    if (!onmove || draggingId === null || !canMoveInto(index, draggingId, targetId)) return false;
    const source = index.byId.get(draggingId);
    if (!source) return false;
    return candrop?.(source, targetId === null ? null : (index.byId.get(targetId) ?? null)) !== false;
  }

  function setDrop(targetId: string | null | undefined, over: TreeNode | undefined) {
    const next = targetId === undefined ? null : { id: targetId };
    if (drop === null ? next === null : next !== null && drop.id === next.id) return;
    drop = next;
    clearTimeout(springTimer);
    // Hovering a closed branch for a moment opens it, so that a drop can reach what is inside.
    if (over && next?.id === over.id && isBranch(over) && !expandedIds.has(over.id)) {
      springTimer = setTimeout(() => setExpanded(over, true), SPRING_OPEN_MS);
    }
  }

  function endDrag() {
    draggingId = null;
    setDrop(undefined, undefined);
  }

  function handleDragStart(e: DragEvent) {
    const found = hit(e.target);
    if (!onmove || !found || !e.dataTransfer) return;
    draggingId = found.node.id;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(DRAG_TYPE, found.node.id);
    e.dataTransfer.setData("text/plain", found.node.label);
  }

  function handleDragOver(e: DragEvent) {
    // Only a drag that started in this tree. Files from the desktop, text, and other trees pass.
    if (draggingId === null || !e.dataTransfer?.types.includes(DRAG_TYPE)) return;
    const over = hit(e.target)?.node;
    const targetId = landingFor(over);
    if (accepts(targetId)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDrop(targetId, over);
    } else {
      e.dataTransfer.dropEffect = "none";
      setDrop(undefined, undefined);
    }
  }

  function handleDragLeave(e: DragEvent) {
    if (!treeElement?.contains(e.relatedTarget as Node | null)) setDrop(undefined, undefined);
  }

  function handleDrop(e: DragEvent) {
    if (draggingId === null) return;
    const targetId = landingFor(hit(e.target)?.node);
    const source = index.byId.get(draggingId);
    if (source && accepts(targetId)) {
      e.preventDefault();
      const target = targetId === null ? null : (index.byId.get(targetId) ?? null);
      onmove?.({ sourceId: source.id, source, targetId, target });
    }
    endDrag();
  }

  // ---- Editing ------------------------------------------------------------------------------

  // A new child is made in an open branch: open it, once, when the edit starts.
  $effect(() => {
    const current = editing;
    if (current?.kind !== "create" || current.parentId === null) return;
    untrack(() => {
      const parent = index.byId.get(current.parentId!);
      if (parent) setExpanded(parent, true);
    });
  });

  function finishEdit(restoreFocus: boolean, focusId: string | null) {
    editing = null;
    if (restoreFocus && focusId !== null) void focusNode(focusId);
  }
</script>

<ul
  bind:this={treeElement}
  role="tree"
  aria-label={label}
  class="tln-tree"
  data-drop-root={drop !== null && drop.id === null ? "" : undefined}
  onfocusin={handleFocusIn}
  onclick={handleClick}
  onkeydown={handleKeyDown}
  oncontextmenu={handleContextMenu}
  ondragstart={handleDragStart}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  ondragend={endDrag}
>
  {#each rows as row (row.kind === "node" ? row.node.id : row.kind === "create" ? "\u0000create" : `\u0000empty:${row.parent.id}`)}
    {#if row.kind === "node"}
      {@const renaming = editing?.kind === "rename" && editing.id === row.node.id ? editing : null}
      {#snippet field(current: TreeRenameEditing)}
        {#key current}
          <TreeEditRow
            depth={row.level - 1}
            icon={row.branch
              ? ((row.expanded ? (row.node.openIcon ?? row.node.icon) : row.node.icon) ?? File)
              : (row.node.icon ?? File)}
            branch={row.branch}
            expanded={row.expanded}
            initial={current.value ?? row.node.label}
            original={row.node.label}
            selection={current.selection}
            label={current.label ?? row.node.label}
            placeholder={current.placeholder}
            validate={(value) => validate?.(value, current)}
            oncommit={(value) => oncommit?.({ editing: current, value })}
            onfinish={(_, restore) => finishEdit(restore, row.node.id)}
          />
        {/key}
      {/snippet}
      <TreeRow
        node={row.node}
        level={row.level}
        position={row.position}
        setSize={row.setSize}
        branch={row.branch}
        expanded={row.expanded}
        selected={selectedId === row.node.id}
        tabbable={tabbableId === row.node.id}
        context={contextId === row.node.id}
        dropTarget={drop?.id === row.node.id}
        dragging={draggingId === row.node.id}
        draggable={Boolean(onmove)}
        {icon}
        {trailing}
        editing={renaming !== null}
      >
        {#if renaming}{@render field(renaming)}{/if}
      </TreeRow>
    {:else if row.kind === "create"}
      {@const current = row.editing}
      <li role="none" class="tln-tree-create">
        {#key current}
          <TreeEditRow
            depth={row.level - 1}
            icon={current.icon ?? File}
            initial={current.value ?? ""}
            selection={current.selection}
            label={current.label ?? "Name"}
            placeholder={current.placeholder}
            validate={(value) => validate?.(value, current)}
            oncommit={(value) => oncommit?.({ editing: current, value })}
            onfinish={(_, restore) => finishEdit(restore, current.parentId ?? tabbableId)}
          />
        {/key}
      </li>
    {:else}
      <li role="none" class="tln-tree-empty" style:--depth={row.level - 1}>
        {#if empty}{@render empty(row.parent)}{:else}Empty{/if}
      </li>
    {/if}
  {/each}

  {#if nodes.length === 0 && !(editing?.kind === "create" && editing.parentId === null)}
    <li role="none" class="tln-tree-empty" data-root>
      {#if empty}{@render empty(null)}{:else}No items{/if}
    </li>
  {/if}
</ul>

<style>
  .tln-tree {
    list-style: none;
    margin: 0;
    padding: calc(var(--tln-space) * 1.5) 0;
    width: 100%;
    /* Fills the space it is given, so that the empty area below the rows is a place to drop onto. */
    min-height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: calc(var(--tln-space) / 2);
    border-radius: var(--tln-radius);
  }

  .tln-tree[data-drop-root] {
    background: var(--tln-accent-soft);
    outline: var(--tln-focus-ring);
    outline-offset: -2px;
  }

  .tln-tree-create {
    list-style: none;
  }

  .tln-tree-empty {
    box-sizing: border-box;
    padding: calc(var(--tln-space) * 2) calc(var(--tln-space) * 3);
    /* Under the labels of the rows it stands in: past the chevron and the icon. */
    padding-left: calc(var(--tln-space) * (3 + 4 * var(--depth) + 10.5));
    color: var(--tln-fg-muted);
    font-size: var(--tln-text-xs);
    line-height: var(--tln-leading);
  }

  .tln-tree-empty[data-root] {
    padding-left: calc(var(--tln-space) * 3);
    text-align: center;
  }
</style>
