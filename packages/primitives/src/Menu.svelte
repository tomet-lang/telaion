<script lang="ts" module>
  import type { IconData } from "./icon-data.js";

  /** A row that can be chosen. */
  export interface MenuAction {
    type?: "item";
    /** Free for the application's own use: it is handed back in `onselect`. */
    id?: string;
    label: string;
    icon?: IconData;
    /** Shown at the end of the row, as a hint (`F2`, `Ctrl+S`). The menu does not listen for it. */
    shortcut?: string;
    /** Destructive. Painted in the danger color; it is not outlined. */
    danger?: boolean;
    /** Cannot be chosen and is skipped by the arrow keys. */
    disabled?: boolean;
    /**
     * Makes the row a checkbox (`menuitemcheckbox`): `true` shows a check, `false` shows none.
     * The menu does not flip it; the application does, in `onselect`. A checkbox shows no `icon`.
     */
    checked?: boolean;
    /** Keep the menu open after the row is chosen. */
    keepOpen?: boolean;
    onselect?: () => void;
  }

  /** A line between groups of rows. */
  export interface MenuSeparator {
    type: "separator";
  }

  /** A name for the rows after it, up to the next heading or separator. */
  export interface MenuHeading {
    type: "heading";
    label: string;
  }

  export type MenuItem = MenuAction | MenuSeparator | MenuHeading;

  type Group = { heading?: MenuHeading; rows: { action: MenuAction; index: number }[] };
  type Block = { separator: true } | ({ separator?: false } & Group);
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import Icon from "./Icon.svelte";
  import "./looks.css";
  import { Check } from "./icons.generated.js";
  import { getPopoverContext } from "./popover-context.js";

  let {
    items,
    label,
    item,
    onselect,
    closeOnSelect = true,
  }: {
    items: MenuItem[];
    /** The accessible name. Inside a Popover or ContextMenu it defaults to theirs. */
    label?: string;
    /** Draw a row's content yourself, in place of its label. The icon and the shortcut stay. */
    item?: Snippet<[MenuAction]>;
    /** Called with the chosen row, after the row's own `onselect`. */
    onselect?: (action: MenuAction) => void;
    /** Close the Popover this menu is in when a row is chosen. A row's `keepOpen` overrides it. */
    closeOnSelect?: boolean;
  } = $props();

  const uid = $props.id();
  const popover = getPopoverContext();
  let menu: HTMLDivElement;

  const isAction = (entry: MenuItem): entry is MenuAction => entry.type === undefined || entry.type === "item";

  // Rows between separators and headings, so that a heading can name the group it begins.
  const blocks = $derived.by(() => {
    const out: Block[] = [];
    let group: Group | null = null;
    items.forEach((entry, index) => {
      if (entry.type === "separator") {
        group = null;
        out.push({ separator: true });
      } else if (entry.type === "heading") {
        group = { heading: entry, rows: [] };
        out.push(group);
      } else {
        if (!group) out.push((group = { rows: [] }));
        group.rows.push({ action: entry, index });
      }
    });
    return out;
  });

  // The columns line up when any row has something in front of its label.
  const hasLead = $derived(items.some((entry) => isAction(entry) && (entry.icon || entry.checked !== undefined)));

  // Roving focus: one row is in the Tab order, the one that last had the focus.
  let active = $state(-1);
  const enabled = $derived(items.flatMap((entry, index) => (isAction(entry) && !entry.disabled ? [index] : [])));
  const tabbableIndex = $derived(enabled.includes(active) ? active : (enabled[0] ?? -1));

  const rows = () => [...menu.querySelectorAll<HTMLButtonElement>("button[role^='menuitem']:not(:disabled)")];

  function choose(action: MenuAction) {
    if (action.disabled) return;
    // Close first, then act: if the action moves the focus (opens a dialog), the popover leaves it alone.
    if (closeOnSelect && !action.keepOpen) popover?.close();
    action.onselect?.();
    onselect?.(action);
  }

  let typed = "";
  let typedTimer: ReturnType<typeof setTimeout> | undefined;

  function handleKeydown(event: KeyboardEvent) {
    const list = rows();
    if (list.length === 0) return;
    const current = list.indexOf(document.activeElement as HTMLButtonElement);
    let next: number | undefined;

    if (event.key === "ArrowDown") next = current < 0 ? 0 : (current + 1) % list.length;
    else if (event.key === "ArrowUp") next = current < 0 ? list.length - 1 : (current - 1 + list.length) % list.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = list.length - 1;
    else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && (event.key !== " " || typed)) {
      // Type-ahead: letters typed in a row find the next row that begins with them.
      clearTimeout(typedTimer);
      typedTimer = setTimeout(() => (typed = ""), 500);
      typed += event.key.toLowerCase();
      const names = list.map((row) => (items[Number(row.dataset.index)] as MenuAction).label.toLowerCase());
      // A single letter moves on to the next match; a longer run stays on the current one if it still matches.
      const from = typed.length === 1 ? current + 1 : Math.max(current, 0);
      for (let step = 0; step < names.length; step++) {
        const candidate = (from + step) % names.length;
        if (names[candidate].startsWith(typed)) {
          next = candidate;
          break;
        }
      }
      if (next === undefined) return;
    } else return;

    event.preventDefault();
    if (next !== undefined) list[next].focus();
  }

  function handleFocusin(event: FocusEvent) {
    const index = (event.target as HTMLElement).dataset?.index;
    if (index !== undefined) active = Number(index);
  }
