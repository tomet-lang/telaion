<script lang="ts">
  import {
    Button,
    ContextMenu,
    IconButton,
    Input,
    Menu,
    Popover,
    Tooltip,
    type MenuItem,
  } from "@telaion/primitives";
  import {
    ChevronDown,
    Copy,
    FilePlus,
    FolderOpen,
    FolderPlus,
    Info,
    Pencil,
    RefreshCw,
    Settings,
    Trash,
  } from "@telaion/primitives/icons";

  let last = $state("none");
  const log = (name: string) => () => (last = name);

  // ---- A dropdown that holds a list and a form, as ordiola's vault switcher does -----------------------
  const vaults = [
    { name: "notes", path: "/home/me/notes" },
    { name: "wiki", path: "/home/me/projects/tomet-wiki/content" },
    { name: "journal", path: "/home/me/journal" },
  ];
  let vaultOpen = $state(false);
  let vault = $state("notes");
  let customPath = $state("");
  const vaultItems = $derived<MenuItem[]>(
    vaults.map((entry) => ({
      id: entry.name,
      label: entry.name,
      checked: entry.name === vault,
      onselect: () => {
        vault = entry.name;
        last = `vault ${entry.name}`;
      },
    })),
  );

  // ---- A menu button -----------------------------------------------------------------------------------------
  let actionsOpen = $state(false);
  let wrapLines = $state(true);
  const actions = $derived<MenuItem[]>([
    { type: "heading", label: "File" },
    { label: "New file", icon: FilePlus, shortcut: "Ctrl+N", onselect: log("new file") },
    { label: "New folder", icon: FolderPlus, onselect: log("new folder") },
    { label: "Open...", icon: FolderOpen, disabled: true },
    { type: "separator" },
    { type: "heading", label: "View" },
    { label: "Wrap lines", checked: wrapLines, keepOpen: true, onselect: () => (wrapLines = !wrapLines) },
    { type: "separator" },
    { label: "Delete", icon: Trash, danger: true, shortcut: "Del", onselect: log("delete") },
  ]);

  // ---- Edge: a trigger at the right edge of the page, to see the panel kept in view ----------------
  let edgeOpen = $state(false);

  // ---- A context menu over a tree, with a different menu for each row -------------------------------------------
  const rows = [
    { id: "docs", name: "docs", folder: true },
    { id: "idea", name: "idea.tmt", folder: false },
    { id: "plan", name: "plan.tmt", folder: false },
  ];
  const rowItems = (target: Element | null): MenuItem[] => {
    const row = target?.closest<HTMLElement>("[data-row]");
    if (!row) return [];
    const folder = row.dataset.folder === "true";
    return [
      ...(folder
        ? ([
            { label: "New file", icon: FilePlus, onselect: log(`new file in ${row.dataset.row}`) },
            { label: "New folder", icon: FolderPlus, onselect: log(`new folder in ${row.dataset.row}`) },
            { type: "separator" },
          ] satisfies MenuItem[])
        : []),
      { label: "Rename", icon: Pencil, shortcut: "F2", onselect: log(`rename ${row.dataset.row}`) },
      { label: "Copy path", icon: Copy, onselect: log(`copy ${row.dataset.row}`) },
      { type: "separator" },
      { label: "Delete", icon: Trash, danger: true, shortcut: "Del", onselect: log(`delete ${row.dataset.row}`) },
    ];
  };

  // A menu you open yourself, from a point.
  let pointOpen = $state(false);
  let pointX = $state(0);
  let pointY = $state(0);
  const pointItems: MenuItem[] = [
    { label: "Refresh", icon: RefreshCw, onselect: log("refresh") },
    { label: "Settings", icon: Settings, onselect: log("settings") },
  ];
</script>

