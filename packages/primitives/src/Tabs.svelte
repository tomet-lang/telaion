<script lang="ts">
  import { tick } from "svelte";
  import Icon from "./Icon.svelte";
  import { X } from "./icons.generated.js";
  import type { IconData } from "./icon-data.js";
  import "./looks.css";

  type Item = {
    id: string;
    label: string;
    /** Shown before the label. Decorative: the label names the tab. */
    icon?: IconData;
    /** The tooltip, for a name that the label shortens, such as the full path of a document. */
    title?: string;
    /** Has unsaved changes. Shown as a dot, which turns into the close button under the pointer or the focus. */
    dirty?: boolean;
    closable?: boolean;
  };

  let {
    items,
    value = $bindable(""),
    size = "md",
    label,
    onselect,
    onclose,
  }: {
    items: Item[];
    /** The id of the selected tab. */
    value?: string;
    /** sm: a compact strip, as in the chrome of an editor. */
    size?: "md" | "sm";
    /** Names the strip for assistive technology when the page has more than one. */
    label?: string;
    /** Called when the person picks a tab (click or keyboard); not when `value` is set by the application. */
    onselect?: (id: string) => void;
    /** Called when a closable tab is closed: its button, the Delete key, or a middle click. */
    onclose?: (id: string) => void;
  } = $props();

  const uid = $props.id();
  let list: HTMLDivElement;

  // Only the selected tab (and its close button) is in the Tab order; the arrow keys move between tabs.
  const tabbableId = $derived(items.some((item) => item.id === value) ? value : items[0]?.id);

  const tabElement = (id: string) => list.querySelector<HTMLElement>(`[data-tab-id="${CSS.escape(id)}"]`);

  function select(id: string, focus = false) {
    value = id;
    onselect?.(id);
    if (focus) tabElement(id)?.focus();
  }

  function step(from: number, by: number) {
    select(items[(from + by + items.length) % items.length].id, true);
  }

  async function close(id: string) {
    const hadFocus = list.contains(document.activeElement);
    onclose?.(id);
    // The tab that had the focus is gone: the focus goes to the tab that is now in the Tab order,
    // not to the top of the page.
    await tick();
    if (hadFocus && !list.contains(document.activeElement) && tabbableId) tabElement(tabbableId)?.focus();
  }

  function handleKeydown(event: KeyboardEvent) {
    const owner = (event.target as Element).closest<HTMLElement>("[data-tab-id]");
    const current = items.findIndex((item) => item.id === (owner?.dataset.tabId ?? tabbableId));
    if (current < 0) return;
    if (event.key === "ArrowRight") step(current, 1);
    else if (event.key === "ArrowLeft") step(current, -1);
    else if (event.key === "Home") step(0, 0);
    else if (event.key === "End") step(items.length - 1, 0);
    else if (event.key === "Delete" && items[current].closable) close(items[current].id);
    else return;
    event.preventDefault();
  }

  // A middle click closes, as in a browser. The press itself would start autoscroll.
  function handleMousedown(event: MouseEvent) {
    if (event.button === 1) event.preventDefault();
  }
  function handleAuxclick(event: MouseEvent, item: Item) {
    if (event.button !== 1 || !item.closable) return;
    event.preventDefault();
    close(item.id);
  }
</script>

<!-- The arrow keys are handled for the tabs inside; the list itself is not a control. -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<div
  class="tln-tabs"
  role="tablist"
  aria-label={label}
  data-size={size}
  bind:this={list}
  onkeydown={handleKeydown}
