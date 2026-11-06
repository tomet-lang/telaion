<script lang="ts">
  import { Badge, Icon, IconButton } from "@telaion/primitives";
  import {
    FileCode,
    Image,
    Star,
    FilePlus,
    FileText,
    FolderPlus,
    ListChevronsDownUp,
    Folder,
  } from "@telaion/primitives/icons";
  import {
    TreeExplorer,
    type TreeContextMenuEvent,
    type TreeEditing,
    type TreeMoveEvent,
    type TreeNode,
  } from "@telaion/views";

  // The tree knows nothing about files. This demo is an application: it decides that a node with a
  // dot in its name is a document, that a name must be unique among its siblings, and what a move is.

  type Meta = { modified?: boolean; picture?: boolean };
  const meta = (node: TreeNode) => (node.data ?? {}) as Meta;

  function leaf(id: string, label: string, extra: Partial<TreeNode> = {}): TreeNode {
    const icon = label.endsWith(".tmt") ? FileText : label.endsWith(".ts") || label.endsWith(".svelte") ? FileCode : undefined;
    return { id, label, icon, ...extra };
  }

  let nodes = $state<TreeNode[]>([
    {
      id: "src",
      label: "src",
      isFolder: true,
      children: [
        {
          id: "components",
          label: "components",
          isFolder: true,
          children: [
            leaf("button-svelte", "Button.svelte", { data: { modified: true } }),
            leaf("modal-svelte", "Modal.svelte"),
          ],
        },
        leaf("index-ts", "index.ts"),
        leaf("tokens-css", "tokens.css"),
      ],
    },
    {
      id: "docs",
      label: "docs",
      isFolder: true,
      children: [leaf("readme-tmt", "readme.tmt"), leaf("agents-tmt", "agents.tmt", { data: { modified: true } })],
    },
    { id: "empty", label: "empty", isFolder: true, children: [] },
    leaf("package-json", "package.json"),
  ]);
  let selectedId = $state<string | null>("button-svelte");
  let expandedIds = $state<Set<string>>(new Set(["src", "components"]));
  let editing = $state<TreeEditing | null>(null);
  let contextId = $state<string | null>(null);

  let log = $state<string[]>([]);
  let counter = 0;
  const say = (line: string) => (log = [line, ...log].slice(0, 6));

  // A second tree that only reads: what a row can show besides a name.
  const states: TreeNode[] = [
    { id: "s-open", label: "A folder that is open", isFolder: true, children: [leaf("s-leaf", "A document.tmt"), { id: "s-star", label: "Starred, with its own icon", icon: Star }] },
    { id: "s-loading", label: "Loading its children", isFolder: true, loading: true },
    { id: "s-lazy", label: "Children not loaded yet", isFolder: true },
    { id: "s-empty", label: "An empty folder", isFolder: true, children: [] },
    leaf("s-long", "A name so long that it cannot fit in the width of the sidebar it is shown in.tmt", { data: { modified: true } }),
    { id: "s-image", label: "Icon from a snippet", data: { picture: true } },
  ];
  let statesSelected = $state<string | null>("s-leaf");
  let statesExpanded = $state<Set<string>>(new Set(["s-open", "s-empty"]));

  // ---- Reading and changing the nodes ----------------------------------------------------------

  function find(list: TreeNode[], id: string): TreeNode | undefined {
    for (const node of list) {
      if (node.id === id) return node;
      const inside = node.children && find(node.children, id);
      if (inside) return inside;
    }
  }

  function parentIdOf(list: TreeNode[], id: string, parent: string | null = null): string | null | undefined {
    for (const node of list) {
      if (node.id === id) return parent;
      const inside = node.children && parentIdOf(node.children, id, node.id);
      if (inside !== undefined) return inside;
    }
  }

  function mapTree(list: TreeNode[], change: (node: TreeNode) => TreeNode | null): TreeNode[] {
    return list.flatMap((node) => {
      const changed = change(node);
      if (changed === null) return [];
      return [changed.children ? { ...changed, children: mapTree(changed.children, change) } : changed];
    });
  }

  function siblingsOf(parentId: string | null): TreeNode[] {
    return parentId === null ? nodes : (find(nodes, parentId)?.children ?? []);
  }

  function taken(parentId: string | null, name: string, except?: string): boolean {
    return siblingsOf(parentId).some((n) => n.id !== except && n.label.toLowerCase() === name.toLowerCase());
  }

  // ---- The three things the tree asks the application ------------------------------------------

  function validate(value: string) {
    if (/[\\/]/.test(value)) return "A name cannot contain a slash.";
  }

  async function commit({ editing: e, value }: { editing: TreeEditing; value: string }) {
    const parentId = e.kind === "create" ? e.parentId : (parentIdOf(nodes, e.id) ?? null);
    if (taken(parentId, value, e.kind === "rename" ? e.id : undefined)) return `"${value}" already exists here.`;
    if (e.kind === "rename") {
      nodes = mapTree(nodes, (n) => (n.id === e.id ? { ...n, label: value } : n));
      say(`renamed ${e.id} to ${value}`);
    } else {
      const id = `new-${++counter}`;
      const created: TreeNode = e.icon?.name === Folder.name ? { id, label: value, isFolder: true, children: [] } : leaf(id, value);
      nodes =
        e.parentId === null
          ? [...nodes, created]
          : mapTree(nodes, (n) => (n.id === e.parentId ? { ...n, children: [...(n.children ?? []), created] } : n));
      selectedId = id;
      say(`created ${value} in ${e.parentId ?? "the root"}`);
    }
  }

  function move(e: TreeMoveEvent) {
    if (taken(e.targetId, e.source.label)) {
      say(`${e.source.label} not moved: the name is taken in ${e.target?.label ?? "the root"}`);
      return;
    }
    const without = mapTree(nodes, (n) => (n.id === e.sourceId ? null : n));
    nodes =
      e.targetId === null
        ? [...without, e.source]
        : mapTree(without, (n) => (n.id === e.targetId ? { ...n, children: [...(n.children ?? []), e.source] } : n));
    expandedIds = new Set([...expandedIds, ...(e.targetId === null ? [] : [e.targetId])]);
    say(`moved ${e.source.label} into ${e.target?.label ?? "the root"}`);
  }

  let menu = $state<TreeContextMenuEvent | null>(null);
  function openMenu(e: TreeContextMenuEvent) {
    menu = e;
    contextId = e.node?.id ?? null;
    say(`menu for ${e.node?.label ?? "the empty area"} at ${Math.round(e.x)},${Math.round(e.y)} by ${e.source}`);
  }

  // ---- The header buttons: a place to create in, and rename ------------------------------------

  function createIn(): string | null {
    if (selectedId === null) return null;
    const node = find(nodes, selectedId);
    if (!node) return null;
    return node.isFolder ? node.id : (parentIdOf(nodes, node.id) ?? null);
  }

  function startCreate(folder: boolean) {
    editing = folder
      ? { kind: "create", parentId: createIn(), icon: Folder, label: "New folder name", placeholder: "Folder name" }
      : { kind: "create", parentId: createIn(), label: "New document name", placeholder: "name.tmt" };
  }

  function startRename(node: TreeNode) {
    const dot = node.label.lastIndexOf(".");
    editing = {
      kind: "rename",
      id: node.id,
      label: `Rename ${node.label}`,
      // A document keeps its extension selected out: only the part before the dot is selected.
      selection: !node.isFolder && dot > 0 ? [0, dot] : undefined,
    };
  }
