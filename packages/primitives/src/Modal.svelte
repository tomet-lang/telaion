<script lang="ts">
  import type { Snippet } from "svelte";
  import IconButton from "./IconButton.svelte";
  import { X } from "./icons.generated.js";
  import "./looks.css";

  let {
    open = $bindable(false),
    title,
    hideTitle = false,
    closeButton = true,
    size = "md",
    placement = "center",
    flush = false,
    role = "dialog",
    describedby,
    onclose,
    onrequestclose,
    children,
    footer,
  }: {
    open?: boolean;
    /** The accessible name of the dialog. Required, also when it is not shown (see `hideTitle`). */
    title: string;
    /**
     * Do not show the title: the dialog has no header, and `title` is only its accessible name.
     * For a dialog that is plain about what it is, such as a command palette. It then has no
     * close button either; Escape and the backdrop close it.
     */
    hideTitle?: boolean;
    /** The close button in the header. Turn it off where the footer already offers the way out. */
    closeButton?: boolean;
    /** sm, md and lg are boxes of increasing width. full covers the whole viewport. */
    size?: "sm" | "md" | "lg" | "full";
    /** center puts the box in the middle of the window, top near the top edge (a palette). */
    placement?: "center" | "top";
    /** The body has no padding of its own, for content that brings its own, such as a list. */
    flush?: boolean;
    /** alertdialog is for a dialog that interrupts to ask for an answer, as a confirmation does. */
    role?: "dialog" | "alertdialog";
    /** The id of the element in the body that describes the dialog; read out after its name. */
    describedby?: string;
    /** Called whenever the modal closes, however it was closed. */
    onclose?: () => void;
    /**
     * Called when the person asks to close the modal: Escape, the close button, or a click on the
     * backdrop. Return `false` to refuse, for example to ask about unsaved changes first. Closing
     * by setting `open` to false is the application's own decision and is not asked about.
     */
    onrequestclose?: () => boolean | void;
    /**
     * The body. To choose which control gets the focus first, put `autofocus` on it;
     * otherwise the browser focuses the first focusable element, which is the close button.
     */
    children: Snippet;
    /**
     * Buttons under the body. To submit a form that sits in the body, give the form an id
     * and the submit button `form={id}`; Enter in a field then submits it as usual.
     */
    footer?: Snippet;
  } = $props();

  const uid = $props.id();
  const titleId = `${uid}-title`;
  let dialog: HTMLDialogElement;

  // The native <dialog> does the hard parts: it makes the page behind it inert,
  // closes on Escape, and returns the focus to the opener.
  $effect(() => {
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  });

  function handleClose() {
    open = false;
    onclose?.();
  }

  // Everything the person does to close the modal goes through here, so the application can refuse.
  function requestClose() {
    if (onrequestclose?.() === false) return;
    dialog.close();
  }

  // The dialog has no padding, so a click whose target is the dialog itself landed on the backdrop.
  function handleClick(event: MouseEvent) {
    if (event.target === dialog) requestClose();
  }

  const focusable =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  // Left alone, Tab from the last control leaves the page for the browser's own interface.
  // Wrap around instead, as the WAI-ARIA dialog pattern asks.
  function handleKeydown(event: KeyboardEvent) {
    // Escape is taken here, before the browser starts to close the dialog. Refusing it in the
    // dialog's own cancel event is not enough: Chrome closes on a second Escape regardless.
    if (event.key === "Escape" && !event.isComposing) {
      event.preventDefault();
      requestClose();
      return;
    }
    if (event.key !== "Tab") return;
    const items = [...dialog.querySelectorAll<HTMLElement>(focusable)].filter(
      (element) => element.getClientRects().length > 0,
    );
    if (items.length === 0) {
      event.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog
  bind:this={dialog}
  class="tln-modal tln-float"
  data-size={size}
  data-placement={placement}
  {role}
  aria-labelledby={hideTitle ? undefined : titleId}
  aria-label={hideTitle ? title : undefined}
  aria-describedby={describedby}
  onclose={handleClose}
  onclick={handleClick}
  onkeydown={handleKeydown}
  oncancel={(event) => {
    // Other ways the browser asks to close it (the back gesture on a phone) come the same way.
    event.preventDefault();
    requestClose();
  }}
>
  {#if !hideTitle}
    <header class="tln-modal-header">
      <h2 class="tln-modal-title" id={titleId}>{title}</h2>
      {#if closeButton}
        <IconButton icon={X} label="Close" onclick={requestClose} />
      {/if}
    </header>
  {/if}
  <div class="tln-modal-body" data-flush={flush || undefined}>
    {@render children()}
  </div>
  {#if footer}
    <footer class="tln-modal-footer">
      {@render footer()}
    </footer>
  {/if}
</dialog>

<style>
  .tln-modal {
    box-sizing: border-box;
    /* A modal dialog is centered by the browser's margin: auto. A CSS reset (Tailwind's preflight
       is one) sets every margin to 0 and would pin the dialog to a corner, so say it here. */
    margin: auto;
    padding: 0;
    border: 0;
    /* What it looks like (content tone, radius, float shadow) is .tln-float in looks.css, shared with Floating. */
    transition: box-shadow var(--tln-track);
    max-width: calc(100vw - var(--tln-space) * 8);
    max-height: calc(100vh - var(--tln-space) * 8);
  }

  /* Only while open: setting display on a closed dialog would show it. */
  .tln-modal[open] {
    display: flex;
    flex-direction: column;
  }

  .tln-modal::backdrop {
    background: var(--tln-scrim);
  }

  .tln-modal[data-size="sm"] {
    width: calc(var(--tln-space) * 96);
  }
  .tln-modal[data-size="md"] {
    width: calc(var(--tln-space) * 120);
  }
  .tln-modal[data-size="lg"] {
    width: calc(var(--tln-space) * 160);
  }

  /* Near the top edge, where a palette is looked for. The box takes the room that is left below. */
  .tln-modal[data-placement="top"] {
    margin: calc(var(--tln-space) * 16) auto auto;
    max-height: calc(100vh - var(--tln-space) * 24);
  }

  /* After the placement, so that the full size wins over it. It covers the page, so it is no longer
     lifted in front of it: it casts nothing and has no corners (undoing .tln-float). */
  .tln-modal[data-size="full"] {
    width: 100vw;
    height: 100vh;
    margin: 0;
    max-width: none;
    max-height: none;
    border-radius: 0;
    box-shadow: none;
  }

  .tln-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: calc(var(--tln-space) * 3);
    padding: calc(var(--tln-space) * 3) calc(var(--tln-space) * 4);
    border-bottom: var(--tln-hairline) solid var(--tln-border);
  }

  .tln-modal-title {
    margin: 0;
    font-size: var(--tln-text-md);
  }

  .tln-modal-body {
    padding: calc(var(--tln-space) * 4);
    font-size: var(--tln-text-sm);
    overflow: auto;
    flex: 1;
  }

  .tln-modal-body[data-flush] {
    padding: 0;
  }

  .tln-modal-footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: calc(var(--tln-space) * 2);
    padding: calc(var(--tln-space) * 3) calc(var(--tln-space) * 4);
    border-top: var(--tln-hairline) solid var(--tln-border);
    background: var(--tln-tint);
  }
</style>