>
  {#each items as item (item.id)}
    {@const selected = item.id === value}
    {@const slot = item.closable || item.dirty}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="tln-tab"
      data-selected={selected}
      data-closable={item.closable ? "true" : undefined}
      data-dirty={item.dirty ? "true" : undefined}
      onmousedown={handleMousedown}
      onauxclick={(event) => handleAuxclick(event, item)}
    >
      <button
        type="button"
        class="tln-tab-button tln-action"
        data-variant={selected ? "secondary" : "quiet"}
        role="tab"
        id="{uid}-{item.id}"
        data-tab-id={item.id}
        title={item.title}
        aria-selected={selected}
        tabindex={item.id === tabbableId ? 0 : -1}
        onclick={() => select(item.id)}
      >
        {#if item.icon}<Icon icon={item.icon} />{/if}
        <span class="tln-tab-label">{item.label}</span>
        {#if slot}
          <!-- The end of the tab. A dirty tab shows the dot here; the close button lies over it. -->
          <span class="tln-tab-end">
            {#if item.dirty}<span class="tln-tab-dirty" role="img" aria-label="unsaved changes"></span>{/if}
          </span>
        {/if}
      </button>
      {#if item.closable}
        <!-- Reachable by the keyboard in two ways: the Delete key on the tab, and Tab from the selected tab. -->
        <button
          type="button"
          class="tln-tab-close tln-action"
          data-variant="quiet"
          tabindex={item.id === tabbableId ? 0 : -1}
          aria-label="Close {item.label}"
          title="Close {item.label}"
          onclick={() => close(item.id)}
        >
          <Icon icon={X} />
        </button>
      {/if}
    </div>
  {/each}
</div>

<style>
  /*
   * The strip holds controls, so it is content (it has no surface of its own: it sits on whatever
   * holds it). A tab is an action: the selected one is raised, the others are quiet, as a link is.
   * How an action looks is in looks.css; this file has the layout and the end of the tab.
   */
  .tln-tabs {
    --tab-pad-y: calc(var(--tln-space) * 1.5 + 1px);
    --tab-pad-x: calc(var(--tln-space) * 3 + 1px);
    display: flex;
    gap: var(--tln-space);
    /* Room for the shadow of the raised tab: a scrolling box clips whatever is outside it. */
    padding: calc(var(--tln-space) * 2);
    overflow-x: auto;
  }

  .tln-tabs[data-size="sm"] {
    --tab-pad-y: var(--tln-space);
    --tab-pad-x: calc(var(--tln-space) * 2);
    gap: 0;
    padding: calc(var(--tln-space) * 1.5);
  }

  .tln-tab {
    position: relative;
    display: inline-flex;
    flex: none;
  }

  .tln-tab-button {
    display: inline-flex;
    align-items: center;
    gap: calc(var(--tln-space) * 2);
    padding: var(--tab-pad-y) var(--tab-pad-x);
    font: inherit;
    font-size: var(--tln-text-sm);
    line-height: var(--tln-leading);
    white-space: nowrap;
  }

  .tln-tabs[data-size="sm"] .tln-tab-button {
    font-size: var(--tln-text-xs);
  }

  /* A raised tab has to stay readable when it is not the one under the pointer. */
  .tln-tab[data-selected="true"] .tln-tab-button {
    color: var(--tln-fg);
  }

  /* The end of the tab is as wide as the close button, so that the label does not move when the dot becomes it. */
  .tln-tab-end {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1em;
    height: 1em;
    margin-left: var(--tln-space);
    margin-right: calc(var(--tln-space) * -0.5);
  }

  .tln-tab-dirty {
    width: calc(var(--tln-space) * 2);
    height: calc(var(--tln-space) * 2);
    background: var(--tln-accent);
    border-radius: 50%;
  }

  .tln-tab-close {
    position: absolute;
    top: 50%;
    right: calc(var(--tab-pad-x) - var(--tln-space) * 1.5);
    display: inline-flex;
    padding: var(--tln-space) calc(var(--tln-space) * 1);
    font-size: inherit;
    line-height: 1;
    transform: translateY(-50%);
    /* Hidden until wanted; opacity, not display, so the keyboard can still arrive and show it. */
    opacity: 0;
  }

  .tln-tabs[data-size="sm"] .tln-tab-close {
    font-size: var(--tln-text-xs);
  }

  /* Shown: under the pointer, with the focus inside, or on the selected tab when there is no dot to replace. */
  .tln-tab[data-closable="true"]:is(:hover, :focus-within) .tln-tab-close,
  .tln-tab[data-closable="true"][data-selected="true"]:not([data-dirty="true"]) .tln-tab-close {
    opacity: 1;
  }

  .tln-tab[data-closable="true"]:is(:hover, :focus-within) .tln-tab-dirty {
    opacity: 0;
  }

  /*
   * Without a pointer to hover with, there is no way to ask for the button: the selected tab always
   * shows it (in place of the dot), and a hidden one cannot be hit by a tap meant for the tab.
   */
  @media (hover: none) {
    .tln-tab-close {
      pointer-events: none;
    }
    .tln-tab[data-closable="true"][data-selected="true"] .tln-tab-close {
      opacity: 1;
      pointer-events: auto;
    }
    .tln-tab[data-closable="true"][data-selected="true"] .tln-tab-dirty {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    .tln-tab-close {
      transition:
        opacity var(--tln-transition),
        background-color var(--tln-transition);
    }
    .tln-tab-dirty {
      transition: opacity var(--tln-transition);
    }
  }
</style>
