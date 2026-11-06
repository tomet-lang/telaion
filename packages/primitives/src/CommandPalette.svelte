<script lang="ts" generics="T extends PaletteItem">
  import type { Snippet } from "svelte";
  import Icon from "./Icon.svelte";
  import Input from "./Input.svelte";
  import Modal from "./Modal.svelte";
  import type { PaletteItem } from "./palette-item.js";

  let {
    open = $bindable(false),
    query = $bindable(""),
    items,
    onselect,
    label = "Command palette",
    placeholder = "",
    empty = "No results",
    closeOnSelect = true,
    onclose,
    footer,
  }: {
    open?: boolean;
    /**
     * What is typed. The palette does not filter: the application puts into `items` what it wants
     * shown for this query, in the order it wants, so the matching (fuzzy, ranked, remote) is its own.
     * Cleared when the palette closes.
     */
    query?: string;
    items: T[];
    /** The person chose an item: Enter on the active one, or a click. */
    onselect?: (item: T) => void;
    /** The accessible name of the palette and of its text field. Not shown. */
    label?: string;
    placeholder?: string;
    /** Shown instead of the list when `items` is empty. */
    empty?: string;
    /** Close the palette after a choice. Turn off for a palette that goes on to a second step. */
    closeOnSelect?: boolean;
    /** Called when the palette has closed, however it was closed. */
    onclose?: () => void;
    /** Under the list: key hints, a count. Left aligned; it is not a row of buttons. */
    footer?: Snippet;
  } = $props();

  const uid = $props.id();
  const listId = `${uid}-list`;
  const optionId = (index: number) => `${uid}-option-${index}`;
  let list = $state<HTMLElement>();

  // The row the arrow keys and the pointer have chosen. Kept as a position; what it means for the
  // current items is worked out below, so that new items never leave it dangling or on a disabled row.
  let position = $state(0);

  const usable = (index: number) => items[index] !== undefined && !items[index].disabled;
  const first = $derived(items.findIndex((item) => !item.disabled));
  const active = $derived(usable(position) ? position : first);

  // Moves to the next row that can be chosen, around the ends. Disabled rows are stepped over.
  function move(step: 1 | -1) {
    if (first < 0) return;
    let next = active;
    for (let i = 0; i < items.length; i++) {
      next = (next + step + items.length) % items.length;
      if (usable(next)) break;
    }
    position = next;
    // Only the keyboard scrolls: under a pointer that is standing still, a list that scrolls by itself
    // would keep changing the row under it.
    list?.children[next]?.scrollIntoView({ block: "nearest" });
  }

  function select(item: T) {
    if (item.disabled) return;
    if (closeOnSelect) open = false;
    onselect?.(item);
  }

  function handleKeydown(event: KeyboardEvent) {
    // Enter and the arrows also drive the conversion of text in Japanese and similar input methods.
    if (event.isComposing || event.keyCode === 229) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      move(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      select(items[active]);
    }
  }

  // A new query starts again at the top.
  function handleInput() {
    position = 0;
    if (list) list.scrollTop = 0;
  }

  function handleClose() {
    query = "";
    position = 0;
    onclose?.();
  }
</script>

{#snippet hints()}
  <div class="tln-palette-footer">{@render footer?.()}</div>
{/snippet}

<Modal
  bind:open
  title={label}
  hideTitle
  placement="top"
  size="lg"
  flush
  onclose={handleClose}
  footer={footer ? hints : undefined}
>
  <!-- Nothing is built while it is closed: a palette may stand over thousands of rows. -->
  {#if open}
    <div class="tln-palette">
      <div class="tln-palette-query">
        <Input
          bind:value={query}
          autofocus
          autocomplete="off"
          spellcheck={false}
          {placeholder}
          role="combobox"
          aria-label={label}
          aria-expanded={items.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? optionId(active) : undefined}
          oninput={handleInput}
          onkeydown={handleKeydown}
        />
      </div>
      {#if items.length === 0}
        <p class="tln-palette-empty" role="status">{empty}</p>
      {:else}
        <!-- The focus stays in the text field; the options are reached with aria-activedescendant. -->
        <ul class="tln-palette-list" id={listId} role="listbox" aria-label={label} bind:this={list}>
          {#each items as item, index (item.id)}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <li
              class="tln-palette-option"
              id={optionId(index)}
              role="option"
              aria-selected={index === active}
              aria-disabled={item.disabled || undefined}
              data-active={index === active || undefined}
              onpointermove={() => {
                if (usable(index)) position = index;
              }}
              onpointerdown={(event) => event.preventDefault()}
              onclick={() => select(item)}
            >
              {#if item.icon}
                <span class="tln-palette-icon"><Icon icon={item.icon} /></span>
              {/if}
              <span class="tln-palette-text">
                <span class="tln-palette-label">{item.label}</span>
                {#if item.detail}<span class="tln-palette-detail">{item.detail}</span>{/if}
              </span>
              {#if item.hint}<span class="tln-palette-hint">{item.hint}</span>{/if}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</Modal>

<style>
  .tln-palette-query {
    padding: calc(var(--tln-space) * 3);
  }

  .tln-palette-list {
    margin: 0;
    padding: calc(var(--tln-space) * 1.5);
    list-style: none;
    max-height: calc(var(--tln-space) * 96);
    overflow-y: auto;
    border-top: 1px solid var(--tln-border);
  }

  .tln-palette-option {
    display: flex;
    align-items: center;
    gap: calc(var(--tln-space) * 3);
    padding: calc(var(--tln-space) * 2) calc(var(--tln-space) * 3);
    border-radius: var(--tln-radius);
    cursor: pointer;
    user-select: none;
  }

  /* The active row is the one Enter chooses. It is a state, so it takes the accent's soft fill. */
  .tln-palette-option[data-active] {
    background: var(--tln-accent-soft);
  }

  .tln-palette-option[aria-disabled="true"] {
    color: var(--tln-fg-muted);
    cursor: not-allowed;
  }

  .tln-palette-icon {
    display: inline-flex;
    font-size: var(--tln-text-md);
    color: var(--tln-fg-muted);
  }

  .tln-palette-text {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  .tln-palette-label,
  .tln-palette-detail {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tln-palette-label {
    font-size: var(--tln-text-sm);
    line-height: var(--tln-leading);
  }

  .tln-palette-detail {
    font-size: var(--tln-text-xs);
    color: var(--tln-fg-muted);
  }

  .tln-palette-hint {
    flex: none;
    font-size: var(--tln-text-xs);
    color: var(--tln-fg-muted);
  }

  .tln-palette-empty {
    margin: 0;
    padding: calc(var(--tln-space) * 6) calc(var(--tln-space) * 3);
    border-top: 1px solid var(--tln-border);
    text-align: center;
    font-size: var(--tln-text-sm);
    color: var(--tln-fg-muted);
  }

  .tln-palette-footer {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: calc(var(--tln-space) * 1) calc(var(--tln-space) * 4);
    font-size: var(--tln-text-xs);
    color: var(--tln-fg-muted);
  }
</style>