<div class="menu-demo">
  <p class="muted">
    last chosen: <code data-testid="menu-last">{last}</code>
  </p>

  <h3>Popover with a list and a form (inside a box that clips everything)</h3>
  <div class="clip" data-testid="clip">
    <Popover bind:open={vaultOpen} label="Recent vaults" matchWidth>
      {#snippet trigger(props)}
        <Button {...props} iconEnd={ChevronDown}>Vault: {vault}</Button>
      {/snippet}
      <div class="vault">
        <Menu items={vaultItems} label="Recent vaults" />
        <div class="vault-form">
          <Input bind:value={customPath} placeholder="/path/to/vault" aria-label="Path to a vault" mono />
          <Button
            variant="primary"
            onclick={() => {
              last = `open ${customPath}`;
              vaultOpen = false;
            }}>Open</Button
          >
        </div>
      </div>
    </Popover>
  </div>

  <h3>Menu button</h3>
  <div class="row">
    <Popover bind:open={actionsOpen} label="Actions" role="menu">
      {#snippet trigger(props)}
        <Button {...props} iconEnd={ChevronDown}>Actions</Button>
      {/snippet}
      <Menu items={actions} />
    </Popover>
    <span class="muted">wrap lines = {wrapLines}</span>
  </div>

  <h3>Menu on its own (no popover)</h3>
  <div class="static-menu">
    <Menu label="Static menu" items={actions} />
  </div>

  <h3>Keeps itself in view: a trigger at the right edge</h3>
  <div class="edge">
    <Popover bind:open={edgeOpen} label="Edge actions" role="menu" placement="bottom-start">
      {#snippet trigger(props)}
        <Button {...props} iconEnd={ChevronDown}>Edge</Button>
      {/snippet}
      <Menu items={actions} />
    </Popover>
  </div>

  <h3>Context menu (right click a row, or focus one and press Shift+F10 or the Menu key)</h3>
  <ContextMenu items={rowItems} label="Row actions">
    <ul class="tree" aria-label="Files">
      {#each rows as row (row.id)}
        <li><button type="button" class="tree-row" data-row={row.id} data-folder={row.folder}>{row.name}</button></li>
      {/each}
    </ul>
  </ContextMenu>

  <h3>Context menu that the application opens at a point</h3>
  <div class="row">
    <div
      class="pad"
      role="presentation"
      data-testid="pad"
      oncontextmenu={(event) => {
        event.preventDefault();
        pointX = event.clientX;
        pointY = event.clientY;
        pointOpen = true;
      }}
    >
      Right click anywhere in here
    </div>
    <ContextMenu bind:open={pointOpen} x={pointX} y={pointY} items={pointItems} label="Pad actions" />
  </div>

  <h3>Tooltip</h3>
  <div class="row">
    <Tooltip text="Opens the settings of this vault">
      {#snippet children(describe)}
        <IconButton icon={Settings} label="Settings" {...describe} />
      {/snippet}
    </Tooltip>
    <Tooltip text="/home/me/projects/tomet-wiki/content/a/very/long/path/that/has/to/wrap/because/it/is/long.tmt" placement="bottom">
      {#snippet children(describe)}
        <Button {...describe} iconEnd={Info}>Full path</Button>
      {/snippet}
    </Tooltip>
    <Tooltip text="Below the button" placement="bottom-start" delay={0}>
      {#snippet children(describe)}
        <Button variant="quiet" {...describe}>No delay</Button>
      {/snippet}
    </Tooltip>
  </div>
</div>

<style>
  .menu-demo h3 {
    margin: calc(var(--tln-space) * 4) 0 calc(var(--tln-space) * 2);
    font-size: var(--tln-text-sm);
    color: var(--tln-fg-muted);
  }
  .muted {
    color: var(--tln-fg-muted);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: calc(var(--tln-space) * 3);
  }

  /* overflow: hidden and a transform: neither may clip or move what floats out of it. */
  .clip {
    overflow: hidden;
    transform: translateZ(0);
    width: calc(var(--tln-space) * 60);
    padding: calc(var(--tln-space) * 2);
    background: var(--tln-content);
    border-radius: var(--tln-radius);
  }

  .vault {
    display: flex;
    flex-direction: column;
    gap: calc(var(--tln-space) * 2);
  }
  .vault-form {
    display: flex;
    gap: calc(var(--tln-space) * 2);
    padding: calc(var(--tln-space) * 1) calc(var(--tln-space) * 1) 0;
    border-top: 1px solid var(--tln-border);
  }

  .static-menu {
    display: inline-block;
    background: var(--tln-content);
    border-radius: var(--tln-radius);
    box-shadow: var(--tln-shadow-float);
    padding: var(--tln-space);
  }

  .edge {
    display: flex;
    justify-content: flex-end;
  }

  .tree {
    list-style: none;
    margin: 0;
    padding: calc(var(--tln-space) * 2);
    width: calc(var(--tln-space) * 60);
    background: var(--tln-content);
    border-radius: var(--tln-radius);
  }
  .tree-row {
    display: block;
    width: 100%;
    padding: var(--tln-space) calc(var(--tln-space) * 2);
    font: inherit;
    font-size: var(--tln-text-sm);
    color: var(--tln-fg);
    text-align: left;
    background: transparent;
    border: 0;
    border-radius: var(--tln-radius);
    cursor: default;
  }
  .tree-row:hover {
    background: var(--tln-tint);
  }
  .tree-row:focus-visible {
    outline: var(--tln-focus-ring);
    outline-offset: -2px;
  }

  .pad {
    padding: calc(var(--tln-space) * 8);
    font-size: var(--tln-text-sm);
    color: var(--tln-fg-muted);
    background: var(--tln-well);
    border-radius: var(--tln-radius);
    box-shadow: var(--tln-shadow-well);
  }
</style>
