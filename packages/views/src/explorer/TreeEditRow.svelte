<script lang="ts">
  import { Icon, Input, type IconData } from "@telaion/primitives";
  import { ChevronDown, ChevronRight } from "@telaion/primitives/icons";
  import { onMount, untrack } from "svelte";
  import type { TreeCheckResult } from "./types.js";

  let {
    depth,
    icon,
    branch = false,
    expanded = false,
    initial,
    original,
    selection,
    label,
    placeholder,
    validate,
    oncommit,
    onfinish,
  }: {
    /** 0 for the top. */
    depth: number;
    icon: IconData;
    /** Renaming a branch: show its chevron so that the row does not shift. */
    branch?: boolean;
    expanded?: boolean;
    initial: string;
    /** The name before a rename. Typing it back is a cancel, not a commit. */
    original?: string;
    selection?: [number, number];
    label: string;
    placeholder?: string;
    validate?: (value: string) => TreeCheckResult;
    oncommit: (value: string) => TreeCheckResult | Promise<TreeCheckResult>;
    /** The edit is over. `restoreFocus`: the field had the focus, so the tree has to take it back. */
    onfinish: (result: "commit" | "cancel", restoreFocus: boolean) => void;
  } = $props();

  // The state machine of a row. It is created for one edit and thrown away at its end.
  //   typing   -> a message from `validate` may appear and disappear as the value changes
  //   Enter    -> commit; refused (by `validate` or by `oncommit`) keeps the row open with the message
  //   Escape   -> cancel
  //   blur     -> commit, but quietly: an empty, unchanged or refused value is a cancel
  //   busy     -> `oncommit` is awaited; the field is read-only and a blur does not count
  let value = $state(untrack(() => initial));
  let message = $state<string | undefined>();
  let busy = $state(false);
  let finished = false;
  let root: HTMLElement | undefined = $state();

  const uid = $props.id();
  const messageId = `${uid}-message`;

  function field(): HTMLInputElement | null {
    return root?.querySelector("input") ?? null;
  }

  onMount(() => {
    const input = field();
    if (!input) return;
    input.focus();
    if (selection) input.setSelectionRange(selection[0], selection[1]);
    else input.select();
  });

  function finish(result: "commit" | "cancel") {
    if (finished) return;
    finished = true;
    onfinish(result, document.activeElement === field());
  }

  async function commit(explicit: boolean) {
    if (finished || busy) return;
    const typed = value.trim();
    if (typed === "" || typed === original?.trim()) return finish("cancel");

    const refused = validate?.(typed);
    if (refused) {
      if (explicit) message = refused;
      else finish("cancel");
      return;
    }

    busy = true;
    let answer: TreeCheckResult;
    try {
      answer = await oncommit(typed);
    } finally {
      busy = false;
    }
    if (answer) {
      message = answer;
      field()?.focus();
      return;
    }
    finish("commit");
  }

  function handleInput() {
    message = validate?.(value.trim()) || undefined;
  }

  function handleKeyDown(e: KeyboardEvent) {
    // Enter that ends an IME composition (Japanese, Chinese, Korean) is not a commit.
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      void commit(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      finish("cancel");
    }
  }

  function handleBlur() {
    // The window lost the focus (another application): the field keeps its place and its text.
    if (finished || busy || !document.hasFocus()) return;
    void commit(false);
  }
</script>

<div class="tln-tree-edit" bind:this={root} data-tln-edit style:--depth={depth}>
  <span class="tln-tree-edit-lead" aria-hidden="true">
    {#if branch}
      <Icon icon={expanded ? ChevronDown : ChevronRight} />
    {/if}
  </span>
  <span class="tln-tree-edit-icon" aria-hidden="true">
    <Icon {icon} />
  </span>
  <Input
    bind:value
    aria-label={label}
    aria-describedby={message ? messageId : undefined}
    aria-busy={busy || undefined}
    readonly={busy}
    {placeholder}
    autocomplete="off"
    spellcheck={false}
    invalid={Boolean(message)}
    size="sm"
    oninput={handleInput}
    onkeydown={handleKeyDown}
    onblur={handleBlur}
  />
  {#if message}
    <p class="tln-tree-edit-message" id={messageId} role="alert">{message}</p>
  {/if}
</div>

<style>
  /* Two rows of three columns: the chevron, the icon and the field, and under the field its message. */
  .tln-tree-edit {
    box-sizing: border-box;
    display: grid;
    grid-template-columns: auto auto minmax(0, 1fr);
    align-items: center;
    column-gap: calc(var(--tln-space) * 1.5);
    padding-left: calc(var(--tln-space) * (3 + 4 * var(--depth)));
    padding-right: calc(var(--tln-space) * 3);
  }

  /* The same boxes as a row, so the icon and the text start where they did before the edit. */
  .tln-tree-edit-lead {
    font-size: var(--tln-text-sm);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: calc(var(--tln-space) * 4);
    height: calc(var(--tln-space) * 4);
    color: var(--tln-fg-muted);
  }

  .tln-tree-edit-icon {
    font-size: var(--tln-text-sm);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--tln-fg-muted);
  }

  .tln-tree-edit-message {
    grid-column: 3;
    margin: var(--tln-space) 0 0;
    font-size: var(--tln-text-xs);
    line-height: var(--tln-leading);
    color: var(--tln-danger);
  }
</style>
