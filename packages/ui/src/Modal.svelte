<script lang="ts">
  import type { Snippet } from "svelte";
  import IconButton from "./IconButton.svelte";
  import { X } from "./icons.generated.js";

  let {
    open = $bindable(false),
    title,
    size = "md",
    onclose,
    onrequestclose,
    children,
    footer,
  }: {
    open?: boolean;
    /** The accessible name of the dialog, also shown in its header. */
    title: string;
    /** sm and md are centered boxes. full covers the whole viewport. */
    size?: "sm" | "md" | "full";
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
  class="tln-modal"
  data-size={size}
  aria-labelledby={titleId}
  onclose={handleClose}
  onclick={handleClick}
  onkeydown={handleKeydown}
  oncancel={(event) => {
    // Other ways the browser asks to close it (the back gesture on a phone) come the same way.
    event.preventDefault();
    requestClose();
  }}
>
  <header class="tln-modal-header">
    <h2 class="tln-modal-title" id={titleId}>{title}</h2>
    <IconButton icon={X} label="Close" onclick={requestClose} />
  </header>
  <div class="tln-modal-body">
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
    color: var(--tln-fg);
    /* A float: content lifted in front of the page. Its buttons are the action layer on it. */
    background: var(--tln-content);
    border: 0;
    border-radius: var(--tln-radius);
    box-shadow: var(--tln-shadow-float);
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
  .tln-modal[data-size="full"] {
    width: 100vw;
    height: 100vh;
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
    border-bottom: 1px solid var(--tln-border);
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

  .tln-modal-footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: calc(var(--tln-space) * 2);
    padding: calc(var(--tln-space) * 3) calc(var(--tln-space) * 4);
    border-top: 1px solid var(--tln-border);
    background: var(--tln-tint);
  }
</style>
