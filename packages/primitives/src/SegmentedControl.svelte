<script lang="ts">
  import Icon from "./Icon.svelte";
  import type { IconData } from "./icon-data.js";
  import "./looks.css";

  type Item = {
    value: string;
    /** The name of the choice. Always required: with `iconOnly` it is the tooltip and the accessible name. */
    label: string;
    icon?: IconData;
    /** The tooltip. Defaults to the label when only the icon is shown. */
    title?: string;
    disabled?: boolean;
  };

  let {
    items,
    value = $bindable(""),
    label,
    size = "md",
    iconOnly = false,
    disabled = false,
    onchange,
  }: {
    items: Item[];
    /** The value of the chosen item. */
    value?: string;
    /** Names the group for assistive technology: what is being chosen. */
    label: string;
    /** sm: compact, for a dense panel or a toolbar. */
    size?: "md" | "sm";
    /** Shows only the icons. Every item needs an icon then. */
    iconOnly?: boolean;
    disabled?: boolean;
    /** Called when the person chooses; not when `value` is set by the application. */
    onchange?: (value: string) => void;
  } = $props();

  let group: HTMLDivElement;

  const available = (item: Item) => !disabled && !item.disabled;

  // Exactly one item is in the Tab order: the chosen one, or the first available if nothing is chosen.
  const tabbable = $derived(items.find((item) => item.value === value && available(item)) ?? items.find(available));

  function choose(item: Item, focus = false) {
    if (!available(item)) return;
    if (item.value !== value) {
      value = item.value;
      onchange?.(item.value);
    }
    if (focus) group.querySelector<HTMLElement>(`[data-value="${CSS.escape(item.value)}"]`)?.focus();
  }

  /** The next available item from index `from`, going `by` steps (1 or -1) and wrapping around. */
  function neighbour(from: number, by: 1 | -1): Item | undefined {
    for (let i = 1; i <= items.length; i++) {
      const item = items[(from + by * i + items.length * i) % items.length];
      if (available(item)) return item;
    }
  }

  // A radio group: the arrow keys move the choice, as they do in a native one.
  function handleKeydown(event: KeyboardEvent) {
    const owner = (event.target as Element).closest<HTMLElement>("[data-value]");
    const from = items.findIndex((item) => item.value === owner?.dataset.value);
    if (from < 0) return;
    let target: Item | undefined;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") target = neighbour(from, 1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") target = neighbour(from, -1);
    else if (event.key === "Home") target = items.find(available);
    else if (event.key === "End") target = items.filter(available).at(-1);
    else return;
    // Handled even when there is nowhere to go, so that a Toolbar around this does not take the key.
    event.preventDefault();
    if (target) choose(target, true);
  }
</script>

<!-- The keys are handled for the radios inside; the group itself is not a control. -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<div
  class="tln-segmented"
  role="radiogroup"
  aria-label={label}
  data-size={size}
  bind:this={group}
  onkeydown={handleKeydown}
>
  {#each items as item (item.value)}
    {@const checked = item.value === value}
    <button
      type="button"
      class="tln-segment tln-action"
      data-variant={checked ? "secondary" : "quiet"}
      data-value={item.value}
      role="radio"
      aria-checked={checked}
      aria-label={iconOnly ? item.label : undefined}
      title={item.title ?? (iconOnly ? item.label : undefined)}
      tabindex={item === tabbable ? 0 : -1}
      disabled={!available(item)}
      onclick={() => choose(item)}
    >
      {#if item.icon}<Icon icon={item.icon} />{/if}
      {#if !iconOnly}{item.label}{/if}
    </button>
  {/each}
</div>

<style>
  /*
   * A well with the chosen item raised in it: the well is where a choice is cut in, and the chosen
   * item is the one action that stands out of it. Exactly one look for "chosen", whatever the choice means.
   * How an action and a well look is in looks.css and tokens.css; this file has the layout.
   */
  .tln-segmented {
    display: inline-flex;
    gap: var(--tln-space);
    /* Room for the shadow of the raised item inside the well. */
    padding: calc(var(--tln-space) * 1.5);
    background: var(--tln-well);
    border-radius: var(--tln-radius);
    box-shadow: var(--tln-shadow-well);
    max-width: 100%;
  }

  .tln-segment {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: calc(var(--tln-space) * 2);
    padding: var(--tln-space) calc(var(--tln-space) * 3);
    font: inherit;
    font-size: var(--tln-text-sm);
    line-height: var(--tln-leading);
    white-space: nowrap;
  }

  .tln-segmented[data-size="sm"] .tln-segment {
    padding: calc(var(--tln-space) * 0.5) calc(var(--tln-space) * 2);
    font-size: var(--tln-text-xs);
  }

  /* The chosen item stays readable at rest; the quiet ones are muted until the pointer is on them. */
  .tln-segment[aria-checked="true"] {
    color: var(--tln-fg);
  }
</style>