</script>

<div class="tree-demo" data-testid="tree-demo">
  <div class="tree-panel">
    <div class="tree-header">
      <span class="muted">Explorer</span>
      <div class="tree-actions">
        <IconButton icon={FilePlus} label="New document" onclick={() => startCreate(false)} />
        <IconButton icon={FolderPlus} label="New folder" onclick={() => startCreate(true)} />
        <IconButton icon={ListChevronsDownUp} label="Collapse all" onclick={() => (expandedIds = new Set())} />
      </div>
    </div>
    <div class="tree-scroll">
      <TreeExplorer
        label="Project"
        {nodes}
        bind:selectedId
        bind:expandedIds
        bind:editing
        {contextId}
        {validate}
        oncommit={commit}
        onrename={startRename}
        onmove={move}
        oncontextmenu={openMenu}
        onselect={(node) => say(`selected ${node.label}`)}
      >
        {#snippet trailing(node)}
          {#if meta(node).modified}<Badge tone="warn">M</Badge>{/if}
        {/snippet}
      </TreeExplorer>
    </div>
  </div>

  <div class="tree-readout">
    <p class="muted">
      selected: <code data-testid="tree-selected-id">{selectedId ?? "none"}</code>
    </p>
    <p class="muted">
      Click selects, and opens or closes a branch. Arrows, Home and End move, Enter or Space selects, F2 renames, the
      menu key or Shift+F10 asks for a menu. Drag a node onto a folder or onto the empty area under the rows.
    </p>
    <p class="muted">
      last menu:
      <code data-testid="tree-menu">{menu ? `${menu.node?.id ?? "none"} ${menu.source}` : "none"}</code>
      <button type="button" class="link" onclick={() => ((menu = null), (contextId = null))}>clear</button>
    </p>
    <ol class="tree-log" data-testid="tree-log" aria-label="Events">
      {#each log as line, i (log.length - i)}<li>{line}</li>{/each}
    </ol>
  </div>
</div>

<h3 class="subhead">Rows that only read</h3>
<div class="tree-demo" data-testid="tree-states">
  <div class="tree-panel short">
    <div class="tree-scroll">
      <TreeExplorer label="States" nodes={states} bind:selectedId={statesSelected} bind:expandedIds={statesExpanded}>
        {#snippet icon(node)}
          {#if meta(node).picture}
            <Icon icon={Image} />
          {:else if node.isFolder}
            <Icon icon={node.icon ?? Folder} />
          {:else}
            <Icon icon={node.icon ?? FileText} />
          {/if}
        {/snippet}
        {#snippet trailing(node)}
          {#if meta(node).modified}<Badge tone="warn">M</Badge>{/if}
        {/snippet}
        {#snippet empty(parent)}
          <span>{parent ? "Nothing in here" : "No items"}</span>
        {/snippet}
      </TreeExplorer>
    </div>
  </div>
  <p class="muted">
    A spinner replaces the chevron of a node that is loading. A branch with no <code>children</code> yet shows no empty
    note. A long label is cut with an ellipsis, and the trailing mark keeps its place.
  </p>
</div>

<style>
  .muted {
    color: var(--tln-fg-muted);
  }

  .subhead {
    margin: calc(var(--tln-space) * 6) 0 calc(var(--tln-space) * 2);
    font-size: var(--tln-text-md);
  }

  .tree-panel.short {
    height: auto;
    max-height: 22rem;
  }

  .tree-demo {
    display: grid;
    grid-template-columns: minmax(0, 20rem) minmax(0, 1fr);
    gap: calc(var(--tln-space) * 6);
    align-items: start;
  }

  /* The sidebar: a content surface that holds a header and a scrolling tree. */
  .tree-panel {
    display: flex;
    flex-direction: column;
    height: 26rem;
    background: var(--tln-content);
    border-radius: var(--tln-radius);
    box-shadow: var(--tln-shadow-content);
  }

  .tree-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--tln-space) calc(var(--tln-space) * 2) var(--tln-space) calc(var(--tln-space) * 3);
    border-bottom: 1px solid var(--tln-border);
    font-size: var(--tln-text-xs);
  }

  .tree-actions {
    display: flex;
    gap: var(--tln-space);
  }

  .tree-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0 var(--tln-space);
  }

  .tree-readout p {
    margin: 0 0 calc(var(--tln-space) * 2);
  }

  .tree-log {
    margin: 0;
    padding-left: calc(var(--tln-space) * 5);
    font-size: var(--tln-text-sm);
    color: var(--tln-fg-muted);
  }

  .link {
    margin-left: var(--tln-space);
    padding: 0;
    font: inherit;
    color: var(--tln-accent);
    background: none;
    border: 0;
    cursor: pointer;
  }
</style>