</script>

{#snippet row(action: MenuAction, index: number)}
  <button
    type="button"
    class="tln-menu-item tln-action"
    data-variant="quiet"
    data-danger={action.danger || undefined}
    data-index={index}
    role={action.checked === undefined ? "menuitem" : "menuitemcheckbox"}
    aria-checked={action.checked}
    tabindex={index === tabbableIndex ? 0 : -1}
    disabled={action.disabled}
    onclick={() => choose(action)}
    onmouseenter={(event) => event.currentTarget.focus({ preventScroll: true })}
  >
    {#if hasLead}
      <span class="tln-menu-lead">
        {#if action.checked === undefined ? action.icon : action.checked}
          <Icon icon={action.checked === undefined ? action.icon! : Check} />
        {/if}
      </span>
    {/if}
    {#if item}
      <span class="tln-menu-label">{@render item(action)}</span>
    {:else}
      <span class="tln-menu-label">{action.label}</span>
    {/if}
    {#if action.shortcut}
      <span class="tln-menu-shortcut">{action.shortcut}</span>
    {/if}
  </button>
{/snippet}

<!-- svelte-ignore a11y_interactive_supports_focus -->
<div
  class="tln-menu"
  role="menu"
  aria-label={label ?? popover?.label}
  bind:this={menu}
  onkeydown={handleKeydown}
  onfocusin={handleFocusin}
  oncontextmenu={(event) => event.preventDefault()}
>
  {#each blocks as block, at (at)}
    {#if block.separator}
      <div class="tln-menu-separator" role="separator"></div>
    {:else if block.heading}
      <div role="group" aria-labelledby="{uid}-heading-{at}">
        <div class="tln-menu-heading" id="{uid}-heading-{at}">{block.heading.label}</div>
        {#each block.rows as { action, index } (index)}
          {@render row(action, index)}
        {/each}
      </div>
    {:else}
      {#each block.rows as { action, index } (index)}
        {@render row(action, index)}
      {/each}
    {/if}
  {/each}
</div>

<style>
  .tln-menu {
    box-sizing: border-box;
    min-width: calc(var(--tln-space) * 44);
    display: flex;
    flex-direction: column;
    font-size: var(--tln-text-sm);
  }

  /*
   * A row is a quiet action (looks.css): flat at rest, tinted on hover. Where this sets a property
   * the look also sets, it is on purpose: a menu row reads in the full ink, fills the row, and its
   * focus ring sits inside it so that the neighbouring rows do not cut it off.
   */
  .tln-menu button.tln-menu-item {
    display: flex;
    align-items: center;
    gap: calc(var(--tln-space) * 2);
    width: 100%;
    box-sizing: border-box;
    padding: calc(var(--tln-space) * 1.5) calc(var(--tln-space) * 2);
    font: inherit;
    line-height: var(--tln-leading);
    text-align: left;
    white-space: nowrap;
    color: var(--tln-fg);
  }

  /* One row is highlighted at a time: whichever has the focus, which the pointer moves too. */
  .tln-menu button.tln-menu-item:enabled:focus {
    background: var(--tln-tint);
  }
  .tln-menu button.tln-menu-item:focus-visible {
    outline-offset: -2px;
  }

  .tln-menu button.tln-menu-item[data-danger] {
    color: var(--tln-danger);
  }
  .tln-menu button.tln-menu-item[data-danger]:enabled:hover,
  .tln-menu button.tln-menu-item[data-danger]:enabled:focus {
    color: var(--tln-danger);
    background: var(--tln-danger-soft);
  }

  .tln-menu button.tln-menu-item:disabled {
    color: var(--tln-fg-muted);
  }

  .tln-menu-lead {
    display: inline-flex;
    flex: none;
    width: 1em;
    font-size: var(--tln-text-md);
  }

  .tln-menu-label {
    flex: 1;
    min-width: 0;
  }

  .tln-menu-shortcut {
    flex: none;
    margin-left: calc(var(--tln-space) * 4);
    font-size: var(--tln-text-xs);
    color: var(--tln-fg-muted);
  }

  .tln-menu-separator {
    height: 0;
    margin: var(--tln-space) calc(var(--tln-space) * 2);
    border-top: 1px solid var(--tln-border);
  }

  .tln-menu-heading {
    padding: calc(var(--tln-space) * 1.5) calc(var(--tln-space) * 2) var(--tln-space);
    font-size: var(--tln-text-xs);
    font-weight: 600;
    color: var(--tln-fg-muted);
  }
</style>
